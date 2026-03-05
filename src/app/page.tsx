// 首頁 - 公開展示頁面
// Flipboard 卡片翻轉動態磚效果

'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Trip } from '@/types';
import { getTrips } from '@/lib/data';
import TripCard from '@/components/TripCard';

function FlipTile({ trip, index, totalTrips, allTrips }: { 
  trip: Trip | null; 
  index: number; 
  totalTrips: number;
  allTrips: Trip[];
}) {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(trip);
  const [isAnimating, setIsAnimating] = useState(false);
  const [newTrip, setNewTrip] = useState<Trip | null>(null);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | 'left' | 'right'>('up');

  // 每個格子不同時間滑動（分散開）+ 隨機 2-4 秒
  useEffect(() => {
    const randomDelay = 2000 + Math.random() * 2000; // 2-4 秒
    const staggerDelay = index * 600; // 每個格子延遲 600ms
    
    const startSlide = () => {
      // 選擇下一個行程
      const randomTrip = allTrips[Math.floor(Math.random() * allTrips.length)];
      if (randomTrip?.id === currentTrip?.id) return; // 不要滑同一張
      
      // 隨機方向：上、下、左、右
      const dirs: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      setSlideDirection(dir);
      setNewTrip(randomTrip);
      setIsAnimating(true);
      
      // 動畫完成後更新
      setTimeout(() => {
        setCurrentTrip(randomTrip);
        setNewTrip(null);
        setIsAnimating(false);
      }, 400); // 400ms 動畫時間
    };
    
    // 初始延遲後開始
    const initialTimeout = setTimeout(startSlide, staggerDelay);
    
    // 定期滑動
    const interval = setInterval(startSlide, randomDelay + staggerDelay);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [index, allTrips, currentTrip?.id]);

  // 滑動動畫 class
  const getSlideOutClass = () => {
    switch (slideDirection) {
      case 'up': return 'animate-slide-out-up';
      case 'down': return 'animate-slide-out-down';
      case 'left': return 'animate-slide-out-left';
      case 'right': return 'animate-slide-out-right';
    }
  };
  const getSlideInClass = () => {
    switch (slideDirection) {
      case 'up': return 'animate-slide-in-down';
      case 'down': return 'animate-slide-in-up';
      case 'left': return 'animate-slide-in-right';
      case 'right': return 'animate-slide-in-left';
    }
  };

  return (
    <div className="aspect-square overflow-hidden rounded-xl">
      {/* 當前卡片 - 滑出 */}
      <div className={`w-full h-full ${isAnimating ? getSlideOutClass() : ''}`}>
        {currentTrip ? (
          <TripCard trip={currentTrip} showActions={false} variant="public" />
        ) : (
          <div className="glass-card h-full flex items-center justify-center text-[#6b7280] text-xs md:text-sm p-1">
            等待行程...
          </div>
        )}
      </div>
      
      {/* 新卡片 - 滑入 */}
      {newTrip && isAnimating && (
        <div className={`absolute inset-0 w-full h-full ${getSlideInClass()}`}>
          <TripCard trip={newTrip} showActions={false} variant="public" />
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // 載入資料 + 每5秒自動更新統計
  useEffect(() => {
    const fetchTrips = () => {
      getTrips().then(data => {
        const openTrips = data.filter(t => t.status === 'open');
        setTrips(openTrips);
        setLoading(false);
      });
    };
    
    fetchTrips();
    
    // 每5秒自動更新統計資料
    const interval = setInterval(fetchTrips, 5000);
    return () => clearInterval(interval);
  }, []);

  // 統計資訊
  const stats = useMemo(() => {
    const pickup = trips.filter(t => t.service_type === 'pickup').length;
    const dropoff = trips.filter(t => t.service_type === 'dropoff').length;
    const total = trips.reduce((sum, t) => sum + t.amount, 0);
    const drivers = new Set(trips.filter(t => t.driver_id).map(t => t.driver_id)).size;
    return { pickup, dropoff, total, drivers };
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          {/* Hero 區域 */}
          <div className="text-center mb-4 md:mb-6 animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-[#fafaf9] mb-2 md:mb-3">
              <span className="text-[#d4af37]">G</span>ive{' '}
              <span className="text-[#d4af37]">M</span>e{' '}
              <span className="text-[#d4af37]">O</span>rder
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#fafaf9] tracking-wider font-semibold mb-2 md:mb-4 animate-slideIn">
              — <span className="text-[#d4af37]">G</span>et{' '}
              <span className="text-[#d4af37]">M</span>ore{' '}
              <span className="text-[#d4af37]">O</span>ffers —
            </p>
            <p className="text-xs sm:text-sm text-[#78716c] max-w-xl mx-auto">
              專業機場接送派單平台｜連接車頭與司機的橋樑
            </p>
          </div>

          {/* 統計資訊 - 亮黃色 + RWD */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:gap-4 mb-3 md:mb-6 max-w-4xl mx-auto px-1 sm:px-0">
            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#fde047]">{stats.pickup}</div>
              <div className="text-xs text-[#a8a29e]">在線接機單</div>
            </div>
            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#fde047]">{stats.dropoff}</div>
              <div className="text-xs text-[#a8a29e]">在線送機單</div>
            </div>
            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#fde047]">{stats.drivers}</div>
              <div className="text-xs text-[#a8a29e]">註冊司機</div>
            </div>
            <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#fde047]">${stats.total.toLocaleString()}</div>
              <div className="text-xs text-[#a8a29e]">在線單總金額</div>
            </div>
          </div>
        </div>

        {/* Flipboard 風格 - 卡片翻轉動態磚 */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 mb-4">
          <h2 className="text-lg font-semibold text-[#a8a29e] mb-2 md:mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></span>
            即時行程動態牆
          </h2>
          
          {loading ? (
            <div className="hidden md:grid grid-cols-4 gap-2 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-card p-2 md:p-4 aspect-square animate-pulse">
                  <div className="h-4 bg-[#292524] rounded w-1/2 mb-2 md:mb-4"></div>
                  <div className="h-3 bg-[#292524] rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#292524] rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* 手機版：只顯示 4 格 - 自動調整間距 */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:hidden">
                {[...Array(4)].map((_, i) => {
                  const trip = trips[i % trips.length] || null;
                  return (
                    <FlipTile 
                      key={`mobile-${i}`} 
                      trip={trip} 
                      index={i} 
                      totalTrips={trips.length}
                      allTrips={trips}
                    />
                  );
                })}
              </div>
              {/* 電腦版：顯示 8 格 */}
              <div className="hidden md:grid grid-cols-4 gap-2 md:gap-4">
                {[...Array(8)].map((_, i) => {
                  const trip = trips[i % trips.length] || null;
                  return (
                    <FlipTile 
                      key={`desktop-${i}`} 
                      trip={trip} 
                      index={i} 
                      totalTrips={trips.length}
                      allTrips={trips}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* CTA 按鈕 */}
        <div className="text-center px-4 py-4 md:py-8">
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
