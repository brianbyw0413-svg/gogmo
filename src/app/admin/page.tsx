// 管理員首頁儀表板
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
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

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#fafaf9]">
      <nav className="bg-[#1a1918] border-b border-[#292524] p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#d4af37]">GMO 管理後台</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#a8a29e] hover:text-[#d4af37] text-sm">回首頁</Link>
            <button onClick={handleLogout} className="text-[#a8a29e] hover:text-red-400 text-sm">登出</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">管理員儀表板</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* 司機審核 */}
          <Link href="/admin/drivers" className="block p-6 bg-[#1a1918] border border-[#292524] rounded-xl hover:border-[#d4af37] transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#d4af37] flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#fafaf9]">司機審核</h3>
                <p className="text-[#a8a29e] text-sm">審核司機認證資料</p>
              </div>
            </div>
            <div className="text-[#d4af37] text-sm">點擊進入 →</div>
          </Link>

          {/* 調度員審核 */}
          <Link href="/admin/dispatchers" className="block p-6 bg-[#1a1918] border border-[#292524] rounded-xl hover:border-[#d4af37] transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#d4af37] flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#fafaf9]">調度員審核</h3>
                <p className="text-[#a8a29e] text-sm">審核調度員認證資料</p>
              </div>
            </div>
            <div className="text-[#d4af37] text-sm">點擊進入 →</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
