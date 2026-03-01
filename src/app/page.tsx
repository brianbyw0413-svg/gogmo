// 首頁 - 公開展示頁面
// 動態 Case 卡片展示牆 — 三排無限水平滾動 (hover 暫停)

'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Trip } from '@/types';
import { getTrips } from '@/lib/data';
import TripCard from '@/components/TripCard';

/* 將行程分成 N 排，不足時循環填充 */
function splitIntoRows(trips: Trip[], rowCount: number, minPerRow: number = 6): Trip[][] {
  const rows: Trip[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const row: Trip[] = [];
    // 從不同偏移量開始取，讓每排內容不同
    for (let j = 0; j < Math.max(trips.length, minPerRow); j++) {
      row.push(trips[(j + i * 2) % trips.length]);
    }
    rows.push(row);
  }
  return rows;
}

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrips().then(data => {
      setTrips(data);
      setLoading(false);
    });
  }, []);

  // 三排卡片資料，每排複製一份實現無縫循環
  const rows = useMemo(() => {
    if (trips.length === 0) return [];
    return splitIntoRows(trips, 3, 7);
  }, [trips]);

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
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Hero 區域 */}
          <div className="text-center mb-8 animate-fadeIn">
            <h1 className="text-4xl md:text-6xl font-bold text-[#fafaf9] mb-3">
              <span className="text-[#d4af37]">G</span>ive{' '}
              <span className="text-[#d4af37]">M</span>e{' '}
              <span className="text-[#d4af37]">O</span>rder
            </h1>
            <p className="text-xl md:text-2xl text-[#fafaf9] tracking-wider font-semibold mb-4 animate-slideIn">
              — <span className="text-[#d4af37]">G</span>et{' '}
              <span className="text-[#d4af37]">M</span>ore{' '}
              <span className="text-[#d4af37]">O</span>ffers —
            </p>
            <p className="text-sm text-[#78716c] max-w-xl mx-auto">
              專業機場接送派單平台｜連接車頭與司機的橋樑
            </p>
          </div>

          {/* 統計資訊 */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
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

        {/* 三排無限滾動卡片牆 */}
        <div className="mb-12 space-y-4">
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
          ) : rows.length > 0 ? (
            rows.map((row, rowIndex) => {
              const isReverse = rowIndex % 2 === 1; // 第二排反向
              const duped = [...row, ...row]; // 複製一份無縫循環
              const speed = 50; // 統一速度，放慢
              return (
                <div key={rowIndex} className="marquee-container overflow-hidden w-full">
                  <div
                    className={`marquee-track ${isReverse ? 'marquee-reverse' : ''}`}
                    style={{
                      '--card-count': row.length,
                      '--card-width': '300px',
                      '--gap': '14px',
                      '--speed': `${speed}s`,
                    } as React.CSSProperties}
                  >
                    {duped.map((trip, index) => (
                      <div
                        key={`r${rowIndex}-${trip.id}-${index}`}
                        className="marquee-card"
                      >
                        <TripCard trip={trip} showActions={false} variant="public" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
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
