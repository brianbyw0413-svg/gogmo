// 我的行程 — 司機端（含日曆視圖）
'use client';

import { useState, useMemo } from 'react';
import { useDriver } from '@/lib/driverContext';
import { Trip } from '@/types';

type TabMode = 'active' | 'completed';
type ViewMode = 'calendar' | 'list';

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
  const isPickup = trip.service_type === 'pickup';

  return (
    <div className="glass-card p-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-2 py-1 rounded-lg border ${
            isPickup
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
          }`}>
            {isPickup ? '✈️↓' : '✈️↑'} {isPickup ? '接機' : '送機'}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(trip.status)}`}>
            {getStatusText(trip.status)}
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

// 日曆元件
function CalendarView({ 
  trips, 
  selectedDate, 
  onSelectDate,
  currentMonth,
  onMonthChange 
}: { 
  trips: Trip[]; 
  selectedDate: string | null; 
  onSelectDate: (date: string) => void;
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  
  // 取得當月天數
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  // 取得該月所有日期的行程
  const tripsByDate = useMemo(() => {
    const map: Record<string, Trip[]> = {};
    trips.forEach(trip => {
      const date = trip.service_date;
      if (!map[date]) map[date] = [];
      map[date].push(trip);
    });
    return map;
  }, [trips]);

  // 生成日曆格子
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-cell bg-transparent" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTrips = tripsByDate[dateStr] || [];
    const isToday = dateStr === today;
    const isSelected = dateStr === selectedDate;
    const hasTrips = dayTrips.length > 0;
    
    days.push(
      <div
        key={dateStr}
        onClick={() => onSelectDate(dateStr)}
        className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasTrips ? 'has-trips' : ''}`}
      >
        <div className="text-sm font-medium">{d}</div>
        {hasTrips && (
          <div className="flex flex-wrap gap-1 mt-1">
            {dayTrips.slice(0, 4).map(t => (
              <span 
                key={t.id} 
                className={`w-2 h-2 rounded-full ${
                  t.service_type === 'pickup' ? 'bg-blue-400' : 'bg-orange-400'
                }`} 
              />
            ))}
            {dayTrips.length > 4 && (
              <span className="text-xs text-[#a8a29e]">+{dayTrips.length - 4}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);

  return (
    <div className="animate-fadeIn">
      {/* 月份切換 */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => onMonthChange(prevMonth)}
          className="p-2 hover:bg-[#292524] rounded-lg transition-colors"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold text-[#fafaf9]">
          {year}年 {monthNames[month]}
        </h3>
        <button 
          onClick={() => onMonthChange(nextMonth)}
          className="p-2 hover:bg-[#292524] rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      {/* 星期標題 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center text-xs text-[#a8a29e] py-2">
            {day}
          </div>
        ))}
      </div>

      {/* 日曆格子 */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      {/* 選中日期的行程列表 */}
      {selectedDate && tripsByDate[selectedDate] && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-[#fafaf9] mb-2">
            {new Date(selectedDate).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} 的行程
          </h4>
          <div className="space-y-2">
            {tripsByDate[selectedDate].map(trip => (
              <TripDetailCard key={trip.id} trip={trip} showIncome={trip.status === 'completed'} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyTripsPage() {
  const { myTrips } = useDriver();
  const [tab, setTab] = useState<TabMode>('active');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const activeTrips = myTrips.filter(t =>
    ['accepted', 'arrived', 'picked_up'].includes(t.status)
  );
  const completedTrips = myTrips.filter(t => t.status === 'completed');
  
  const displayTrips = tab === 'active' ? activeTrips : completedTrips;

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-[#fafaf9] mb-6">我的行程</h1>

      {/* Tab 切換：視圖模式 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="tab-group">
          <button
            onClick={() => setViewMode('calendar')}
            className={viewMode === 'calendar' ? 'tab-active' : 'tab-inactive'}
          >
            📅 日曆
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'tab-active' : 'tab-inactive'}
          >
            📋 列表
          </button>
        </div>
      </div>

      {/* 日曆視圖 */}
      {viewMode === 'calendar' && (
        <CalendarView 
          trips={displayTrips}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}

      {/* 列表視圖 */}
      {viewMode === 'list' && (
        <>
          {/* Tab 切換：待執行/已完成 */}
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
        </>
      )}
    </div>
  );
}
