// 首頁 - 緊湊行程卡片網格 (最多20筆) + 滑入滑出动畫

'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Trip } from '@/types';
import { getTrips } from '@/lib/data';

function formatDate(d: string) { if (!d) return ''; return new Date(d).toLocaleDateString('zh-TW',{month:'short',day:'numeric'}); }
function formatTime(t: string) { if (!t) return ''; const [h,m] = t.split(':'); return `${h}:${m}`; }

// 單張卡片滑入滑出動畫
function AnimatedTripCard({ trip, index, allTrips }: { trip: Trip | null; index: number; allTrips: Trip[] }) {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(trip);
  const [isAnimating, setIsAnimating] = useState(false);
  const [newTrip, setNewTrip] = useState<Trip | null>(null);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | 'left' | 'right'>('up');

  useEffect(() => {
    if (!allTrips.length) return;
    // 隨機時間間隔 + 交錯延遲
    const randomDelay = 3000 + Math.random() * 3000;
    const staggerDelay = index * 400;
    
    const startSlide = () => {
      if (isAnimating) return;
      const randomTrip = allTrips[Math.floor(Math.random() * allTrips.length)];
      
      const dirs: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      setSlideDirection(dir);
      setNewTrip(randomTrip);
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentTrip(randomTrip);
        setNewTrip(null);
        setIsAnimating(false);
      }, 400);
    };
    
    const initialTimeout = setTimeout(startSlide, staggerDelay + 1500);
    const interval = setInterval(startSlide, randomDelay + staggerDelay);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [index, allTrips, isAnimating]);

  // 舊卡片滑出方向
  const getOutStyle = (): React.CSSProperties => {
    if (!isAnimating) return {};
    const base: React.CSSProperties = { animation: '0.4s ease-in forwards' };
    switch (slideDirection) {
      case 'up':    return { ...base, animationName: 'slideOutUp' };
      case 'down':  return { ...base, animationName: 'slideOutDown' };
      case 'left':  return { ...base, animationName: 'slideOutLeft' };
      case 'right': return { ...base, animationName: 'slideOutRight' };
    }
  };

  // 新卡片滑入方向
  const getInStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { animation: '0.4s ease-out forwards' };
    switch (slideDirection) {
      case 'up':    return { ...base, animationName: 'slideInFromBottom' };
      case 'down':  return { ...base, animationName: 'slideInFromTop' };
      case 'left':  return { ...base, animationName: 'slideInFromRight' };
      case 'right': return { ...base, animationName: 'slideInFromLeft' };
    }
  };

  if (!currentTrip) {
    return <div className="glass-card h-full flex items-center justify-center text-[#5a5550] text-xs">等待行程...</div>;
  }

  const isPickup = currentTrip.service_type === 'pickup';
  const totalAmount = currentTrip.amount + (currentTrip.price_boost || 0);
  
  return (
    <div className="relative h-full overflow-hidden">
      {/* 舊卡片 — 滑出 */}
      <div className="absolute inset-0" style={getOutStyle()}>
        <div className="h-full flex flex-col relative" 
          style={{
            background: 'linear-gradient(145deg, #1a1816 0%, #0f0e0d 100%)',
            borderRadius: '8px',
          }}>
          {/* 頂部 - 深灰區塊 */}
          <div className="bg-[#252320] px-1.5 py-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isPickup ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
                {isPickup ? '接機' : '送機'}
              </span>
              <span className="text-[9px] text-[#a8a29e] hidden md:inline">{currentTrip?.flight_number || '-'}</span>
            </div>
            <span className="text-lg font-bold text-[#fde047]">${totalAmount}</span>
          </div>
          {/* 中間 - 深灰區塊 */}
          <div className="flex-1 px-1.5 py-1 flex flex-col justify-center gap-0 bg-[#1c1a18]">
            <div className="flex items-start gap-1">
              <div className="w-1 h-1 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
              <p className="text-xs font-medium text-[#fafaf9] truncate">{currentTrip.pickup_area || currentTrip.pickup_address}</p>
            </div>
            <div className="ml-0.5 w-0.5 h-1.5 bg-gradient-to-b from-[#d4af37] to-transparent" />
            <div className="flex items-start gap-1">
              <div className="w-1 h-1 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
              <p className="text-xs font-medium text-[#fafaf9] truncate">{currentTrip.dropoff_area || currentTrip.dropoff_address}</p>
            </div>
          </div>
          {/* 底部 - 深灰區塊 */}
          <div className="bg-[#252320] px-1.5 py-1 flex items-center justify-between">
            <span className="text-[9px] font-medium text-[#c8c0b8]">
              {formatDate(currentTrip.service_date)} {formatTime(currentTrip.service_time)}
            </span>
            <span className="text-[9px] text-[#8a8580]">
              {currentTrip.passenger_count}人/{currentTrip.luggage_count}件
            </span>
          </div>
        </div>
      </div>
      
      {/* 新卡片 — 滑入 */}
      {newTrip && isAnimating && (
        <div className="absolute inset-0" style={getInStyle()}>
          {(() => {
            const nTrip = newTrip;
            const nIsPickup = nTrip.service_type === 'pickup';
            const nTotalAmount = nTrip.amount + (nTrip.price_boost || 0);
            return (
              <div className="h-full flex flex-col relative" 
                style={{
                  background: 'linear-gradient(145deg, #1a1816 0%, #0f0e0d 100%)',
                  borderRadius: '8px',
                }}>
                {/* 頂部 - 深灰區塊 */}
                <div className="bg-[#252320] px-1.5 py-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${nIsPickup ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {nIsPickup ? '接機' : '送機'}
                    </span>
                    <span className="text-[9px] text-[#a8a29e] hidden md:inline">{nTrip.flight_number || '-'}</span>
                  </div>
                  <span className="text-lg font-bold text-[#fde047]">${nTotalAmount}</span>
                </div>
                {/* 中間 - 深灰區塊 */}
                <div className="flex-1 px-1.5 py-1 flex flex-col justify-center gap-0 bg-[#1c1a18]">
                  <div className="flex items-start gap-1">
                    <div className="w-1 h-1 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
                    <p className="text-xs font-medium text-[#fafaf9] truncate">{nTrip.pickup_area || nTrip.pickup_address}</p>
                  </div>
                  <div className="ml-0.5 w-0.5 h-1.5 bg-gradient-to-b from-[#d4af37] to-transparent" />
                  <div className="flex items-start gap-1">
                    <div className="w-1 h-1 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
                    <p className="text-xs font-medium text-[#fafaf9] truncate">{nTrip.dropoff_area || nTrip.dropoff_address}</p>
                  </div>
                </div>
                {/* 底部 - 深灰區塊 */}
                <div className="bg-[#252320] px-1.5 py-1 flex items-center justify-between">
                  <span className="text-[9px] font-medium text-[#c8c0b8]">
                    {formatDate(nTrip.service_date)} {formatTime(nTrip.service_time)}
                  </span>
                  <span className="text-[9px] text-[#8a8580]">
                    {nTrip.passenger_count}人/{nTrip.luggage_count}件
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // 載入資料 + 每5秒自動更新
  useEffect(() => {
    const fetchTrips = () => {
      getTrips().then(data => {
        const openTrips = data.filter(t => t.status === 'open');
        setTrips(openTrips.slice(0, 20));
        setLoading(false);
      });
    };
    
    fetchTrips();
    const interval = setInterval(fetchTrips, 5000);
    return () => clearInterval(interval);
  }, []);

  // 統計
  const stats = useMemo(() => {
    const pickup = trips.filter(t => t.service_type === 'pickup').length;
    const dropoff = trips.filter(t => t.service_type === 'dropoff').length;
    const total = trips.reduce((sum, t) => sum + t.amount + (t.price_boost || 0), 0);
    const drivers = new Set(trips.filter(t => t.driver_id).map(t => t.driver_id)).size;
    return { pickup, dropoff, total, drivers };
  }, [trips]);

  const displayTrips = trips.slice(0, 20);

  // 副標題列表 - 隨機顯示（僅刷新時變化）
  const subtitles = [
    '-Come to GMO，be a free driver！',
    '-來GMO接單 做個自由的司機-',
    '-來GMO 開車不寂寞-',
    '-Come to GMO，find your driver-',
  ];
  const [subtitleIndex] = useState(() => Math.floor(Math.random() * subtitles.length));

  // 渲染帶有 GMO 標記的副標題
  const renderSubtitle = (text: string) => {
    const parts = text.split('GMO');
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && <span className="text-[#fde047]">GMO</span>}
          </span>
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] grid-bg">
      {/* 導航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0a09]/80 backdrop-blur-sm border-b border-[#292524]">
        <div className="max-w-7xl mx-auto px-3 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="GMO" className="h-8 md:h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/lobby" className="text-[#a8a29e] hover:text-[#d4af37]">接單大廳</Link>
            <a href="https://auth.line.me/oauth/authorize?response_type=code&client_id=2009340718&redirect_uri=https%3A%2F%2Fgmo.zeabur.app%2Fdriver%2Fline-callback&state=driver" className="px-3 py-1.5 bg-[#d4af37] text-[#0c0a09] rounded font-bold">司機登入</a>
            <a href="https://auth.line.me/oauth/authorize?response_type=code&client_id=2009277112&redirect_uri=https%3A%2F%2Fgmo.zeabur.app%2Fdriver%2Fline-callback&state=dispatcher" className="px-3 py-1.5 bg-[#d4af37] text-[#0c0a09] rounded font-bold">調度登入</a>
            <Link href="/admin/login" className="text-xs text-[#5a5550] hover:text-[#a8a29e]">管理</Link>
          </div>
        </div>
      </header>

      {/* 主內容 */}
      <main className="pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-2">
          {/* 標題 */}
          <div className="text-center mb-3">
            <h1 className="text-4xl md:text-6xl font-bold text-[#fafaf9] mb-2">
              <span className="text-[#fde047]">Go</span>！<span className="text-[#fde047]">G</span>et<span className="text-[#fde047]">M</span>ore<span className="text-[#fde047]">O</span>rders！
            </h1>
            <p className="text-sm md:text-lg text-[#a8a29e] h-6">
              {renderSubtitle(subtitles[subtitleIndex])}
            </p>
          </div>

          {/* 統計 */}
          <div className="grid grid-cols-4 gap-1.5 mb-3 max-w-2xl mx-auto">
            <div className="glass-card p-1.5 md:p-2 text-center">
              <div className="text-sm md:text-xl font-bold text-[#fde047]">{stats.pickup}</div>
              <div className="text-[9px] text-[#a8a29e]">接機單</div>
            </div>
            <div className="glass-card p-1.5 md:p-2 text-center">
              <div className="text-sm md:text-xl font-bold text-[#fde047]">{stats.dropoff}</div>
              <div className="text-[9px] text-[#a8a29e]">送機單</div>
            </div>
            <div className="glass-card p-1.5 md:p-2 text-center">
              <div className="text-sm md:text-xl font-bold text-[#fde047]">{stats.drivers}</div>
              <div className="text-[9px] text-[#a8a29e]">司機數</div>
            </div>
            <div className="glass-card p-1.5 md:p-2 text-center">
              <div className="text-sm md:text-xl font-bold text-[#fde047]">${stats.total.toLocaleString()}</div>
              <div className="text-[9px] text-[#a8a29e]">總金額</div>
            </div>
          </div>

          {/* 行程網格 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-[#a8a29e]">即時行程動態牆</h2>
              <Link href="/lobby" className="text-xs text-[#d4af37] hover:underline">查看更多</Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="glass-card p-1.5 aspect-[3/2] animate-pulse">
                    <div className="h-2 bg-[#292524] rounded w-1/2 mb-1"></div>
                    <div className="h-2 bg-[#292524] rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : displayTrips.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                {displayTrips.map((trip, i) => (
                  <div key={trip.id} className="aspect-[3/2]">
                    <AnimatedTripCard trip={trip} index={i} allTrips={displayTrips} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center text-[#5a5550]">目前沒有待接行程</div>
            )}
          </div>

          {/* CTA */}
          <div className="text-center space-y-3">
            <a href="https://lin.ee/te3BuUwK" className="inline-block px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#e8c44a] text-[#0c0a09] rounded-lg font-bold text-xs md:text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all block max-w-md mx-auto">
              我是司機，我想加入GMO一起開車
            </a>
            <a href="https://lin.ee/te3BuUwK" className="inline-block px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#e8c44a] text-[#0c0a09] rounded-lg font-bold text-xs md:text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all block max-w-md mx-auto">
              我是調度員，我想加入GMO快速派單
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#292524] py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] text-[#5a5550]">
          <p>© 2026 GMO — Give Me Order by PickYouUP</p>
        </div>
      </footer>
    </div>
  );
}
