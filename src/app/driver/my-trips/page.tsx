// 我的行程 — 司機端
'use client';

import { useState } from 'react';
import { useDriver } from '@/lib/driverContext';
import { Trip } from '@/types';

type TabMode = 'active' | 'completed';

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    accepted: '已接單',
    arrived: '已抵達',
    picked_up: '已上車',
    completed: '已完成',
  };
  return map[status] || status;
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    accepted: 'status-accepted',
    arrived: 'status-arrived',
    picked_up: 'status-picked_up',
    completed: 'status-completed',
  };
  return map[status] || '';
}

function TripDetailCard({ trip, showIncome }: { trip: Trip; showIncome?: boolean }) {
  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const formatTime = (time: string) => time?.slice(0, 5) || '';

  return (
    <div className="glass-card p-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(trip.status)}`}>
            {getStatusText(trip.status)}
          </span>
          <span className="text-xs text-[#a8a29e]">
            {trip.service_type === 'dropoff' ? '送機' : '接機'}
          </span>
        </div>
        <span className="text-sm font-semibold text-[#d4af37]">${trip.amount}</span>
      </div>

      {/* 路線 */}
      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22c55e] mt-1.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{trip.pickup_area || trip.pickup_address}</p>
            <p className="text-xs text-[#a8a29e] truncate">{trip.pickup_address}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-[#ef4444] mt-1.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{trip.dropoff_area || trip.dropoff_address}</p>
            <p className="text-xs text-[#a8a29e] truncate">{trip.dropoff_address}</p>
          </div>
        </div>
      </div>

      {/* 詳細資訊 */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <span className="text-[#a8a29e]">日期：</span>
          <span className="text-[#fafaf9]">{formatDate(trip.service_date)}</span>
        </div>
        <div>
          <span className="text-[#a8a29e]">時間：</span>
          <span className="text-[#fafaf9]">{formatTime(trip.service_time)}</span>
        </div>
        {trip.flight_number && (
          <div>
            <span className="text-[#a8a29e]">航班：</span>
            <span className="text-[#fafaf9]">{trip.flight_number}</span>
          </div>
        )}
        <div>
          <span className="text-[#a8a29e]">人數/行李：</span>
          <span className="text-[#fafaf9]">{trip.passenger_count}人 / {trip.luggage_count}件</span>
        </div>
      </div>

      {trip.note && (
        <div className="text-xs text-[#a8a29e] italic mb-3">
          備註：{trip.note}
        </div>
      )}

      {/* 已完成顯示收入 */}
      {showIncome && (
        <div className="border-t border-[#292524] pt-3 mt-3 flex items-center justify-between">
          <span className="text-sm text-[#a8a29e]">司機收入</span>
          <span className="text-lg font-bold text-[#22c55e]">${trip.driver_fee.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

export default function MyTripsPage() {
  const { myTrips } = useDriver();
  const [tab, setTab] = useState<TabMode>('active');

  const activeTrips = myTrips.filter(t =>
    ['accepted', 'arrived', 'picked_up'].includes(t.status)
  );
  const completedTrips = myTrips.filter(t => t.status === 'completed');

  const displayTrips = tab === 'active' ? activeTrips : completedTrips;

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-[#fafaf9] mb-6">我的行程</h1>

      {/* Tab 切換 */}
      <div className="tab-group mb-6 inline-flex">
        <button
          onClick={() => setTab('active')}
          className={tab === 'active' ? 'tab-active' : 'tab-inactive'}
        >
          待執行 ({activeTrips.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={tab === 'completed' ? 'tab-active' : 'tab-inactive'}
        >
          已完成 ({completedTrips.length})
        </button>
      </div>

      {/* 行程列表 */}
      <div className="space-y-3">
        {displayTrips.map((trip) => (
          <TripDetailCard
            key={trip.id}
            trip={trip}
            showIncome={tab === 'completed'}
          />
        ))}
      </div>

      {displayTrips.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-[#a8a29e]">
            {tab === 'active' ? '目前沒有待執行的行程' : '目前沒有已完成的行程'}
          </p>
        </div>
      )}

      {/* 已完成行程的總收入 */}
      {tab === 'completed' && completedTrips.length > 0 && (
        <div className="glass-card p-4 mt-6 flex items-center justify-between">
          <span className="text-[#a8a29e]">本月總收入</span>
          <span className="text-xl font-bold text-[#d4af37]">
            ${completedTrips.reduce((sum, t) => sum + t.driver_fee, 0).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
