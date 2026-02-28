// Dashboard Layout - 車頭端 Layout（含側邊欄）

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// MVP 登入密碼
const MVP_PASSWORD = 'pickyouup2026';

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 檢查登入狀態
  useEffect(() => {
    const auth = localStorage.getItem('pickyouup_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // 處理登入
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MVP_PASSWORD) {
      localStorage.setItem('pickyouup_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('密碼錯誤，請再試一次');
    }
  };

  // 處理登出
  const handleLogout = () => {
    localStorage.removeItem('pickyouup_auth');
    setIsAuthenticated(false);
    router.push('/');
  };

  // 載入中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09]">
        <div className="text-[#d4af37]">載入中...</div>
      </div>
    );
  }

  // 登入頁面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09] grid-bg">
        <div className="w-full max-w-md p-8 glass-card">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#b8962f] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-[#0c0a09]">P</span>
            </div>
            <h1 className="text-2xl font-bold text-[#fafaf9]">PickYouUP</h1>
            <p className="text-[#a8a29e] mt-2">車頭端管理系統</p>
          </div>

          {/* 登入表單 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-[#a8a29e] mb-2">請輸入密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark w-full"
                placeholder="輸入密碼..."
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
            <button
              type="submit"
              className="btn-gold w-full py-3"
            >
              登入
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-[#a8a29e] hover:text-[#d4af37]">
              ← 返回首頁
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 已登入，顯示儀表板
  return (
    <div className="min-h-screen bg-[#0c0a09]">
      <Sidebar />
      
      {/* 頂部工具列 */}
      <div className="fixed top-0 right-0 left-64 h-14 bg-[#0c0a09]/80 backdrop-blur-sm border-b border-[#292524] z-40 flex items-center justify-end px-6">
        <div className="flex items-center gap-4">
          <Link href="/lobby" className="text-sm text-[#a8a29e] hover:text-[#d4af37] transition-colors">
            接單大廳
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-[#a8a29e] hover:text-[#ef4444] transition-colors"
          >
            登出
          </button>
        </div>
      </div>

      {/* 主內容區域 */}
      <main className="ml-64 pt-14">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
