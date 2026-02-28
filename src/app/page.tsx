// 首頁 - 公開展示頁面
// 動態 Case 卡片展示牆 — 無限水平滾動 (hover 暫停)

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trip } from '@/types';
import { getTrips } from '@/lib/data';
import TripCard from '@/components/TripCard';

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrips().then(data => {
      const activeTrips = data.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
      setTrips(activeTrips);
      setLoading(false);
    });
  }, []);

  // 複製卡片以實現無縫循環
  const marqueeTrips = trips.length > 0 ? [...trips, ...trips] : [];

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
            <Link href="/lobby" className="text-[#a8a29e] hover:text-[#d4af37] transition-colors">
              接單大廳
            </Link>
            <Link href="/dashboard" className="btn-gold">
              車頭登入
            </Link>
          </div>
        </div>
      </header>

      {/* 主內容 */}
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Hero 區域 */}
          <div className="text-center mb-12 animate-fadeIn">
            <h1 className="text-4xl md:text-5xl font-bold text-[#fafaf9] mb-4">
              <span className="text-[#d4af37]">GMO</span>
              {' '}專業機場接送
              <span className="text-[#d4af37]">派單平台</span>
            </h1>
            <p className="text-lg text-[#a8a29e] max-w-2xl mx-auto">
              Give Me Order — 連接車頭與司機的橋樑，即時派單、即時接單
            </p>
          </div>

          {/* 統計資訊 */}
          <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-[#d4af37]">{trips.length}</div>
              <div className="text-xs text-[#a8a29e]">待執行行程</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-[#d4af37]">
                {trips.filter(t => t.status === 'open').length}
              </div>
              <div className="text-xs text-[#a8a29e]">待司機接單</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-[#d4af37]">
                {trips.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
              </div>
              <div className="text-xs text-[#a8a29e]">今日總金額</div>
            </div>
          </div>
        </div>

        {/* 即時行程 — 無限滾動卡片牆 */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-[#fafaf9] mb-6 flex items-center gap-2 max-w-7xl mx-auto px-4">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse-slow"></span>
            即時行程
          </h2>

          {loading ? (
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card p-4 animate-pulse">
                  <div className="h-4 bg-[#292524] rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-[#292524] rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#292524] rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : marqueeTrips.length > 0 ? (
            /* 無限水平滾動容器 */
            <div className="marquee-container overflow-hidden w-full">
              <div 
                className="marquee-track"
                style={{
                  '--card-count': trips.length,
                  '--card-width': '320px',
                  '--gap': '16px',
                } as React.CSSProperties}
              >
                {marqueeTrips.map((trip, index) => (
                  <div
                    key={`${trip.id}-${index}`}
                    className="marquee-card"
                  >
                    <TripCard trip={trip} showActions={false} variant="public" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4">
              <div className="glass-card p-8 text-center">
                <p className="text-[#a8a29e]">目前沒有待執行的行程</p>
              </div>
            </div>
          )}
        </div>

        {/* CTA 按鈕 */}
        <div className="text-center px-4">
          <Link href="/lobby" className="btn-gold-outline inline-flex items-center gap-2 px-6 py-3">
            查看更多行程
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </main>

      {/* 頁腳 */}
      <footer className="border-t border-[#292524] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[#a8a29e]">
          <p>© 2026 GMO — Give Me Order by PickYouUP. All rights reserved.</p>
          <p className="mt-2">MVP 版本 - 機場接送派單系統</p>
        </div>
      </footer>
    </div>
  );
}
