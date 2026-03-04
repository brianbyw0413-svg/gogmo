// Sidebar 元件 - 車頭端側邊欄導航 (RWD 版 — 手機用底部導航列)

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  shortLabel: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: '快速派單',
    shortLabel: '派單',
    href: '/dashboard/dispatch',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )
  },
  {
    label: '行控中心',
    shortLabel: '行控',
    href: '/dashboard/control',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    )
  },
  {
    label: '帳務中心',
    shortLabel: '帳務',
    href: '/dashboard/finance',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── 桌面版：左側邊欄 ── */}
      <aside className="hidden lg:flex sidebar w-64 h-screen fixed left-0 top-0 flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-[#292524]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962f] flex items-center justify-center">
              <span className="text-xl font-bold text-[#0c0a09]">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#fafaf9]">GMO</h1>
              <p className="text-xs text-[#a8a29e]">車頭端管理系統</p>
            </div>
          </Link>
        </div>

        {/* 導航選單 */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${isActive ? 'bg-[#d4af37] text-[#0c0a09] font-medium' : 'text-[#a8a29e] hover:bg-[#292524] hover:text-[#fafaf9]'}`}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部 */}
        <div className="p-4 border-t border-[#292524]">
          <div className="text-xs text-[#a8a29e] text-center">
            <p>GMO v1.0.0</p>
            <p className="mt-1">MVP 版本</p>
          </div>
        </div>
      </aside>

      {/* ── 手機/平板版：底部導航列 ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c0a09]/95 backdrop-blur-md border-t border-[#292524] safe-area-bottom">
        <div className="flex items-stretch justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors
                  ${isActive ? 'text-[#d4af37]' : 'text-[#78716c] active:text-[#a8a29e]'}`}>
                {item.icon}
                <span className="text-[10px] font-medium">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
