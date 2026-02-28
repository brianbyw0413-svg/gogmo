// DriverLayout - 司機端 Layout（底部導航 + 側邊欄）

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { DriverProvider, useDriver } from '@/lib/driverContext';

interface DriverLayoutProps {
  children: React.ReactNode;
}

// 導航項目
const navItems = [
  {
    label: 'Case 牆',
    href: '/driver/cases',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: '我的行程',
    href: '/driver/my-trips',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: '自客登記',
    href: '/driver/self-customer',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
];

function DriverLayoutInner({ children }: DriverLayoutProps) {
  const pathname = usePathname();
  const { driver, isLoggedIn, logout } = useDriver();

  // Dashboard 的導航項目（加上首頁）
  const allNavItems = [
    {
      label: '總覽',
      href: '/driver',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    ...navItems,
  ];

  // 如果未登入，只顯示 children（登入頁面）
  if (!isLoggedIn) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0c0a09]">
      {/* 桌面端側邊欄 */}
      <aside className="driver-sidebar w-64 h-screen fixed left-0 top-0 flex-col z-50 hidden md:flex">
        {/* Logo 區域 */}
        <div className="p-6 border-b border-[#292524]">
          <Link href="/driver" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962f] flex items-center justify-center">
              <span className="text-xl font-bold text-[#0c0a09]">G</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#fafaf9]">GMO</h1>
              <p className="text-xs text-[#a8a29e]">司機端</p>
            </div>
          </Link>
        </div>

        {/* 司機資訊 */}
        {driver && (
          <div className="px-6 py-3 border-b border-[#292524]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                <span className="text-sm font-medium text-[#d4af37]">
                  {driver.name.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#fafaf9] truncate">{driver.name}</p>
                <p className="text-xs text-[#a8a29e]">{driver.car_plate}</p>
              </div>
            </div>
          </div>
        )}

        {/* 導航選單 */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {allNavItems.map((item) => {
              const isActive = item.href === '/driver'
                ? pathname === '/driver'
                : pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-[#d4af37] text-[#0c0a09] font-medium'
                        : 'text-[#a8a29e] hover:bg-[#292524] hover:text-[#fafaf9]'
                      }
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部：登出 + 版本 */}
        <div className="p-4 border-t border-[#292524]">
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#a8a29e] hover:text-[#ef4444] transition-colors rounded-lg hover:bg-[#292524]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            登出
          </button>
          <div className="text-xs text-[#a8a29e] text-center mt-3">
            <p>GMO 司機端 v1.0</p>
          </div>
        </div>
      </aside>

      {/* 手機端頂部欄 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0a09]/90 backdrop-blur-sm border-b border-[#292524] md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/driver" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962f] flex items-center justify-center">
              <span className="text-lg font-bold text-[#0c0a09]">G</span>
            </div>
            <span className="text-lg font-bold text-[#fafaf9]">GMO</span>
          </Link>
          <div className="flex items-center gap-3">
            {driver && (
              <span className="text-xs text-[#a8a29e]">{driver.name}</span>
            )}
            <button
              onClick={logout}
              className="text-xs text-[#a8a29e] hover:text-[#ef4444]"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      {/* 桌面端頂部工具列 */}
      <div className="fixed top-0 right-0 left-64 h-14 bg-[#0c0a09]/80 backdrop-blur-sm border-b border-[#292524] z-40 hidden md:flex items-center justify-end px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-[#a8a29e] hover:text-[#d4af37] transition-colors">
            首頁
          </Link>
          <Link href="/lobby" className="text-sm text-[#a8a29e] hover:text-[#d4af37] transition-colors">
            接單大廳
          </Link>
        </div>
      </div>

      {/* 主內容區域 */}
      <main className="md:ml-64 pt-14 pb-20 md:pb-0">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* 手機端底部導航 */}
      <nav className="driver-bottom-nav flex items-center justify-around md:hidden">
        {allNavItems.map((item) => {
          const isActive = item.href === '/driver'
            ? pathname === '/driver'
            : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-[#d4af37]'
                  : 'text-[#a8a29e]'
              }`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DriverLayout({ children }: DriverLayoutProps) {
  return (
    <DriverProvider>
      <DriverLayoutInner>{children}</DriverLayoutInner>
    </DriverProvider>
  );
}
