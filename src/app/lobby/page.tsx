// 接單大廳 - 公開行程展示（複數篩選功能）
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Trip } from '@/types';
import { getOpenTrips } from '@/lib/data';
import TripCard from '@/components/TripCard';

// 定義區域關鍵字
const REGION_KEYWORDS: Record<string, string[]> = {
  北部: ['台北', '新北', '桃園', '基隆', '宜蘭'],
  中部: ['苗栗', '台中', '彰化', '南投', '雲林'],
  南部: ['嘉義', '台南', '高雄', '屏東'],
};

// 定義篩選類型
type FilterType = 'dropoff' | 'pickup' | 'north' | 'central' | 'south' | 'urgent';

const FILTERS: { key: FilterType; label: string; color: string }[] = [
  { key: 'dropoff', label: '送機', color: '#f97316' },
  { key: 'pickup', label: '接機', color: '#3b82f6' },
  { key: 'north', label: '北部', color: '#22c55e' },
  { key: 'central', label: '中部', color: '#eab308' },
  { key: 'south', label: '南部', color: '#ec4899' },
  { key: 'urgent', label: '急單', color: '#ef4444' },
];

export default function LobbyPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);

  // 載入資料
  useEffect(() => {
    getOpenTrips().then(data => {
      setTrips(data);
      setLoading(false);
    });
  }, []);

  // 檢查是否為急單
  const isUrgent = (trip: Trip): boolean => {
    const boost = trip.price_boost || 0;
    if (boost > 0) return true;
    // 距離出發時間 < 2 小時視為急單
    const serviceDateTime = new Date(`${trip.service_date}T${trip.service_time}`);
    const now = new Date();
    const hoursUntil = (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil < 2;
  };

  // 檢查區域
  const getRegion = (trip: Trip): string | null => {
    const address = `${trip.pickup_address} ${trip.dropoff_address}`.toLowerCase();
    for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
      if (keywords.some(kw => address.includes(kw.toLowerCase()))) {
        return region;
      }
    }
    return null;
  };

  // 切換篩選
  const toggleFilter = (key: FilterType) => {
    setActiveFilters(prev => 
      prev.includes(key) 
        ? prev.filter(f => f !== key)
        : [...prev, key]
    );
  };

  // 清除全部
  const clearFilters = () => setActiveFilters([]);

  // 過濾行程（複數篩選，AND 邏輯）
  const filteredTrips = useMemo(() => {
    if (activeFilters.length === 0) return trips;
    
    return trips.filter(trip => {
      // 檢查每個 active filter
      return activeFilters.every(filter => {
        if (filter === 'dropoff') return trip.service_type === 'dropoff';
        if (filter === 'pickup') return trip.service_type === 'pickup';
        if (filter === 'urgent') return isUrgent(trip);
        // 區域過濾
        const region = getRegion(trip);
        const regionMap: Record<string, FilterType> = {
          '北部': 'north',
          '中部': 'central',
          '南部': 'south',
        };
        return regionMap[region || ''] === filter;
      });
    });
  }, [trips, activeFilters]);

  // 按時間排序（急單/加價單置頂）
  const sortedTrips = useMemo(() => {
    return [...filteredTrips].sort((a, b) => {
      // 急單（加價）置頂
      const aBoost = a.price_boost || 0;
      const bBoost = b.price_boost || 0;
      if (aBoost > 0 && bBoost === 0) return -1;
      if (aBoost === 0 && bBoost > 0) return 1;
      // 距離出發時間近的排前面
      const dateA = `${a.service_date}T${a.service_time}`;
      const dateB = `${b.service_date}T${b.service_time}`;
      return dateA.localeCompare(dateB);
    });
  }, [filteredTrips]);

  return (
    <div className="min-h-screen bg-[#0c0a09] grid-bg">
      {/* 頂部導航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0a09]/80 backdrop-blur-sm border-b border-[#292524]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962f] flex items-center justify-center">
              <span className="text-xl font-bold text-[#0c0a09]">G</span>
            </div>
            <span className="text-xl font-bold text-[#fafaf9]">GMO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#a8a29e] hover:text-[#d4af37] transition-colors">
              首頁
            </Link>
            <Link href="/driver" className="text-[#a8a29e] hover:text-[#d4af37] transition-colors">
              司機登入
            </Link>
            <Link href="/dashboard" className="btn-gold">
              車頭登入
            </Link>
          </div>
        </div>
      </header>

      {/* 主內容 */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 標題區域 */}
          <div className="mb-4 animate-fadeIn">
            <h1 className="text-3xl font-bold text-[#fafaf9] mb-2">
              接單大廳
            </h1>
            <p className="text-[#a8a29e]">
              共 {sortedTrips.length} 筆行程
            </p>
          </div>

          {/* 篩選器 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* 清除按鈕 */}
            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#292524] text-[#ef4444] hover:bg-[#3d3a38] transition-all"
              >
                清除 ({activeFilters.length})
              </button>
            )}
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeFilters.includes(f.key)
                    ? 'ring-2 ring-offset-2 ring-offset-[#0c0a09]'
                    : 'bg-[#292524] text-[#a8a29e] hover:bg-[#3d3a38]'
                }`}
                style={{
                  backgroundColor: activeFilters.includes(f.key) ? f.color : '#292524',
                  color: activeFilters.includes(f.key) ? '#0c0a09' : '#a8a29e',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 行程卡片網格 - 固定大小 */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-card p-4 h-48 animate-pulse">
                  <div className="h-4 bg-[#292524] rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-[#292524] rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#292524] rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : sortedTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedTrips.map(trip => (
                <div key={trip.id} className="h-48">
                  <TripCard trip={trip} showActions={false} variant="public" />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-[#a8a29e]">沒有符合篩選條件的行程</p>
            </div>
          )}
        </div>
      </main>

      {/* 頁腳 */}
      <footer className="border-t border-[#292524] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[#a8a29e]">
          <p>© 2026 GMO — Give Me Order by PickYouUP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
