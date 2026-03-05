// 首頁 - 緊湊行程卡片網格 (最多20筆)

'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Trip } from '@/types';
import { getTrips } from '@/lib/data';

function formatDate(d: string) { if (!d) return ''; return new Date(d).toLocaleDateString('zh-TW',{month:'short',day:'numeric'}); }
function formatTime(t: string) { if (!t) return ''; const [h,m] = t.split(':'); return `${h}:${m}`; }

// 緊湊型行程卡片
function CompactTripCard({ trip }: { trip: Trip }) {
  const isPickup = trip.service_type === 'pickup';
  const totalAmount = trip.amount + (trip.price_boost || 0);
  const isUrgent = trip.price_boost && trip.price_boost > 0;
  
  return (
    <div className="h-full flex flex-col relative overflow-hidden" 
      style={{
        background: 'linear-gradient(145deg, #1a1816 0%, #0f0e0d 100%)',
        border: isUrgent ? '2px solid #ef4444' : '1px solid #2a2725',
        borderRadius: '10px',
      }}>
      
      {/* 頂部：接送 + 金額 (最顯眼) */}
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          isPickup ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
        }`}>
          {isPickup ? '接機' : '送機'}
        </span>
        {trip.flight_number && (
          <span className="text-[10px] font-bold text-[#d4af37] px-1.5 py-0.5 rounded bg-[#d4af37]/15">
            {trip.flight_number}
          </span>
        )}
        <span className="ml-auto text-base font-extrabold text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
          ${totalAmount}
        </span>
      </div>

      {/* 中間：起點 → 終點 (緊湊) */}
      <div className="flex-1 p-2 flex flex-col justify-center gap-0.5">
        <div className="flex items-start gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1 flex-shrink-0" />
          <p className="text-[11px] font-medium text-[#fafaf9] truncate leading-tight">{trip.pickup_area || trip.pickup_address}</p>
        </div>
        <div className="ml-0.5 w-0.5 h-2 bg-gradient-to-b from-[#d4af37] to-transparent" />
        <div className="flex items-start gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1 flex-shrink-0" />
          <p className="text-[11px] font-medium text-[#fafaf9] truncate leading-tight">{trip.dropoff_area || trip.dropoff_address}</p>
        </div>
      </div>

      {/* 底部：時間 + 人數 (緊湊) */}
      <div className="px-2 py-1.5 flex items-center justify-between" style={{ borderTop: '1px solid #2a2725' }}>
        <span className="text-[10px] font-medium text-[#c8c0b8]">
          {formatDate(trip.service_date)} {formatTime(trip.service_time)}
        </span>
        <span className="text-[10px] text-[#8a8580]">
          {trip.passenger_count}人 {trip.luggage_count}件
        </span>
      </div>
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
        setTrips(openTrips.slice(0, 20)); // 最多20筆
        setLoading(false);
      });
    };
    
    fetchTrips();
    const interval = setInterval(fetchTrips, 5000);
    return () => clearInterval(interval);
  }, []);

  // 統計資訊
  const stats = useMemo(() => {
    const pickup = trips.filter(t => t.service_type === 'pickup').length;
    const dropoff = trips.filter(t => t.service_type === 'dropoff').length;
    const total = trips.reduce((sum, t) => sum + t.amount + (t.price_boost || 0), 0);
    const drivers = new Set(trips.filter(t => t.driver_id).map(t => t.driver_id)).size;
    return { pickup, dropoff, total, drivers };
  }, [trips]);

  // 取前20筆
  const displayTrips = trips.slice(0, 20);

  return (
    <div className="min-h-screen bg-[#0c0a09] grid-bg">
      {/* 頂部導航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0a09]/80 backdrop-blur-sm border-b border-[#292524]">
        <div className="max-w-7xl mx-auto px-3 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962f] flex items-center justify-center">
              <span className="text-lg font-bold text-[#0c0a09]">G</span>
            </div>
            <span className="text-lg font-bold text-[#fafaf9]">GMO</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/lobby" className="text-[#a8a29e] hover:text-[#d4af37]">接單大廳</Link>
            <Link href="/driver" className="text-[#a8a29e] hover:text-[#d4af37]">司機登入</Link>
            <Link href="/dashboard" className="px-3 py-1.5 bg-[#d4af37] text-[#0c0a09] rounded font-bold text-xs">
              車頭登入
            </Link>
          </div>
        </div>
      </header>

      {/* 主內容 */}
      <main className="pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-2">
          {/* 標題 */}
          <div className="text-center mb-3">
            <h1 className="text-2xl md:text-4xl font-bold text-[#fafaf9] mb-1">
              <span className="text-[#d4af37]">G</span>ive <span className="text-[#d4af37]">M</span>e <span className="text-[#d4af37]">O</span>rder
            </h1>
            <p className="text-[10px] md:text-sm text-[#78716c]">專業機場接送派單平台</p>
          </div>

          {/* 統計資訊 - 緊湊 */}
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

          {/* 行程網格 - 緊湊4x5 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-[#a8a29e]">
                即時行程 <span className="text-[#d4af37]">{displayTrips.length}</span> 筆
              </h2>
              <Link href="/lobby" className="text-xs text-[#d4af37] hover:underline">查看更多</Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="glass-card p-2 aspect-[4/3] animate-pulse">
                    <div className="h-3 bg-[#292524] rounded w-1/2 mb-2"></div>
                    <div className="h-2 bg-[#292524] rounded w-3/4 mb-1"></div>
                    <div className="h-2 bg-[#292524] rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : displayTrips.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {displayTrips.map((trip) => (
                  <div key={trip.id} className="aspect-[4/3]">
                    <CompactTripCard trip={trip} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center text-[#5a5550]">目前沒有待接行程</div>
            )}
          </div>

          {/* CTA - 吸引司機註冊 */}
          <div className="text-center">
            <Link href="/driver" className="inline-block px-6 py-3 bg-gradient-to-r from-[#d4af37] to-[#e8c44a] text-[#0c0a09] rounded-xl font-bold text-sm md:text-base shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all">
              司機註冊入口
            </Link>
            <p className="mt-2 text-[10px] text-[#5a5550]">加入GMO，搶接更多好單！</p>
          </div>
        </div>
      </main>

      {/* 頁腳 */}
      <footer className="border-t border-[#292524] py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] text-[#5a5550]">
          <p>© 2026 GMO — Give Me Order by PickYouUP</p>
        </div>
      </footer>
    </div>
  );
}
