// 行控中心 - 行程卡片牆 + 即時狀態

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trip, TripStatus, Driver } from '@/types';
import { getTrips, getDrivers, updateTripStatus, assignDriver, updateTripPriceBoost } from '@/lib/data';
import TripCard from '@/components/TripCard';

export default function ControlPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'all'>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  // 載入資料
  const loadData = useCallback(async () => {
    const [tripsData, driversData] = await Promise.all([
      getTrips(),
      getDrivers()
    ]);
    setTrips(tripsData);
    setDrivers(driversData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    // 設定定時刷新（每 30 秒）
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // 過濾行程
  const filteredTrips = trips.filter(trip => {
    if (statusFilter === 'all') return true;
    return trip.status === statusFilter;
  });

  // 統計數字
  const stats = {
    total: trips.length,
    open: trips.filter(t => t.status === 'open').length,
    accepted: trips.filter(t => t.status === 'accepted').length,
    inProgress: trips.filter(t => ['arrived', 'picked_up'].includes(t.status)).length,
    completed: trips.filter(t => t.status === 'completed').length
  };

  // 處理派單
  const handleAssignDriver = (tripId: string) => {
    setSelectedTripId(tripId);
    setShowAssignModal(true);
  };

  // 確認分配司機
  const handleConfirmAssign = async (driverId: string) => {
    if (selectedTripId && driverId) {
      await assignDriver(selectedTripId, driverId);
      await loadData();
      setShowAssignModal(false);
      setSelectedTripId('');
    }
  };

  // 處理加價
  const handleUpdatePrice = async (tripId: string, boostAmount: number) => {
    await updateTripPriceBoost(tripId, boostAmount);
    await loadData();
  };

  // 處理撤單
  const handleCancel = async (tripId: string) => {
    if (confirm('確定要撤銷這張訂單嗎？')) {
      await updateTripStatus(tripId, 'cancelled');
      await loadData();
    }
  };

  return (
    <div>
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#fafaf9] mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          行控中心
        </h1>
        <p className="text-[#a8a29e]">即時監控所有行程狀態</p>
      </div>

      {/* 統計儀表板 */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-[#fafaf9]">{stats.total}</div>
          <div className="text-xs text-[#a8a29e]">總行程</div>
        </div>
        <div className="glass-card p-4 text-center border border-red-500/30">
          <div className="text-2xl font-bold text-red-400">{stats.open}</div>
          <div className="text-xs text-[#a8a29e]">待接單</div>
        </div>
        <div className="glass-card p-4 text-center border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">{stats.accepted}</div>
          <div className="text-xs text-[#a8a29e]">已接單</div>
        </div>
        <div className="glass-card p-4 text-center border border-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
          <div className="text-xs text-[#a8a29e]">服務中</div>
        </div>
        <div className="glass-card p-4 text-center border border-gray-500/30">
          <div className="text-2xl font-bold text-gray-400">{stats.completed}</div>
          <div className="text-xs text-[#a8a29e]">已完成</div>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            statusFilter === 'all' ? 'bg-[#d4af37] text-[#0c0a09]' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setStatusFilter('open')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            statusFilter === 'open' ? 'bg-red-500 text-white' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'
          }`}
        >
          待接單
        </button>
        <button
          onClick={() => setStatusFilter('accepted')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            statusFilter === 'accepted' ? 'bg-green-500 text-white' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'
          }`}
        >
          已接單
        </button>
        <button
          onClick={() => setStatusFilter('arrived')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            statusFilter === 'arrived' ? 'bg-blue-500 text-white' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'
          }`}
        >
          已抵達
        </button>
        <button
          onClick={() => setStatusFilter('picked_up')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            statusFilter === 'picked_up' ? 'bg-purple-500 text-white' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'
          }`}
        >
          已上車
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            statusFilter === 'completed' ? 'bg-gray-500 text-white' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'
          }`}
        >
          已完成
        </button>
      </div>

      {/* 行程卡片牆 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-[#292524] rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-[#292524] rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-[#292524] rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.map((trip, index) => (
            <div 
              key={trip.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TripCard 
                trip={trip}
                onAssignDriver={handleAssignDriver}
                onCancel={handleCancel}
                onComplete={handleComplete}
                onUpdatePrice={handleUpdatePrice}
                showChat={true}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-[#a8a29e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-[#a8a29e]">沒有符合條件的行程</p>
        </div>
      )}

      {/* 派單 Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#fafaf9] mb-4">選擇司機</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {drivers.map(driver => (
                <button
                  key={driver.id}
                  onClick={() => handleConfirmAssign(driver.id)}
                  className="w-full p-3 rounded-lg bg-[#1c1917] border border-[#292524] hover:border-[#d4af37] transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#fafaf9]">{driver.name}</p>
                      <p className="text-xs text-[#a8a29e]">{driver.car_color} {driver.car_plate}</p>
                    </div>
                    <span className="text-xs text-[#d4af37]">{driver.phone}</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAssignModal(false)}
              className="mt-4 w-full py-2 border border-[#292524] rounded-lg text-[#a8a29e] hover:text-[#fafaf9] transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
