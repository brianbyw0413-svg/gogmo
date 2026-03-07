// 管理員共用佈局
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 檢查是否已登入
    const admin = localStorage.getItem('gmo_admin');
    if (!admin) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('gmo_admin');
    router.push('/');
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0c0a09]">
      {/* 導航列 */}
      <nav className="bg-[#1a1918] border-b border-[#292524] p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-[#d4af37]">GMO 管理後台</h1>
            <div className="flex gap-4">
              <Link 
                href="/admin/drivers" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/admin/drivers' 
                    ? 'bg-[#d4af37] text-[#0c0a09]' 
                    : 'text-[#a8a29e] hover:text-[#d4af37]'
                }`}
              >
                司機審核
              </Link>
              <Link 
                href="/admin/dispatchers" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/admin/dispatchers' 
                    ? 'bg-[#d4af37] text-[#0c0a09]' 
                    : 'text-[#a8a29e] hover:text-[#d4af37]'
                }`}
              >
                調度員審核
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#a8a29e] hover:text-[#d4af37] text-sm">
              回首頁
            </Link>
            <button 
              onClick={handleLogout}
              className="text-[#a8a29e] hover:text-red-400 text-sm"
            >
              登出
            </button>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto p-6">
        {children}
      </div>
    </div>
  );
}
