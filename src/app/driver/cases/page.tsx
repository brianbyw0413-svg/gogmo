// Case 牆 — 司機視角
'use client';

import { useState, useMemo } from 'react';
import { useDriver } from '@/lib/driverContext';
import TripCard from '@/components/TripCard';
import { Trip } from '@/types';

type SortMode = 'time' | 'amount' | 'area';
type FilterMode = 'all' | 'dropoff' | 'pickup';

export default function CasesPage() {
  const { openTrips, getSmartMatches, acceptTrip } = useDriver();
  const [sortMode, setSortMode] = useState<SortMode>('time');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [toast, setToast] = useState<string | null>(null);

  const matches = getSmartMatches();

  // 篩選
  const filteredTrips = useMemo(() => {
    let result = openTrips;
    if (filterMode === 'dropoff') {
      result = result.filter(t => t.service_type === 'dropoff');
    } else if (filterMode === 'pickup') {
      result = result.filter(t => t.service_type === 'pickup');
    }
    return result;
  }, [openTrips, filterMode]);

  // 排序
  const sortedTrips = useMemo(() => {
    const copy = [...filteredTrips];
    switch (sortMode) {
      case 'time':
        copy.sort((a, b) => {
          const dateA = `${a.service_date}T${a.service_time}`;
          const dateB = `${b.service_date}T${b.service_time}`;
          return dateA.localeCompare(dateB);
        });
        break;
      case 'amount':
        copy.sort((a, b) => b.amount - a.amount);
        break;
      case 'area':
        copy.sort((a, b) => (a.pickup_area || '').localeCompare(b.pickup_area || ''));
        break;
    }
    return copy;
  }, [filteredTrips, sortMode]);

  // 排除已在推薦中的行程
  const matchTripIds = new Set(matches.map(m => m.trip.id));
  const nonMatchTrips = sortedTrips.filter(t => !matchTripIds.has(t.id));

  const handleAccept = (tripId: string) => {
    const ok = acceptTrip(tripId);
    if (ok) {
      setToast('接單成功！🎉');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  return (
    <div className="animate-fadeIn">
      {/* Toast */}
      {toast && <div className="toast-success">{toast}</div>}

      <h1 className="text-2xl font-bold text-[#fafaf9] mb-6">Case 牆</h1>

      {/* 智慧推薦區塊 */}
      {matches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#fafaf9] mb-4 flex items-center gap-2">
            <span className="text-[#d4af37]">✨</span> 為你推薦
            <span className="text-xs text-[#a8a29e] font-normal ml-2">（顯示與您已接行程的關聯）</span>
          </h2>
          
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.trip.id} className="match-group">
                {/* 配對卡片 - 上半部：已接行程 */}
                {match.relatedTrip && (
                  <div className="match-related-card mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-[#a8a29e]">📋 您已接的行程</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        match.relatedTrip.service_type === 'dropoff' 
                          ? 'bg-orange-500/20 text-orange-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {match.relatedTrip.service_type === 'dropoff' ? '送機' : '接機'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#a8a29e]">
                        {formatDate(match.relatedTrip.service_date)} {formatTime(match.relatedTrip.service_time)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#a8a29e] mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-[#a8a29e] truncate">
                        {match.relatedTrip.pickup_area || match.relatedTrip.pickup_address}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#a8a29e] mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-[#a8a29e] truncate">
                        {match.relatedTrip.dropoff_area || match.relatedTrip.dropoff_address}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* 連接線視覺 */}
                <div className="match-connector">
                  <div className="connector-line"></div>
                  <div className="connector-icon">
                    {match.matchType === 'route' ? '⚡' : match.matchType === 'bundle' ? '🔗' : '⏰'}
                  </div>
                  <div className="connector-line"></div>
                </div>
                
                {/* 配對卡片 - 下半部：推薦行程 */}
                <div className="match-card p-4">
                  {/* 配對原因標籤 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-[#d4af37] font-medium flex-1">{match.reason}</span>
                    <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-full font-semibold">
                      {match.matchScore}分
                    </span>
                  </div>

                  {/* 行程卡片內容 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      match.trip.service_type === 'dropoff' 
                        ? 'bg-orange-500/20 text-orange-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {match.trip.service_type === 'dropoff' ? '送機' : '接機'}
                    </span>
                    <span className="text-xs text-[#a8a29e]">
                      {formatDate(match.trip.service_date)} {formatTime(match.trip.service_time)}
                    </span>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-[#fafaf9] truncate">{match.trip.pickup_area || match.trip.pickup_address}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-[#fafaf9] truncate">{match.trip.dropoff_area || match.trip.dropoff_address}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm font-semibold text-[#d4af37]">${match.trip.amount}</div>
                    <button
                      onClick={() => handleAccept(match.trip.id)}
                      className="btn-gold text-sm py-1.5 px-4"
                    >
                      接單
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 篩選 + 排序 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* 篩選 */}
        <div className="tab-group">
          {([['all', '全部'], ['dropoff', '送機'], ['pickup', '接機']] as [FilterMode, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterMode(key)}
              className={filterMode === key ? 'tab-active' : 'tab-inactive'}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 排序 */}
        <div className="flex gap-2 ml-auto">
          {([['time', '最近時間'], ['amount', '最高金額'], ['area', '地區']] as [SortMode, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortMode(key)}
              className={`filter-btn ${sortMode === key ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 行程列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {nonMatchTrips.map((trip) => (
          <div key={trip.id}>
            <TripCard trip={trip} showActions={false} variant="default" />
            <div className="mt-2">
              <button
                onClick={() => handleAccept(trip.id)}
                className="btn-gold w-full text-sm py-2"
              >
                接單
              </button>
            </div>
          </div>
        ))}
      </div>

      {nonMatchTrips.length === 0 && matches.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-[#a8a29e]">目前沒有可接的行程</p>
        </div>
      )}
    </div>
  );
}
