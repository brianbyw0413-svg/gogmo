// 帳務中心 - 條列式 + Excel 匯出

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trip, FinanceStats } from '@/types';
import { getTrips, getFinanceStats } from '@/lib/data';

// 生成單號
function tripNumber(trip: Trip, index: number): string {
  const dt = trip.service_date?.replace(/-/g, '') || '00000000';
  return `PYU-${dt}-${String(index + 1).padStart(4, '0')}`;
}

// Excel 匯出（CSV with BOM for 中文相容）
function exportToExcel(trips: Trip[], tab: string) {
  const header = ['單號', '日期', '時間', '接/送', '航班', '起點', '終點', '司機姓名', '司機電話', '銀行代碼', '銀行帳號', '行程金額', '司機費用', '狀態'];
  const rows = trips.map((t, i) => [
    tripNumber(t, i),
    t.service_date || '',
    t.service_time?.slice(0, 5) || '',
    t.service_type === 'pickup' ? '接機' : '送機',
    t.flight_number || '',
    t.pickup_area || '',
    t.dropoff_area || '',
    t.driver?.name || '未指派',
    t.driver?.phone || '',
    t.driver?.bank_name || '',
    t.driver?.bank_account || '',
    String(t.amount),
    String(t.driver_fee),
    t.status === 'open' ? '待接單' : t.status === 'accepted' ? '已接單' : t.status === 'arrived' ? '已抵達' : t.status === 'picked_up' ? '客上' : t.status === 'completed' ? '已完成' : '已取消',
  ]);

  const csvContent = '\uFEFF' + [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `GMO_帳務_${tab === 'customer_pay' ? '客下匯款' : '司機回金'}_${now}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'customer_pay' | 'driver_kickback'>('customer_pay');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const tripsData = await getTrips();
    setTrips(tripsData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 過濾
  const filteredTrips = trips.filter(t => t.payment_mode === activeTab);
  const pendingTrips = filteredTrips.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTrips = filteredTrips.filter(t => t.status === 'completed');
  const totalAmount = filteredTrips.reduce((s, t) => s + t.amount, 0);
  const totalDriverFee = filteredTrips.reduce((s, t) => s + t.driver_fee, 0);

  const fmt = (n: number) => n.toLocaleString();

  // 狀態標籤
  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      open:      { bg: 'bg-red-500/20',    text: 'text-red-400',    label: '待接單' },
      accepted:  { bg: 'bg-green-500/20',  text: 'text-green-400',  label: '已接單' },
      arrived:   { bg: 'bg-blue-500/20',   text: 'text-blue-400',   label: '已抵達' },
      picked_up: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: '客上' },
      completed: { bg: 'bg-gray-500/20',   text: 'text-gray-400',   label: '已完成' },
      cancelled: { bg: 'bg-gray-500/10',   text: 'text-gray-500',   label: '已取消' },
    };
    const s = map[status] || map.open;
    return <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded ${s.bg} ${s.text} font-medium`}>{s.label}</span>;
  };

  // 表格行
  const renderRow = (trip: Trip, index: number) => (
    <tr key={trip.id} className="border-b border-[#292524] hover:bg-[#1c1917]/50 transition-colors">
      <td className="px-2 sm:px-3 py-2.5 text-xs font-mono text-[#d4af37] whitespace-nowrap">{tripNumber(trip, index)}</td>
      <td className="px-2 sm:px-3 py-2.5 text-xs text-[#e8e6e3] whitespace-nowrap">{trip.driver?.name || <span className="text-[#5a5550]">未指派</span>}</td>
      <td className="px-2 sm:px-3 py-2.5 text-xs text-[#c8c0b8] whitespace-nowrap hidden sm:table-cell">{trip.driver?.phone || '-'}</td>
      <td className="px-2 sm:px-3 py-2.5 text-xs text-[#c8c0b8] whitespace-nowrap hidden md:table-cell">{trip.driver?.bank_name || '-'}</td>
      <td className="px-2 sm:px-3 py-2.5 text-xs text-[#c8c0b8] font-mono whitespace-nowrap hidden md:table-cell">{trip.driver?.bank_account || '-'}</td>
      <td className="px-2 sm:px-3 py-2.5 text-xs font-bold text-[#d4af37] text-right whitespace-nowrap">${fmt(activeTab === 'customer_pay' ? trip.amount : trip.driver_fee)}</td>
      <td className="px-2 sm:px-3 py-2.5 whitespace-nowrap">{statusBadge(trip.status)}</td>
    </tr>
  );

  // 手機版卡片行
  const renderMobileCard = (trip: Trip, index: number) => (
    <div key={trip.id} className="glass-card p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[#d4af37]">{tripNumber(trip, index)}</span>
        {statusBadge(trip.status)}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#e8e6e3]">{trip.driver?.name || '未指派'}</span>
        <span className="text-sm font-bold text-[#d4af37]">${fmt(activeTab === 'customer_pay' ? trip.amount : trip.driver_fee)}</span>
      </div>
      {trip.driver && (
        <div className="text-xs text-[#8a8580] space-y-0.5">
          <p>{trip.driver.phone}</p>
          <p>{trip.driver.bank_name} {trip.driver.bank_account}</p>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* 標題 + 匯出按鈕 */}
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#fafaf9] mb-1">帳務中心</h1>
          <p className="text-sm text-[#a8a29e]">管理收付款項與司機結算</p>
        </div>
        <button
          onClick={() => exportToExcel(filteredTrips, activeTab)}
          className="px-3 sm:px-4 py-2 bg-[#1c1917] text-[#d4af37] border border-[#d4af37]/40 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#d4af37] hover:text-[#0c0a09] transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          匯出 Excel
        </button>
      </div>

      {/* TAB 切換 */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('customer_pay')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'customer_pay' ? 'bg-[#d4af37] text-[#0c0a09] font-bold' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'}`}>
          客下匯款
        </button>
        <button onClick={() => setActiveTab('driver_kickback')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'driver_kickback' ? 'bg-[#d4af37] text-[#0c0a09] font-bold' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'}`}>
          司機回金
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="glass-card p-3">
          <div className="text-[10px] text-[#a8a29e]">總筆數</div>
          <div className="text-xl font-bold text-[#fafaf9]">{filteredTrips.length}</div>
        </div>
        <div className="glass-card p-3">
          <div className="text-[10px] text-[#a8a29e]">{activeTab === 'customer_pay' ? '總收款' : '總回金'}</div>
          <div className="text-xl font-bold text-[#d4af37]">${fmt(activeTab === 'customer_pay' ? totalAmount : totalDriverFee)}</div>
        </div>
        <div className="glass-card p-3">
          <div className="text-[10px] text-[#a8a29e]">待處理</div>
          <div className="text-xl font-bold text-orange-400">{pendingTrips.length}</div>
        </div>
        <div className="glass-card p-3">
          <div className="text-[10px] text-[#a8a29e]">已完成</div>
          <div className="text-xl font-bold text-green-400">{completedTrips.length}</div>
        </div>
      </div>

      {/* 條列式表格 — 桌面版 */}
      <div className="hidden sm:block glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#292524] bg-[#1c1917]">
                <th className="px-3 py-3 text-left text-xs font-medium text-[#a8a29e] uppercase tracking-wider">單號</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#a8a29e] uppercase tracking-wider">司機姓名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#a8a29e] uppercase tracking-wider hidden sm:table-cell">司機電話</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#a8a29e] uppercase tracking-wider hidden md:table-cell">銀行代碼</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#a8a29e] uppercase tracking-wider hidden md:table-cell">銀行帳號</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-[#a8a29e] uppercase tracking-wider">費用</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#a8a29e] uppercase tracking-wider">狀態</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[#292524]">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-3 bg-[#292524] rounded animate-pulse w-16"></div></td>
                    ))}
                  </tr>
                ))
              ) : filteredTrips.length > 0 ? (
                filteredTrips.map((trip, i) => renderRow(trip, i))
              ) : (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-[#a8a29e]">沒有帳務資料</td></tr>
              )}
            </tbody>
            {filteredTrips.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#d4af37]/30 bg-[#1c1917]">
                  <td colSpan={5} className="px-3 py-3 text-right text-xs font-bold text-[#a8a29e]">合計 ({filteredTrips.length} 筆)</td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-[#d4af37]">${fmt(activeTab === 'customer_pay' ? totalAmount : totalDriverFee)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 手機版卡片列表 */}
      <div className="sm:hidden space-y-2">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-3 animate-pulse">
              <div className="h-3 bg-[#292524] rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-[#292524] rounded w-1/2"></div>
            </div>
          ))
        ) : filteredTrips.length > 0 ? (
          <>
            {filteredTrips.map((trip, i) => renderMobileCard(trip, i))}
            {/* 合計 */}
            <div className="glass-card p-3 border border-[#d4af37]/30">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#a8a29e]">合計 ({filteredTrips.length} 筆)</span>
                <span className="text-lg font-bold text-[#d4af37]">${fmt(activeTab === 'customer_pay' ? totalAmount : totalDriverFee)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card p-8 text-center"><p className="text-[#a8a29e]">沒有帳務資料</p></div>
        )}
      </div>
    </div>
  );
}
