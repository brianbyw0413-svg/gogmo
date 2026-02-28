// 接單大廳 - 公開行程展示
// MVP 階段先做展示用

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trip } from '@/types';
import { getOpenTrips } from '@/lib/data';
import TripCard from '@/components/TripCard';

export default function LobbyPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'dropoff' | 'pickup'>('all');

  // 載入資料
  useEffect(() => {
    getOpenTrips().then(data => {
      setTrips(data);
      setLoading(false);
    });
  }, []);

  // 過濾行程
  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    return trip.service_type === filter;
  });

  return (
    <div className="min-h-screen bg-[#0c0a09] grid-bg">
      {/* 頂部導航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0a09]/80 backdrop-blur-sm border-b border-[#292524]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962f] flex items-center justify-center">
              <span className="text-xl font-bold text-[#0c0a09]">P</span>
            </div>
            <span className="text-xl font-bold text-[#fafaf9]">接單大廳</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#a8a29e] hover:text-[#d4af37] transition-colors">
              首頁
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
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-3xl font-bold text-[#fafaf9] mb-2">
              接單大廳
            </h1>
            <p className="text-[#a8a29e]">
              顯示所有待接單的行程，點擊卡片可查看詳情
            </p>
          </div>

          {/* 篩選器 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filter === 'all' ? 'btn-gold' : 'btn-gold-outline'
              }`}
            >
              全部 ({trips.length})
            </button>
            <button
              onClick={() => setFilter('dropoff')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filter === 'dropoff' ? 'btn-gold' : 'btn-gold-outline'
              }`}
            >
              送機 ({trips.filter(t => t.service_type === 'dropoff').length})
            </button>
            <button
              onClick={() => setFilter('pickup')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filter === 'pickup' ? 'btn-gold' : 'btn-gold-outline'
              }`}
            >
              接機 ({trips.filter(t => t.service_type === 'pickup').length})
            </button>
          </div>

          {/* 行程列表 */}
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
                    showActions={false} 
                    variant="compact" 
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-[#a8a29e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-[#a8a29e] text-lg">
                {filter === 'all' ? '目前沒有待接單的行程' : `目前沒有${filter === 'dropoff' ? '送機' : '接機'}行程`}
              </p>
              <p className="text-sm text-[#6b7280] mt-2">
                敬請期待新的派單
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
