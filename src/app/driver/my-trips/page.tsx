// 我的行程 — 司機端（含日曆視圖）
'use client';

import { useState, useMemo } from 'react';
import { useDriver } from '@/lib/driverContext';
import { Trip } from '@/types';
import TripCard from '@/components/TripCard';

type ViewMode = 'calendar' | 'list';
type ListTab = 'active' | 'completed';

// 日曆工具函數
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export default function MyTripsPage() {
  const { myTrips } = useDriver();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [listTab, setListTab] = useState<ListTab>('active');
  
  // 日曆狀態
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateStr(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // 行程分類
  const activeTrips = myTrips.filter(t =>
    ['accepted', 'arrived', 'picked_up'].includes(t.status)
  );
  const completedTrips = myTrips.filter(t => t.status === 'completed');
  const listTrips = listTab === 'active' ? activeTrips : completedTrips;

  // 按日期分組行程
  const tripsByDate = useMemo(() => {
    const map: Record<string, Trip[]> = {};
    myTrips.forEach(t => {
      if (!map[t.service_date]) map[t.service_date] = [];
      map[t.service_date].push(t);
    });
    return map;
  }, [myTrips]);

  // 選中日期的行程
  const selectedDateTrips = tripsByDate[selectedDate] || [];

  // 日曆格子
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
    else setCalMonth(calMonth + 1);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#fafaf9]">我的行程</h1>
        
        {/* 視圖切換 */}
        <div className="tab-group inline-flex">
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

      {/* ===== 日曆視圖 ===== */}
      {viewMode === 'calendar' && (
        <div>
          {/* 月份導航 */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="btn-gold-outline px-3 py-1.5 text-sm">
              ‹ 上月
            </button>
            <h2 className="text-lg font-bold text-[#fafaf9]">
              {calYear} 年 {MONTH_NAMES[calMonth]}
            </h2>
            <button onClick={nextMonth} className="btn-gold-outline px-3 py-1.5 text-sm">
              下月 ›
            </button>
          </div>

          {/* 星期標題 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs text-[#a8a29e] py-2 font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* 日曆格子 */}
          <div className="grid grid-cols-7 gap-1 mb-6">
            {/* 空白格（月初之前） */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[70px]" />
            ))}
            
            {/* 日期格 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateStr(calYear, calMonth, day);
              const dayTrips = tripsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const pickupCount = dayTrips.filter(t => t.service_type === 'pickup').length;
              const dropoffCount = dayTrips.filter(t => t.service_type === 'dropoff').length;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    isToday ? 'text-[#d4af37]' : isSelected ? 'text-[#fafaf9]' : 'text-[#a8a29e]'
                  }`}>
                    {day}
                  </div>
                  {/* 行程標記 */}
                  {dayTrips.length > 0 && (
                    <div className="flex flex-wrap gap-0.5">
                      {dropoffCount > 0 && (
                        <span className="text-[10px] px-1 rounded bg-orange-500/20 text-orange-400 font-bold">
                          送{dropoffCount > 1 ? `×${dropoffCount}` : ''}
                        </span>
                      )}
                      {pickupCount > 0 && (
                        <span className="text-[10px] px-1 rounded bg-blue-500/20 text-blue-400 font-bold">
                          接{pickupCount > 1 ? `×${pickupCount}` : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 選中日期的行程詳情 */}
          <div className="border-t border-[#292524] pt-4">
            <h3 className="text-sm font-semibold text-[#a8a29e] mb-3">
              {selectedDate === todayStr ? '📍 今日行程' : `📍 ${selectedDate} 行程`}
              <span className="ml-2 text-[#d4af37]">({selectedDateTrips.length})</span>
            </h3>
            
            {selectedDateTrips.length > 0 ? (
              <div className="space-y-3">
                {selectedDateTrips
                  .sort((a, b) => (a.service_time || '').localeCompare(b.service_time || ''))
                  .map(trip => (
                    <TripCard key={trip.id} trip={trip} variant="driver" showActions={false} />
                  ))}
              </div>
            ) : (
              <div className="glass-card p-6 text-center">
                <p className="text-[#a8a29e]">這天沒有行程</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 列表視圖 ===== */}
      {viewMode === 'list' && (
        <div>
          {/* Tab 切換 */}
          <div className="tab-group mb-6 inline-flex">
            <button
              onClick={() => setListTab('active')}
              className={listTab === 'active' ? 'tab-active' : 'tab-inactive'}
            >
              待執行 ({activeTrips.length})
            </button>
            <button
              onClick={() => setListTab('completed')}
              className={listTab === 'completed' ? 'tab-active' : 'tab-inactive'}
            >
              已完成 ({completedTrips.length})
            </button>
          </div>

          {/* 行程列表 */}
          <div className="space-y-3">
            {listTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} variant="driver" showActions={false} />
            ))}
          </div>

          {listTrips.length === 0 && (
            <div className="glass-card p-8 text-center">
              <p className="text-[#a8a29e]">
                {listTab === 'active' ? '目前沒有待執行的行程' : '目前沒有已完成的行程'}
              </p>
            </div>
          )}

          {/* 已完成行程的總收入 */}
          {listTab === 'completed' && completedTrips.length > 0 && (
            <div className="glass-card p-4 mt-6 flex items-center justify-between">
              <span className="text-[#a8a29e]">本月總收入</span>
              <span className="text-xl font-bold text-[#d4af37]">
                ${completedTrips.reduce((sum, t) => sum + t.driver_fee, 0).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
