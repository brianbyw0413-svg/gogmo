// 司機端首頁 — 登入 / Dashboard
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDriver } from '@/lib/driverContext';
import { supabase } from '@/lib/supabase';

function DriverPageContent() {
  const router = useRouter();
  const {
    driver,
    isLoggedIn,
    login,
    myTrips,
    completedTrips,
    getSmartMatches,
  } = useDriver();

  const searchParams = useSearchParams();
  const lineLogin = searchParams.get('line_login') === 'true';

  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');

  // LINE Login 回來時自動帶入 LINE 名稱，並檢查是否已註冊
  useEffect(() => {
    if (lineLogin) {
      const lineUser = localStorage.getItem('gmo_line_user');
      if (lineUser) {
        try {
          const profile = JSON.parse(lineUser);
          setName(profile.displayName || '');
          // 檢查是否已註冊
          checkRegistration(profile.userId);
        } catch (e) {
          console.error('Failed to parse LINE user:', e);
        }
      }
    }
  }, [lineLogin]);

  const checkRegistration = async (lineId: string) => {
    // 檢查此 LINE ID 是否已註冊
    const { data } = await supabase
      .from('drivers')
      .select('id, status')
      .eq('line_id', lineId)
      .single();
    
    if (data) {
      if (data.status === 'approved') {
        // 已核准，正常登入
        return;
      } else if (data.status === 'pending') {
        setError('您的資料已提交審核，請耐心等待管理員確認。');
      } else if (data.status === 'rejected') {
        setError('您的申請已被駁回，請重新註冊。');
      }
    } else {
      // 未註冊，導向註冊頁面
      router.push('/driver/register?line_login=true');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !plate.trim()) {
      setError('請輸入 LINE 名稱和車牌號碼');
      return;
    }
    login(name.trim(), plate.trim());
  };

  // 未登入 → 登入表單
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09] grid-bg">
        <div className="w-full max-w-md p-8 glass-card animate-fadeIn">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#b8962f] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-[#0c0a09]">G</span>
            </div>
            <h1 className="text-2xl font-bold text-[#fafaf9]">GMO 司機端</h1>
            <p className="text-[#a8a29e] mt-2">Give Me Order — 接單、賺錢</p>
          </div>

          {/* 登入表單 */}
          <form onSubmit={handleLogin} className="space-y-4">
            {lineLogin && (
              <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg p-3 text-sm text-[#d4af37]">
                ✨ 已透過 LINE 登入，請輸入車牌號碼完成绑定
              </div>
            )}
            <div>
              <label className="block text-sm text-[#a8a29e] mb-2">LINE 名稱</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-dark w-full"
                placeholder="輸入您的 LINE 名稱..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-[#a8a29e] mb-2">車牌號碼</label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="input-dark w-full"
                placeholder="例：ABC-1234"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button type="submit" className="btn-gold w-full py-3">
              登入
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-[#a8a29e]">還沒註冊嗎？</p>
            <Link href="/driver/register" className="text-sm text-[#d4af37] hover:underline block">
              我是司機，立即註冊 →
            </Link>
            <Link href="/driver/register-dispatcher" className="text-sm text-[#78716c] hover:text-[#a8a29e] block">
              我是調度員，點此註冊 →
            </Link>
            <div>
              <Link href="/" className="text-sm text-[#a8a29e] hover:text-[#d4af37]">
                ← 返回首頁
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 已登入 → Dashboard
  const activeTrips = myTrips.filter(t =>
    ['accepted', 'arrived', 'picked_up'].includes(t.status)
  );
  const monthIncome = completedTrips.reduce((sum, t) => sum + t.driver_fee, 0);
  const matches = getSmartMatches();

  return (
    <div className="animate-fadeIn">
      {/* 歡迎文字 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#fafaf9]">
          嗨，{driver?.name} 👋
        </h1>
        <p className="text-[#a8a29e] mt-1">歡迎回到 GMO 接單平台</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-[#d4af37]">{activeTrips.length}</div>
          <div className="text-xs text-[#a8a29e] mt-1">待執行</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-[#22c55e]">{completedTrips.length}</div>
          <div className="text-xs text-[#a8a29e] mt-1">已完成</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-[#f4cf57]">${monthIncome.toLocaleString()}</div>
          <div className="text-xs text-[#a8a29e] mt-1">本月收入</div>
        </div>
      </div>

      {/* 智慧推薦 */}
      {matches.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#fafaf9] mb-3 flex items-center gap-2">
            <span className="text-[#d4af37]">✨</span> 智慧推薦
          </h2>
          <div className="space-y-3">
            {matches.slice(0, 3).map((match) => (
              <div key={match.trip.id} className="glass-card match-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">
                    {match.matchType === 'route' ? '⚡' : match.matchType === 'bundle' ? '🔗' : '⏰'}
                  </span>
                  <span className="text-sm text-[#d4af37] font-medium">{match.reason}</span>
                  <span className="ml-auto text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-full">
                    {match.matchScore}分
                  </span>
                </div>
                <div className="text-sm text-[#fafaf9]">
                  {match.trip.pickup_area} → {match.trip.dropoff_area}
                </div>
                <div className="text-xs text-[#a8a29e] mt-1">
                  {match.trip.service_date} {match.trip.service_time?.slice(0, 5)} · ${match.trip.amount}
                </div>
                <Link
                  href="/driver/cases"
                  className="btn-gold text-sm py-1.5 px-4 mt-3 inline-block"
                >
                  去看看
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快捷按鈕 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/driver/cases"
          className="glass-card p-5 text-center hover:border-[#d4af37] transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#d4af37]/20 transition-colors">
            <svg className="w-6 h-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#fafaf9]">Case 牆</p>
          <p className="text-xs text-[#a8a29e] mt-1">瀏覽可接行程</p>
        </Link>
        <Link
          href="/driver/self-customer"
          className="glass-card p-5 text-center hover:border-[#d4af37] transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#d4af37]/20 transition-colors">
            <svg className="w-6 h-6 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#fafaf9]">自客登記</p>
          <p className="text-xs text-[#a8a29e] mt-1">登記自有客戶行程</p>
        </Link>
      </div>
    </div>
  );
}

// 包裹 Suspense boundary
export default function DriverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0c0a09]"><div className="text-[#a8a29e]">載入中...</div></div>}>
      <DriverPageContent />
    </Suspense>
  );
}
