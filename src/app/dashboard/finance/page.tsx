// 帳務中心 - 統計與管理

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Transaction, Trip, FinanceStats } from '@/types';
import { getTrips, getFinanceStats, completeTransaction } from '@/lib/data';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'customer_pay' | 'driver_kickback'>('customer_pay');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinanceStats>({
    totalTrips: 0,
    totalAmount: 0,
    pendingAmount: 0,
    completedAmount: 0
  });

  // 載入資料
  const loadData = useCallback(async () => {
    const tripsData = await getTrips();
    setTrips(tripsData);
    
    const statsData = await getFinanceStats(activeTab);
    setStats(statsData);
    
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 依付款模式過濾
  const filteredTrips = trips.filter(t => {
    if (activeTab === 'customer_pay') {
      return t.payment_mode === 'customer_pay';
    } else {
      return t.payment_mode === 'driver_kickback';
    }
  });

  // 待處理的行程
  const pendingTrips = filteredTrips.filter(t => 
    t.status !== 'completed' && t.status !== 'cancelled'
  );

  // 已完成的行程
  const completedTrips = filteredTrips.filter(t => 
    t.status === 'completed'
  );

  // 格式化金額
  const formatAmount = (amount: number) => {
    return amount.toLocaleString();
  };

  // 格式化日期
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };

  // 格式化時間
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <div>
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#fafaf9] mb-2">帳務中心</h1>
        <p className="text-[#a8a29e]">管理收付款項與司機結算</p>
      </div>

      {/* TAB 切換 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('customer_pay')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            activeTab === 'customer_pay' 
              ? 'bg-[#d4af37] text-[#0c0a09] font-medium' 
              : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524] hover:border-[#d4af37]'
          }`}
        >
          客下匯款
        </button>
        <button
          onClick={() => setActiveTab('driver_kickback')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            activeTab === 'driver_kickback' 
              ? 'bg-[#d4af37] text-[#0c0a09] font-medium' 
              : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524] hover:border-[#d4af37]'
          }`}
        >
          司機回金
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4">
          <div className="text-xs text-[#a8a29e] mb-1">總筆數</div>
          <div className="text-2xl font-bold text-[#fafaf9]">{filteredTrips.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-[#a8a29e] mb-1">總金額</div>
          <div className="text-2xl font-bold text-[#d4af37]">${formatAmount(filteredTrips.reduce((sum, t) => sum + t.amount, 0))}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-[#a8a29e] mb-1">待確認</div>
          <div className="text-2xl font-bold text-orange-400">${formatAmount(pendingTrips.reduce((sum, t) => sum + t.amount, 0))}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-[#a8a29e] mb-1">已完成</div>
          <div className="text-2xl font-bold text-green-400">${formatAmount(completedTrips.reduce((sum, t) => sum + t.amount, 0))}</div>
        </div>
      </div>

      {/* 待處理帳務 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#fafaf9] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
          待處理 ({pendingTrips.length})
        </h2>
        
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="h-4 bg-[#292524] rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : pendingTrips.length > 0 ? (
          <div className="space-y-2">
            {pendingTrips.map((trip, index) => (
              <div 
                key={trip.id}
                className="glass-card p-4 flex items-center justify-between animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-[#fafaf9]">
                      {trip.pickup_area} → {trip.dropoff_area}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      trip.status === 'open' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {trip.status === 'open' ? '待接單' : '已接單'}
                    </span>
                  </div>
                  <div className="text-xs text-[#a8a29e]">
                    {formatDate(trip.service_date)} {formatTime(trip.service_time)}
                    {trip.driver && ` • ${trip.driver.name}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-[#d4af37]">
                    ${formatAmount(trip.amount)}
                  </div>
                  <div className="text-xs text-[#a8a29e]">
                    回金: ${formatAmount(trip.driver_fee)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-[#a8a29e]">沒有待處理的帳務</p>
          </div>
        )}
      </div>

      {/* 已完成帳務 */}
      <div>
        <h2 className="text-lg font-semibold text-[#fafaf9] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          已完成 ({completedTrips.length})
        </h2>
        
        {completedTrips.length > 0 ? (
          <div className="space-y-2">
            {completedTrips.map((trip, index) => (
              <div 
                key={trip.id}
                className="glass-card p-4 flex items-center justify-between opacity-70"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-[#fafaf9]">
                      {trip.pickup_area} → {trip.dropoff_area}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">
                      已完成
                    </span>
                  </div>
                  <div className="text-xs text-[#a8a29e]">
                    {formatDate(trip.service_date)} {formatTime(trip.service_time)}
                    {trip.driver && ` • ${trip.driver.name}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-400">
                    ${formatAmount(trip.amount)}
                  </div>
                  <div className="text-xs text-[#a8a29e]">
                    回金: ${formatAmount(trip.driver_fee)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-[#a8a29e]">沒有已完成的帳務</p>
          </div>
        )}
      </div>
    </div>
  );
}
