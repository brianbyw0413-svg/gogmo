// 首頁式行程 - 條列展示 + 即時狀態

'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Trip, TripStatus, Driver } from '@/types';
import { getTrips, getDrivers, assignDriver, updateTripPriceBoost, updateTrip } from '@/lib/data';

function formatDate(d: string) { if (!d) return ''; return new Date(d).toLocaleDateString('zh-TW',{month:'short',day:'numeric'}); }
function formatTime(t: string) { if (!t) return ''; const [h,m] = t.split(':'); return `${h}:${m}`; }

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal 狀態
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [detailModalTrip, setDetailModalTrip] = useState<Trip | null>(null);
  const [editModalTrip, setEditModalTrip] = useState<Trip | null>(null);
  const [editForm, setEditForm] = useState({
    flight_number: '',
    passenger_count: 1,
    luggage_count: 0,
    pickup_address: '',
    dropoff_address: '',
    note: '',
  });
  const [priceBoostModalTrip, setPriceBoostModalTrip] = useState<Trip | null>(null);
  const [customBoostAmount, setCustomBoostAmount] = useState('');

  // 載入資料 + 每5秒自動更新
  useEffect(() => {
    const fetchData = () => {
      Promise.all([getTrips(), getDrivers()]).then(([tripsData, driversData]) => {
        setTrips(tripsData);
        setDrivers(driversData);
        setLoading(false);
      });
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // 統計資訊
  const stats = useMemo(() => {
    const open = trips.filter(t => t.status === 'open').length;
    const accepted = trips.filter(t => t.status === 'accepted').length;
    const inProgress = trips.filter(t => ['arrived','picked_up'].includes(t.status)).length;
    const total = trips.reduce((sum, t) => sum + t.amount + (t.price_boost || 0), 0);
    return { open, accepted, inProgress, total };
  }, [trips]);

  // 狀態標籤
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

  // 進度指示器（已抵達/客上/客下）
  const ProgressIndicator = ({ trip }: { trip: Trip }) => {
    const isArrived = trip.status === 'arrived' || trip.status === 'picked_up' || trip.status === 'completed';
    const isPickedUp = trip.status === 'picked_up' || trip.status === 'completed';
    const isCompleted = trip.status === 'completed';
    
    return (
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${isArrived ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-gray-600'}`} />
        <div className={`w-2 h-2 rounded-full ${isPickedUp ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]' : 'bg-gray-600'}`} />
        <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]' : 'bg-gray-600'}`} />
      </div>
    );
  };

  // 條列式行渲染
  const renderListRow = (trip: Trip, index: number) => {
    const isPickup = trip.service_type === 'pickup';
    const orderNum = `PYU-${(trip.service_date || '').replace(/-/g,'').slice(2)}-${String(index+1).padStart(4,'0')}`;

    return (
      <tr key={trip.id} className="border-b border-[#292524] hover:bg-[#1c1917]/50 transition-colors">
        <td className="px-2 py-2 text-xs font-mono text-[#d4af37] whitespace-nowrap">{orderNum}</td>
        <td className="px-2 py-2 text-xs text-[#e8e6e3] whitespace-nowrap">{formatDate(trip.service_date)}</td>
        <td className="px-2 py-2 whitespace-nowrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isPickup ? 'bg-blue-500/30 text-blue-300' : 'bg-orange-500/30 text-orange-300'
          }`}>{isPickup ? '接機' : '送機'}</span>
        </td>
        <td className="px-2 py-2 text-xs text-[#e8e6e3] whitespace-nowrap">{trip.flight_number || '-'}</td>
        <td className="px-2 py-2 text-xs text-[#c8c0b8] max-w-[80px] truncate">{trip.pickup_area || trip.pickup_address || '-'}</td>
        <td className="px-2 py-2 text-xs text-[#c8c0b8] max-w-[80px] truncate">{trip.dropoff_area || trip.dropoff_address || '-'}</td>
        <td className="px-2 py-2 text-xs text-[#8a8580] whitespace-nowrap">{trip.passenger_count}人/{trip.luggage_count}件</td>
        <td className="px-2 py-2 text-xs font-bold text-[#d4af37] text-right whitespace-nowrap">
          ${trip.amount.toLocaleString()}
          {trip.price_boost && trip.price_boost > 0 && <span className="text-red-400 ml-1">+{trip.price_boost}</span>}
        </td>
        <td className="px-2 py-2 text-xs text-[#c8c0b8] whitespace-nowrap">{trip.driver?.name || <span className="text-[#5a5550]">-</span>}</td>
        <td className="px-2 py-2 whitespace-nowrap"><ProgressIndicator trip={trip} /></td>
        <td className="px-2 py-2 whitespace-nowrap">{statusBadge(trip.status)}</td>
        <td className="px-2 py-2 whitespace-nowrap">
          <div className="flex gap-0.5 flex-wrap">
            <button onClick={() => setDetailModalTrip(trip)} className="text-[9px] px-1.5 py-1 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:text-[#fafaf9] hover:border-[#d4af37]/50">詳情</button>
            <button onClick={() => { setEditForm({flight_number:trip.flight_number||'',passenger_count:trip.passenger_count||1,luggage_count:trip.luggage_count||0,pickup_address:trip.pickup_address||'',dropoff_address:trip.dropoff_address||'',note:trip.note||''}); setEditModalTrip(trip); }} className="text-[9px] px-1.5 py-1 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:text-[#fafaf9] hover:border-[#d4af37]/50">修改</button>
            <button onClick={() => { setCustomBoostAmount(''); setPriceBoostModalTrip(trip); }} className="text-[9px] px-1.5 py-1 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:text-red-400 hover:border-red-500/50">加價</button>
            <button onClick={() => { setSelectedTripId(trip.id); setShowAssignModal(true); }} className="text-[9px] px-1.5 py-1 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:text-[#fafaf9] hover:border-[#d4af37]/50">司機</button>
            <Link href={`/chat/${trip.id}?mode=group`} className="text-[9px] px-1.5 py-1 rounded bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:text-[#d4af37] hover:border-[#d4af37]/50 inline-block text-center">聊天</Link>
          </div>
        </td>
      </tr>
    );
  };

  // 處理派單
  const handleConfirmAssign = async (driverId: string) => {
    if (selectedTripId && driverId) { 
      await assignDriver(selectedTripId, driverId); 
      const [tripsData] = await Promise.all([getTrips(), getDrivers()]);
      setTrips(tripsData);
      setShowAssignModal(false); 
      setSelectedTripId(''); 
    }
  };

  // 處理加價
  const handleDoPriceBoost = async (amount: number) => {
    if (!priceBoostModalTrip || amount <= 0) return;
    await updateTripPriceBoost(priceBoostModalTrip.id, amount);
    const [tripsData] = await Promise.all([getTrips(), getDrivers()]);
    setTrips(tripsData);
    setPriceBoostModalTrip(null);
  };

  // 處理儲存編輯
  const handleSaveEdit = async () => {
    if (!editModalTrip) return;
    await updateTrip(editModalTrip.id, editForm);
    const [tripsData] = await Promise.all([getTrips(), getDrivers()]);
    setTrips(tripsData);
    setEditModalTrip(null);
  };

  // 重新整理資料
  const refreshData = async () => {
    const [tripsData] = await Promise.all([getTrips(), getDrivers()]);
    setTrips(tripsData);
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] grid-bg">
      {/* 頂部導航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0a09]/80 backdrop-blur-sm border-b border-[#292524]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962f] flex items-center justify-center">
              <span className="text-xl font-bold text-[#0c0a09]">G</span>
            </div>
            <span className="text-xl font-bold text-[#fafaf9]">GMO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/lobby" className="text-[#a8a29e] hover:text-[#d4af37] transition-colors">
              接單大廳
            </Link>
            <Link href="/driver" className="text-[#a8a29e] hover:text-[#d4af37] transition-colors">
              司機登入
            </Link>
            <Link href="/dashboard" className="btn-gold">
              車頭登入
            </Link>
          </div>
        </div>
      </header>

      {/* 主內容 */}
      <main className="pt-24 pb-12">
        <div className="max-w-[98%] mx-auto px-2">
          {/* 標題 */}
          <div className="text-center mb-4 animate-fadeIn">
            <h1 className="text-2xl md:text-4xl font-bold text-[#fafaf9] mb-2">
              <span className="text-[#d4af37]">G</span>ive <span className="text-[#d4af37]">M</span>e <span className="text-[#d4af37]">O</span>rder
            </h1>
            <p className="text-xs text-[#78716c]">條列式行程展示 · 即時狀態同步</p>
          </div>

          {/* 統計資訊 */}
          <div className="grid grid-cols-4 gap-2 mb-4 max-w-3xl mx-auto">
            <div className="glass-card p-2 text-center">
              <div className="text-lg font-bold text-red-400">{stats.open}</div>
              <div className="text-[10px] text-[#a8a29e]">待接單</div>
            </div>
            <div className="glass-card p-2 text-center">
              <div className="text-lg font-bold text-green-400">{stats.accepted}</div>
              <div className="text-[10px] text-[#a8a29e]">已接單</div>
            </div>
            <div className="glass-card p-2 text-center">
              <div className="text-lg font-bold text-blue-400">{stats.inProgress}</div>
              <div className="text-[10px] text-[#a8a29e]">服務中</div>
            </div>
            <div className="glass-card p-2 text-center">
              <div className="text-lg font-bold text-[#d4af37]">${stats.total.toLocaleString()}</div>
              <div className="text-[10px] text-[#a8a29e]">總金額</div>
            </div>
          </div>

          {/* 條列式行程表格 */}
          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-[#292524] rounded mb-2 animate-pulse" />
                ))}
              </div>
            ) : trips.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#292524] bg-[#1c1917]">
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">單號</th>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">日期</th>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">接送</th>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">航班</th>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">起點</th>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">終點</th>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">人件</th>
                      <th className="px-2 py-2 text-right text-[10px] font-medium text-[#a8a29e]">金額</th>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">司機</th>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">進度</th>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">狀態</th>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-[#a8a29e]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip, i) => renderListRow(trip, i))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-[#5a5550]">目前沒有行程</div>
            )}
          </div>

          {/* 快速按鈕 */}
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={refreshData} className="px-4 py-2 bg-[#2a2725] text-[#a8a29e] rounded-lg border border-[#3a3735] text-sm hover:text-[#fafaf9]">
              🔄 重新整理
            </button>
            <Link href="/lobby" className="px-4 py-2 bg-[#2a2725] text-[#a8a29e] rounded-lg border border-[#3a3735] text-sm hover:text-[#d4af37]">
              查看更多 →
            </Link>
          </div>
        </div>
      </main>

      {/* 頁腳 */}
      <footer className="border-t border-[#292524] py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-[#5a5550]">
          <p>© 2026 GMO — Give Me Order by PickYouUP</p>
        </div>
      </footer>

      {/* ===== Modal 們 ===== */}

      {/* 詳情 Modal */}
      {detailModalTrip && (() => {
        const tripOrderNum = `PYU-${(detailModalTrip.service_date || '').replace(/-/g,'').slice(2)}-0001`;
        return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-5 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#d4af37]">訂單詳情</h3>
              <button onClick={() => setDetailModalTrip(null)} className="text-[#a8a29e] hover:text-[#fafaf9] text-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-[#292524] pb-2">
                <span className="text-[#8a8580]">訂單編號：</span>
                <span className="text-[#e8e6e3] font-mono">{tripOrderNum}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-2">
                <span className="text-[#8a8580]">服務類型：</span>
                <span className="text-[#e8e6e3]">{detailModalTrip.service_type === 'pickup' ? '接機' : '送機'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-2">
                <span className="text-[#8a8580]">聯絡人：</span>
                <span className="text-[#e8e6e3]">{detailModalTrip.contact_name || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-2">
                <span className="text-[#8a8580]">電話：</span>
                <span className="text-[#e8e6e3]">{detailModalTrip.contact_phone || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-2">
                <span className="text-[#8a8580]">航班：</span>
                <span className="text-[#e8e6e3]">{detailModalTrip.flight_number || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-2">
                <span className="text-[#8a8580]">人數/行李：</span>
                <span className="text-[#e8e6e3]">{detailModalTrip.passenger_count}人 / {detailModalTrip.luggage_count}件</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-2">
                <span className="text-[#8a8580]">時間：</span>
                <span className="text-[#e8e6e3]">{formatDate(detailModalTrip.service_date)} {formatTime(detailModalTrip.service_time)}</span>
              </div>
              <div className="flex flex-col border-b border-[#292524] pb-2">
                <span className="text-[#8a8580]">上車地址：</span>
                <span className="text-[#e8e6e3]">{detailModalTrip.pickup_address || detailModalTrip.pickup_area || '-'}</span>
              </div>
              <div className="flex flex-col border-b border-[#292524] pb-2">
                <span className="text-[#8a8580]">下车地址：</span>
                <span className="text-[#e8e6e3]">{detailModalTrip.dropoff_address || detailModalTrip.dropoff_area || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-2">
                <span className="text-[#8a8580]">金額：</span>
                <span className="text-[#d4af37] font-bold">${detailModalTrip.amount}</span>
              </div>
              {detailModalTrip.price_boost && detailModalTrip.price_boost > 0 && (
                <div className="flex justify-between border-b border-[#292524] pb-2">
                  <span className="text-[#8a8580]">加價：</span>
                  <span className="text-red-400 font-bold">+${detailModalTrip.price_boost}</span>
                </div>
              )}
              {detailModalTrip.note && (
                <div className="flex flex-col pt-1">
                  <span className="text-[#8a8580]">備註：</span>
                  <span className="text-[#e8e6e3]">{detailModalTrip.note}</span>
                </div>
              )}
              {detailModalTrip.driver && (
                <>
                  <div className="flex justify-between border-t border-[#292524] pt-3 mt-2">
                    <span className="text-[#8a8580]">司機：</span>
                    <span className="text-[#e8e6e3]">{detailModalTrip.driver.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a8580]">車輛：</span>
                    <span className="text-[#e8e6e3]">{detailModalTrip.driver.car_color} {detailModalTrip.driver.car_plate}</span>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setDetailModalTrip(null)} className="mt-5 w-full py-2 bg-[#2a2725] text-[#a8a29e] rounded-lg border border-[#3a3735] hover:text-[#fafaf9]">
              關閉
            </button>
          </div>
        </div>
        );
      })()}

      {/* 編輯 Modal */}
      {editModalTrip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-5 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#d4af37]">修改訂單</h3>
              <button onClick={() => setEditModalTrip(null)} className="text-[#a8a29e] hover:text-[#fafaf9] text-xl">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-[#8a8580] block mb-1">航班編號</label>
                <input type="text" value={editForm.flight_number} onChange={e => setEditForm({...editForm, flight_number: e.target.value})}
                  className="w-full px-3 py-2 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] focus:border-[#d4af37]/50 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8580] block mb-1">乘客人數</label>
                  <input type="number" value={editForm.passenger_count} onChange={e => setEditForm({...editForm, passenger_count: parseInt(e.target.value)||1})}
                    className="w-full px-3 py-2 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] focus:border-[#d4af37]/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[#8a8580] block mb-1">行李件數</label>
                  <input type="number" value={editForm.luggage_count} onChange={e => setEditForm({...editForm, luggage_count: parseInt(e.target.value)||0})}
                    className="w-full px-3 py-2 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] focus:border-[#d4af37]/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[#8a8580] block mb-1">上車地址</label>
                <input type="text" value={editForm.pickup_address} onChange={e => setEditForm({...editForm, pickup_address: e.target.value})}
                  className="w-full px-3 py-2 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] focus:border-[#d4af37]/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[#8a8580] block mb-1">下车地址</label>
                <input type="text" value={editForm.dropoff_address} onChange={e => setEditForm({...editForm, dropoff_address: e.target.value})}
                  className="w-full px-3 py-2 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] focus:border-[#d4af37]/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[#8a8580] block mb-1">備註</label>
                <textarea value={editForm.note} onChange={e => setEditForm({...editForm, note: e.target.value})} rows={2}
                  className="w-full px-3 py-2 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] focus:border-[#d4af37]/50 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditModalTrip(null)} className="flex-1 py-2 bg-[#2a2725] text-[#a8a29e] rounded-lg border border-[#3a3735] hover:text-[#fafaf9]">取消</button>
              <button onClick={handleSaveEdit} className="flex-1 py-2 bg-[#d4af37] text-[#0c0a09] rounded-lg font-bold hover:bg-[#e8c44a]">儲存修改</button>
            </div>
          </div>
        </div>
      )}

      {/* 加價 Modal */}
      {priceBoostModalTrip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-5 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#d4af37]">加價功能</h3>
              <button onClick={() => setPriceBoostModalTrip(null)} className="text-[#a8a29e] hover:text-[#fafaf9] text-xl">✕</button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[100, 200, 300, 400, 500, 600, 800, 1000].map(amount => (
                <button key={amount} onClick={() => handleDoPriceBoost(amount)}
                  className="py-2 text-sm bg-[#2a2725] text-[#c8c0b8] rounded border border-[#3a3735] hover:bg-[#d4af37] hover:text-[#0c0a09] transition-all font-medium">
                  +${amount}
                </button>
              ))}
            </div>
            <div className="border-t border-[#292524] pt-4">
              <label className="text-[#8a8580] text-sm block mb-2">自訂金額</label>
              <div className="flex gap-2">
                <input type="number" value={customBoostAmount} onChange={e => setCustomBoostAmount(e.target.value)} placeholder="輸入金額"
                  className="flex-1 px-3 py-2 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] placeholder-[#5a5550] focus:border-[#d4af37]/50 focus:outline-none" />
                <button onClick={() => handleDoPriceBoost(parseInt(customBoostAmount)||0)}
                  className="px-4 py-2 bg-[#d4af37] text-[#0c0a09] rounded font-bold text-sm hover:bg-[#e8c44a]">確定</button>
              </div>
            </div>
            {priceBoostModalTrip.price_boost && priceBoostModalTrip.price_boost > 0 && (
              <div className="mt-4 pt-3 border-t border-[#292524] text-center">
                <span className="text-red-400 text-sm font-medium">目前加價：${priceBoostModalTrip.price_boost}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 派單 Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-5 w-full max-w-md mx-4">
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
            <button onClick={() => { setShowAssignModal(false); setSelectedTripId(''); }}
              className="mt-4 w-full py-2 border border-[#292524] rounded-lg text-[#a8a29e] hover:text-[#fafaf9]">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
