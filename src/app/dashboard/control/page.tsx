// 行控中心 - 卡片/條列 雙視圖 + 即時狀態

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trip, TripStatus, Driver } from '@/types';
import { getTrips, getDrivers, updateTripStatus, assignDriver, updateTripPriceBoost } from '@/lib/data';
import TripCard from '@/components/TripCard';

function formatDate(d: string) { if (!d) return ''; return new Date(d).toLocaleDateString('zh-TW',{month:'short',day:'numeric'}); }
function formatTime(t: string) { if (!t) return ''; const [h,m] = t.split(':'); return `${h}:${m}`; }

export default function ControlPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  const loadData = useCallback(async () => {
    const [tripsData, driversData] = await Promise.all([getTrips(), getDrivers()]);
    setTrips(tripsData);
    setDrivers(driversData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredTrips = trips.filter(trip => statusFilter === 'all' || trip.status === statusFilter);

  const stats = {
    total: trips.length,
    open: trips.filter(t => t.status === 'open').length,
    accepted: trips.filter(t => t.status === 'accepted').length,
    inProgress: trips.filter(t => ['arrived','picked_up'].includes(t.status)).length,
    completed: trips.filter(t => t.status === 'completed').length
  };

  const handleAssignDriver = (tripId: string) => { setSelectedTripId(tripId); setShowAssignModal(true); };
  const handleConfirmAssign = async (driverId: string) => {
    if (selectedTripId && driverId) { await assignDriver(selectedTripId, driverId); await loadData(); setShowAssignModal(false); setSelectedTripId(''); }
  };
  const handleUpdatePrice = async (tripId: string, boostAmount: number) => { await updateTripPriceBoost(tripId, boostAmount); await loadData(); };
  const handleCancel = async (tripId: string) => { if (confirm('確定要撤銷這張訂單嗎？')) { await updateTripStatus(tripId, 'cancelled'); await loadData(); } };
  const handleComplete = async (tripId: string) => { await updateTripStatus(tripId, 'completed'); await loadData(); };
  const handleStatusUpdate = async (tripId: string, status: TripStatus) => { await updateTripStatus(tripId, status); await loadData(); };

  // 狀態標籤 - 綠色風格
  const statusBadge = (status: string) => {
    const map: Record<string,{bg:string;text:string;label:string}> = {
      open:      { bg:'bg-red-500/20',    text:'text-red-400',    label:'待接單' },
      accepted:  { bg:'bg-green-500/20',  text:'text-green-400',  label:'已接單' },
      arrived:   { bg:'bg-green-500/30',  text:'text-green-300',  label:'已抵達' },
      picked_up: { bg:'bg-green-500/40',  text:'text-green-200',  label:'已上車' },
      completed: { bg:'bg-gray-500/20',   text:'text-gray-400',   label:'已完成' },
      cancelled: { bg:'bg-gray-500/10',   text:'text-gray-500',   label:'已取消' },
    };
    const s = map[status] || map.open;
    return <span className={`text-[10px] px-2 py-1 rounded ${s.bg} ${s.text} font-bold`}>{s.label}</span>;
  };

  // 條列式行
  const renderListRow = (trip: Trip, index: number) => {
    const isPickup = trip.service_type === 'pickup';
    const orderNum = `PYU-${(trip.service_date || '').replace(/-/g,'').slice(2)}-${String(index+1).padStart(4,'0')}`;

    return (
      <tr key={trip.id} className="border-b border-[#292524] hover:bg-[#1c1917]/50 transition-colors">
        {/* 單號 */}
        <td className="px-3 py-3 text-xs font-mono text-[#d4af37] whitespace-nowrap">{orderNum}</td>
        {/* 日期 */}
        <td className="px-3 py-3 text-xs text-[#e8e6e3] whitespace-nowrap">{formatDate(trip.service_date)}</td>
        {/* 接送 */}
        <td className="px-3 py-3 whitespace-nowrap">
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${
            isPickup ? 'bg-blue-500/30 text-blue-300' : 'bg-orange-500/30 text-orange-300'
          }`}>{isPickup ? '接機' : '送機'}</span>
        </td>
        {/* 金額 */}
        <td className="px-3 py-3 text-xs font-bold text-[#d4af37] text-right whitespace-nowrap">
          ${trip.amount.toLocaleString()}
          {trip.price_boost && trip.price_boost > 0 && <span className="text-red-400 ml-1">+{trip.price_boost}</span>}
        </td>
        {/* 司機 */}
        <td className="px-3 py-3 text-xs text-[#c8c0b8] whitespace-nowrap">
          {trip.driver ? trip.driver.name : <span className="text-[#5a5550]">-</span>}
        </td>
        {/* 狀態 */}
        <td className="px-3 py-3 whitespace-nowrap">{statusBadge(trip.status)}</td>
        {/* 操作 - 5 個按鈕 */}
        <td className="px-3 py-3 whitespace-nowrap">
          <div className="flex gap-1">
            <button className="text-[10px] px-2 py-1 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:text-[#fafaf9] hover:border-[#d4af37]/50">詳情</button>
            <button className="text-[10px] px-2 py-1 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:text-[#fafaf9] hover:border-[#d4af37]/50">修改</button>
            <button onClick={() => handleUpdatePrice(trip.id, 100)} className="text-[10px] px-2 py-1 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:text-red-400 hover:border-red-500/50">加價</button>
            <button onClick={() => handleAssignDriver(trip.id)} className="text-[10px] px-2 py-1 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:text-[#fafaf9] hover:border-[#d4af37]/50">司機</button>
            <button className="text-[10px] px-2 py-1 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:text-[#d4af37] hover:border-[#d4af37]/50">聊天</button>
          </div>
        </td>
      </tr>
    );
  };

  // 手機版條列卡片 - 精簡版
  const renderListMobileCard = (trip: Trip, index: number) => {
    const isPickup = trip.service_type === 'pickup';
    const orderNum = `PYU-${(trip.service_date || '').replace(/-/g,'').slice(2)}-${String(index+1).padStart(4,'0')}`;

    return (
      <div key={trip.id} className="glass-card p-3 space-y-2">
        {/* 第一行：單號 + 接送 + 金額 + 狀態 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#d4af37]">{orderNum}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPickup ? 'bg-blue-500/30 text-blue-300' : 'bg-orange-500/30 text-orange-300'}`}>
            {isPickup ? '接' : '送'}
          </span>
          <span className="text-sm font-bold text-[#d4af37] ml-auto">${trip.amount.toLocaleString()}</span>
          {statusBadge(trip.status)}
        </div>
        {/* 第二行：日期 + 司機 */}
        <div className="flex items-center justify-between text-xs text-[#8a8580]">
          <span>{formatDate(trip.service_date)}</span>
          <span>{trip.driver?.name || '未派單'}</span>
        </div>
        {/* 第三行：5 個操作按鈕 */}
        <div className="flex gap-1">
          <button className="flex-1 text-[10px] py-1.5 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735]">詳情</button>
          <button className="flex-1 text-[10px] py-1.5 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735]">修改</button>
          <button onClick={() => handleUpdatePrice(trip.id, 100)} className="flex-1 text-[10px] py-1.5 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735]">加價</button>
          <button onClick={() => handleAssignDriver(trip.id)} className="flex-1 text-[10px] py-1.5 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735]">司機</button>
          <button className="flex-1 text-[10px] py-1.5 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735]">聊天</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 頁面標題 */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#fafaf9] mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          行控中心
        </h1>
        <p className="text-sm text-[#a8a29e]">即時監控所有行程狀態</p>
      </div>

      {/* 統計儀表板 */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="glass-card p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-[#fafaf9]">{stats.total}</div>
          <div className="text-[10px] sm:text-xs text-[#a8a29e]">總行程</div>
        </div>
        <div className="glass-card p-3 sm:p-4 text-center border border-red-500/30">
          <div className="text-xl sm:text-2xl font-bold text-red-400">{stats.open}</div>
          <div className="text-[10px] sm:text-xs text-[#a8a29e]">待接單</div>
        </div>
        <div className="glass-card p-3 sm:p-4 text-center border border-green-500/30">
          <div className="text-xl sm:text-2xl font-bold text-green-400">{stats.accepted}</div>
          <div className="text-[10px] sm:text-xs text-[#a8a29e]">已接單</div>
        </div>
        <div className="glass-card p-3 sm:p-4 text-center border border-blue-500/30">
          <div className="text-xl sm:text-2xl font-bold text-blue-400">{stats.inProgress}</div>
          <div className="text-[10px] sm:text-xs text-[#a8a29e]">服務中</div>
        </div>
        <div className="glass-card p-3 sm:p-4 text-center border border-gray-500/30">
          <div className="text-xl sm:text-2xl font-bold text-gray-400">{stats.completed}</div>
          <div className="text-[10px] sm:text-xs text-[#a8a29e]">已完成</div>
        </div>
      </div>

      {/* 視圖切換 + 篩選器 */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* 卡片/條列 切換 */}
        <div className="flex rounded-lg overflow-hidden border border-[#292524]">
          <button onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'card' ? 'bg-[#d4af37] text-[#0c0a09]' : 'bg-[#1c1917] text-[#a8a29e] hover:text-[#fafaf9]'
            }`}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            卡片
          </button>
          <button onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'list' ? 'bg-[#d4af37] text-[#0c0a09]' : 'bg-[#1c1917] text-[#a8a29e] hover:text-[#fafaf9]'
            }`}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            條列
          </button>
        </div>

        {/* 分隔線 */}
        <div className="w-px h-6 bg-[#292524] hidden sm:block"></div>

        {/* 狀態篩選 */}
        {(['all','open','accepted','arrived','picked_up','completed'] as const).map(s => {
          const labels: Record<string, string> = { all:'全部', open:'待接單', accepted:'已接單', arrived:'已抵達', picked_up:'已上車', completed:'已完成' };
          const active: Record<string, string> = { all:'bg-[#d4af37] text-[#0c0a09]', open:'bg-red-500 text-white', accepted:'bg-green-500 text-white', arrived:'bg-blue-500 text-white', picked_up:'bg-purple-500 text-white', completed:'bg-gray-500 text-white' };
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${statusFilter === s ? active[s] : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'}`}>
              {labels[s]}
            </button>
          );
        })}
      </div>

      {/* ═══ 卡片視圖 ═══ */}
      {viewMode === 'card' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="h-4 bg-[#292524] rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-[#292524] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#292524] rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredTrips.map((trip, index) => (
              <div key={trip.id} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                <TripCard
                  trip={trip}
                  onAssignDriver={handleAssignDriver}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                  onUpdatePrice={handleUpdatePrice}
                  onUpdateStatus={handleStatusUpdate}
                  showChat={true}
                  tripNumber={index + 1}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-[#a8a29e]">沒有符合條件的行程</p>
          </div>
        )
      )}

      {/* ═══ 條列視圖 ═══ */}
      {viewMode === 'list' && (
        loading ? (
          <div className="glass-card overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-3 py-3 border-b border-[#292524] animate-pulse flex gap-4">
                <div className="h-3 bg-[#292524] rounded w-8"></div>
                <div className="h-3 bg-[#292524] rounded w-16"></div>
                <div className="h-3 bg-[#292524] rounded w-12"></div>
                <div className="h-3 bg-[#292524] rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : filteredTrips.length > 0 ? (
          <>
            {/* 桌面表格 */}
            <div className="hidden sm:block glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#292524] bg-[#1c1917]">
                      <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#a8a29e] uppercase">單號</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#a8a29e] uppercase">日期</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#a8a29e] uppercase">接送</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-medium text-[#a8a29e] uppercase">金額</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#a8a29e] uppercase">司機</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#a8a29e] uppercase">狀態</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#a8a29e] uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrips.map((trip, i) => renderListRow(trip, i))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* 手機版卡片列表 */}
            <div className="sm:hidden space-y-2">
              {filteredTrips.map((trip, i) => renderListMobileCard(trip, i))}
            </div>
          </>
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-[#a8a29e]">沒有符合條件的行程</p>
          </div>
        )
      )}

      {/* 派單 Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[#fafaf9] mb-4">選擇司機</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {drivers.map(driver => (
                <button key={driver.id} onClick={() => handleConfirmAssign(driver.id)}
                  className="w-full p-3 rounded-lg bg-[#1c1917] border border-[#292524] hover:border-[#d4af37] transition-colors text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#fafaf9]">{driver.name}</p>
                      <p className="text-xs text-[#a8a29e]">{driver.car_color} {driver.car_plate}</p>
                    </div>
                    <span className="text-xs text-[#d4af37]">{driver.phone}</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowAssignModal(false)}
              className="mt-4 w-full py-2 border border-[#292524] rounded-lg text-[#a8a29e] hover:text-[#fafaf9] transition-colors">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
