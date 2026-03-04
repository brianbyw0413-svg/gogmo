// TripCard 元件 - 行程卡片 (v5f — 緊湊版 + 觸碰才亮外框)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trip, TripStatus } from '@/types';

interface TripCardProps {
  trip: Trip;
  onAssignDriver?: (tripId: string) => void;
  onCancel?: (tripId: string) => void;
  onComplete?: (tripId: string) => void;
  onUpdatePrice?: (tripId: string, amount: number) => void;
  onUpdateStatus?: (tripId: string, status: TripStatus) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'public' | 'driver';
  showChat?: boolean;
  tripNumber?: number;
}

function getMonthCode(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return months[d.getMonth()];
}
function generateTripNumber(n: number) { return `${getMonthCode(new Date().toISOString())}${String(n).padStart(5,'0')}`; }
function formatTime(t: string) { if (!t) return ''; const [h,m] = t.split(':'); return `${h}:${m}`; }
function formatDate(d: string) { if (!d) return ''; return new Date(d).toLocaleDateString('zh-TW',{month:'short',day:'numeric'}); }

// ==================== PUBLIC VARIANT (首頁/大廳用) ====================
// 顯眼設計：接機/送機、金額、起點、終點
function PublicTripCard({ trip }: { trip: Trip }) {
  const isPickup = trip.service_type === 'pickup';
  const totalAmount = trip.amount + (trip.price_boost || 0);
  
  return (
    <div className="h-full flex flex-col relative overflow-hidden" 
      style={{
        background: 'linear-gradient(145deg, #1a1816 0%, #0f0e0d 100%)',
        border: '1px solid #2a2725',
        borderRadius: '12px',
      }}>
      
      {/* 頂部標籤列 */}
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.3)' }}>
        {/* 接機/送機 — 大標籤 */}
        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
          isPickup 
            ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]' 
            : 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]'
        }`}>
          {isPickup ? '接機' : '送機'}
        </span>
        
        {/* 航班編號 */}
        {trip.flight_number && (
          <span className="text-xs font-bold text-[#d4af37] px-2 py-1 rounded bg-[#d4af37]/15">
            {trip.flight_number}
          </span>
        )}
        
        {/* 金額 — 右側大字 */}
        <span className="ml-auto text-lg font-extrabold text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
          ${totalAmount}
          {trip.price_boost && trip.price_boost > 0 && (
            <span className="text-xs text-red-400 ml-1">+{trip.price_boost}</span>
          )}
        </span>
      </div>

      {/* 中間：起點 → 終點 */}
      <div className="flex-1 p-3 flex flex-col justify-center gap-2">
        {/* 起點 */}
        <div className="flex items-start gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0 shadow-[0_0_6px_rgba(212,175,55,0.5)]" />
          <div>
            <p className="text-[10px] text-[#8a8580] uppercase tracking-wider">起點</p>
            <p className="text-sm font-bold text-[#fafaf9] truncate leading-tight">{trip.pickup_area || trip.pickup_address}</p>
          </div>
        </div>
        
        {/* 連接線 */}
        <div className="ml-1 w-0.5 h-4 bg-gradient-to-b from-[#d4af37] to-transparent" />
        
        {/* 終點 */}
        <div className="flex items-start gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0 shadow-[0_0_6px_rgba(212,175,55,0.5)]" />
          <div>
            <p className="text-[10px] text-[#8a8580] uppercase tracking-wider">終點</p>
            <p className="text-sm font-bold text-[#fafaf9] truncate leading-tight">{trip.dropoff_area || trip.dropoff_address}</p>
          </div>
        </div>
      </div>

      {/* 底部：時間 + 人數 */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ borderTop: '1px solid #2a2725' }}>
        <span className="text-xs font-medium text-[#c8c0b8]">
          {formatDate(trip.service_date)} {formatTime(trip.service_time)}
        </span>
        <span className="text-xs text-[#8a8580]">
          {trip.passenger_count}人 / {trip.luggage_count}件
        </span>
      </div>
    </div>
  );
}

// ==================== DEFAULT VARIANT (v5f) ====================
export default function TripCard({
  trip, onAssignDriver, onCancel, onComplete, onUpdatePrice, onUpdateStatus,
  showActions = true, variant = 'default', showChat = false, tripNumber = 1
}: TripCardProps) {
  if (variant === 'public') return <PublicTripCard trip={trip} />;
  if (variant !== 'default') return null;

  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState('');

  const isPickup = trip.service_type === 'pickup';
  const isOpen = trip.status === 'open';
  const isAccepted = trip.status === 'accepted';
  const isArrived = trip.status === 'arrived';
  const isPickedUp = trip.status === 'picked_up';
  const orderNumber = generateTripNumber(tripNumber);

  const handlePriceBoost = (amt: number) => { onUpdatePrice?.(trip.id, amt); setExpandedAction(null); };
  const handleCustomPrice = () => {
    const amt = parseInt(customPrice);
    if (!isNaN(amt) && amt > 0) onUpdatePrice?.(trip.id, amt);
    setCustomPrice(''); setExpandedAction(null);
  };
  const handleStatusUpdate = (s: TripStatus) => { onUpdateStatus?.(trip.id, s); setExpandedAction(null); };

  const isUrgent = trip.status === 'open' && (() => {
    const now = new Date();
    const sdt = new Date(`${trip.service_date}T${trip.service_time}`);
    const h = (sdt.getTime() - now.getTime()) / 3600000;
    return h >= 0 && h <= 24;
  })();

  // 常駐外框 — 讓車頭一眼辨識卡片狀態
  const getBorderStyle = () => {
    if (isUrgent) return 'ring-2 ring-red-500 shadow-[0_0_16px_rgba(239,68,68,0.3)] animate-pulse';
    if (isAccepted || isArrived || isPickedUp) return 'ring-2 ring-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
    if (isOpen) return 'ring-2 ring-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.12)]';
    return 'ring-1 ring-[#3a3735]';
  };

  // 狀態按鈕
  const renderStatusButtons = () => {
    if (trip.status === 'completed' || trip.status === 'cancelled') {
      return (
        <div className="px-2 py-1.5 rounded text-center text-sm font-bold bg-[#2a2725] text-[#78716c] border border-[#3a3735]">
          {trip.status === 'completed' ? '已完成' : '已取消'}
        </div>
      );
    }
    const sIs = (s: TripStatus) => trip.status === s;
    const aAct = sIs('arrived') || sIs('picked_up');
    const pAct = sIs('picked_up');
    const on = "bg-emerald-500 text-white";
    const off = "bg-[#2a2725] text-[#8a8580] border border-[#3a3735]";
    return (
      <>
        <button onClick={() => handleStatusUpdate('arrived')}
          className={`px-1 py-1.5 rounded text-center text-xs font-bold whitespace-nowrap transition-all ${aAct ? on : `${off} active:border-emerald-500/50 active:text-emerald-400`}`}>
          已抵達</button>
        <button onClick={() => handleStatusUpdate('picked_up')}
          className={`px-1 py-1.5 rounded text-center text-xs font-bold whitespace-nowrap transition-all ${pAct ? on : `${off} active:border-blue-500/50 active:text-blue-400`}`}>
          客上</button>
        <button onClick={() => handleStatusUpdate('completed')}
          className={`px-1 py-1.5 rounded text-center text-xs font-bold whitespace-nowrap transition-all ${off} active:border-[#d4af37]/50 active:text-[#d4af37]`}>
          客下</button>
      </>
    );
  };

  // 展開面板
  const renderExpanded = () => {
    const cls = "absolute inset-0 z-30 p-3 overflow-y-auto rounded-xl bg-[#141211] border border-[#d4af37]/30";
    const close = <button onClick={() => setExpandedAction(null)} className="text-[#a8a29e] hover:text-[#fafaf9] text-lg leading-none">✕</button>;

    switch (expandedAction) {
      case '詳情':
        return (
          <div className={cls}>
            <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-[#d4af37]">訂單詳情</h3>{close}</div>
            <div className="space-y-1.5 text-xs">
              {[['訂單編號',orderNumber],['服務類型',isPickup?'接機':'送機'],['聯絡人',trip.contact_name||'-'],['聯絡電話',trip.contact_phone||'-'],['航班編號',trip.flight_number||'-'],['乘客人數',`${trip.passenger_count}人`],['行李件數',`${trip.luggage_count}件`],['服務日期',`${formatDate(trip.service_date)} ${formatTime(trip.service_time)}`]].map(([l,v])=>(
                <div key={l} className="flex justify-between border-b border-[#2a2725] pb-1"><span className="text-[#8a8580]">{l}：</span><span className="text-[#e8e6e3]">{v}</span></div>
              ))}
              <div className="flex flex-col border-b border-[#2a2725] pb-1"><span className="text-[#8a8580]">上車地址：</span><span className="text-[#e8e6e3]">{trip.pickup_address||trip.pickup_area||'-'}</span></div>
              <div className="flex flex-col border-b border-[#2a2725] pb-1"><span className="text-[#8a8580]">下車地址：</span><span className="text-[#e8e6e3]">{trip.dropoff_address||trip.dropoff_area||'-'}</span></div>
              <div className="flex justify-between border-b border-[#2a2725] pb-1"><span className="text-[#8a8580]">應收金額：</span><span className="text-[#d4af37] font-bold">${trip.amount}</span></div>
              {trip.price_boost&&trip.price_boost>0&&<div className="flex justify-between border-b border-[#2a2725] pb-1"><span className="text-[#8a8580]">加價金額：</span><span className="text-red-400 font-bold">+${trip.price_boost}</span></div>}
              {trip.note&&<div className="flex flex-col pt-1"><span className="text-[#8a8580]">備註：</span><span className="text-[#e8e6e3]">{trip.note}</span></div>}
              {trip.driver&&(<><div className="flex justify-between border-t border-[#2a2725] pt-2 mt-1"><span className="text-[#8a8580]">司機：</span><span className="text-[#e8e6e3]">{trip.driver.name}</span></div><div className="flex justify-between"><span className="text-[#8a8580]">車輛：</span><span className="text-[#e8e6e3]">{trip.driver.car_color} {trip.driver.car_plate}</span></div></>)}
            </div>
          </div>);
      case '修改':
        return (
          <div className={cls}>
            <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-[#d4af37]">修改訂單</h3>{close}</div>
            <div className="space-y-2 text-xs">
              {[{l:'航班編號',t:'text',v:trip.flight_number||''},{l:'乘客人數',t:'number',v:trip.passenger_count},{l:'行李件數',t:'number',v:trip.luggage_count},{l:'上車地址',t:'text',v:trip.pickup_address||''},{l:'下車地址',t:'text',v:trip.dropoff_address||''}].map(f=>(
                <div key={f.l}><label className="text-[#8a8580] block mb-0.5">{f.l}</label><input type={f.t} defaultValue={f.v} className="w-full px-2 py-1 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] focus:border-[#d4af37]/50 focus:outline-none text-xs"/></div>))}
              <div><label className="text-[#8a8580] block mb-0.5">備註</label><textarea defaultValue={trip.note||''} rows={2} className="w-full px-2 py-1 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] focus:border-[#d4af37]/50 focus:outline-none text-xs"/></div>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 py-1.5 bg-[#d4af37] text-[#0c0a09] rounded font-bold hover:bg-[#e8c44a] text-xs">儲存修改</button>
                {onCancel&&<button onClick={()=>{onCancel(trip.id);setExpandedAction(null)}} className="flex-1 py-1.5 bg-red-500/15 text-red-400 rounded font-bold border border-red-500/30 text-xs">撤單</button>}
              </div>
            </div>
          </div>);
      case '加價':
        return (
          <div className={`${cls} flex flex-col`}>
            <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-[#d4af37]">加價功能</h3>{close}</div>
            <div className="flex-1">
              <div className="grid grid-cols-4 gap-1.5 mb-2">{[100,200,300,400,500,600,800,1000].map(a=>(<button key={a} onClick={()=>handlePriceBoost(a)} className="py-1.5 text-xs bg-[#2a2725] text-[#c8c0b8] rounded border border-[#3a3735] hover:bg-[#d4af37] hover:text-[#0c0a09] transition-all font-medium">+${a}</button>))}</div>
              <div className="border-t border-[#2a2725] pt-2"><label className="text-[#8a8580] text-xs block mb-1">自訂金額</label>
                <div className="flex gap-2"><input type="number" value={customPrice} onChange={e=>setCustomPrice(e.target.value)} placeholder="輸入金額" className="flex-1 px-2 py-1.5 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] placeholder-[#5a5550] focus:border-[#d4af37]/50 focus:outline-none text-xs"/>
                  <button onClick={handleCustomPrice} className="px-3 py-1.5 bg-[#d4af37] text-[#0c0a09] rounded font-bold text-xs">確定</button></div>
              </div>
            </div>
            {trip.price_boost&&trip.price_boost>0&&<div className="mt-2 pt-2 border-t border-[#2a2725] text-center"><span className="text-red-400 text-xs font-medium">目前加價：${trip.price_boost}</span></div>}
          </div>);
      case '司機':
        return (
          <div className={cls}>
            <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-[#d4af37]">派單 / 司機</h3>{close}</div>
            {trip.driver?(<div className="space-y-1.5 text-xs">
              {[['姓名',trip.driver.name],['電話',trip.driver.phone||'-'],['車牌',trip.driver.car_plate||'-'],['車色',trip.driver.car_color||'-'],['車型',trip.driver.car_type==='large'?'九人座':'休旅']].map(([l,v])=>(<div key={l} className="flex justify-between border-b border-[#2a2725] pb-1"><span className="text-[#8a8580]">{l}：</span><span className="text-[#e8e6e3]">{v}</span></div>))}
              <button onClick={()=>onAssignDriver?.(trip.id)} className="w-full mt-2 py-1.5 bg-[#2a2725] text-[#c8c0b8] rounded border border-[#3a3735] hover:border-[#d4af37]/50 font-medium text-xs">更換司機</button>
            </div>):(<div className="text-center py-4"><p className="text-[#5a5550] text-sm mb-3">尚未派單</p><button onClick={()=>onAssignDriver?.(trip.id)} className="px-5 py-1.5 bg-[#d4af37] text-[#0c0a09] rounded font-bold text-sm">指派司機</button></div>)}
          </div>);
      case '聊天':
        return (
          <div className={cls}>
            <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-[#d4af37]">聊天室</h3>{close}</div>
            <div className="space-y-1.5">
              {trip.driver&&<Link href={`/chat/${trip.id}?mode=driver`} className="block w-full py-2 text-center text-xs bg-[#2a2725] text-[#c8c0b8] rounded border border-[#3a3735] hover:border-[#d4af37]/50 font-medium">司機對話</Link>}
              <Link href={`/chat/${trip.id}?mode=customer`} className="block w-full py-2 text-center text-xs bg-[#2a2725] text-[#c8c0b8] rounded border border-[#3a3735] hover:border-[#d4af37]/50 font-medium">客人對話</Link>
              <Link href={`/chat/${trip.id}?mode=group`} className="block w-full py-2 text-center text-xs bg-[#d4af37]/10 text-[#d4af37] rounded border border-[#d4af37]/30 font-medium">三方聊天室</Link>
            </div>
          </div>);
      default: return null;
    }
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all duration-200 ${getBorderStyle()}`}
      style={{
        background: 'linear-gradient(180deg, #1a1816 0%, #131110 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ═══ 頂部列 ═══ */}
      <div className="flex items-center gap-2 px-2.5 py-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
        <span className="text-sm font-extrabold text-[#d4af37] tracking-wide">{orderNumber}</span>
        {isUrgent && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">急</span>}
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${isPickup ? 'bg-blue-500/25 text-blue-400 border border-blue-500/40' : 'bg-orange-500/25 text-orange-400 border border-orange-500/40'}`}>
          {isPickup ? '接' : '送'}
        </span>
        <span className="ml-auto text-lg font-extrabold text-[#d4af37]">
          ${trip.amount}元{trip.price_boost && trip.price_boost > 0 && <span className="text-xs text-red-400 ml-1 font-bold">+{trip.price_boost}</span>}
        </span>
      </div>

      {/* ═══ 中間主體 ═══ */}
      <div className="flex gap-1.5 p-1.5 flex-1 min-h-0">
        {/* 左面板：行程 + 司機 */}
        <div className="flex-1 rounded-lg flex flex-col" style={{ background: '#1e1c1a', border: '1px solid #3a3735' }}>
          <div className="flex-1 px-2.5 py-2 flex flex-col justify-center gap-1">
            <p className="text-sm font-bold text-[#e8e6e3]">{formatDate(trip.service_date)} {formatTime(trip.service_time)}</p>
            {trip.flight_number && <p className="text-sm font-bold text-[#d4af37]">{trip.flight_number}</p>}
            <p className="text-sm font-medium text-[#c8c0b8] truncate">{trip.pickup_area || trip.pickup_address || '-'}</p>
            <p className="text-sm font-medium text-[#c8c0b8] truncate">{trip.dropoff_area || trip.dropoff_address || '-'}</p>
            {trip.note ? <p className="text-xs text-[#8a8580] truncate italic">{trip.note}</p> : <p className="text-xs text-[#5a5550] italic">備註</p>}
          </div>
          {/* 司機三格 */}
          <div className="flex gap-1 px-1.5 pb-1.5">
            <div className="flex-1 px-1 py-1 rounded bg-[#2a2725] border border-[#3a3735] text-center">
              <p className="text-[11px] text-[#c8c0b8] font-medium truncate">{trip.driver?.name || '-'}</p>
            </div>
            <div className="flex-1 px-1 py-1 rounded bg-[#2a2725] border border-[#3a3735] text-center">
              <p className="text-[11px] text-[#c8c0b8] truncate">{trip.driver?.car_plate || '-'}</p>
            </div>
            <div className="flex-1 px-1 py-1 rounded bg-[#2a2725] border border-[#3a3735] text-center">
              <p className="text-[11px] text-[#c8c0b8] truncate">{trip.driver ? `${trip.driver.car_type==='large'?'九人':'休旅'}/${trip.driver.car_color||''}` : '-'}</p>
            </div>
          </div>
        </div>

        {/* 右面板：狀態 + 異況 */}
        <div className="w-[82px] rounded-lg flex flex-col gap-1.5 p-1.5" style={{ background: '#1e1c1a', border: '1px solid #3a3735' }}>
          {renderStatusButtons()}
          <button className="mt-auto px-1 py-1.5 rounded text-center text-xs font-bold whitespace-nowrap bg-[#2a2725] text-[#8a8580] border border-[#3a3735] active:bg-red-500 active:text-white active:border-red-500 transition-colors">
            異況
          </button>
        </div>
      </div>

      {/* ═══ 底部五按鈕 ═══ */}
      <div className="flex gap-1 px-1.5 pb-1.5 flex-shrink-0" style={{ borderTop: '1px solid #2a2725' }}>
        {['詳情','修改','加價','司機','聊天'].map(label => (
          <button key={label}
            onClick={() => setExpandedAction(expandedAction === label ? null : label)}
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
              expandedAction === label
                ? 'bg-[#d4af37] text-[#0c0a09]'
                : 'bg-[#1e1c1a] text-[#d4af37] border border-[#d4af37]/40 active:border-[#d4af37] active:bg-[#d4af37]/10'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {expandedAction && renderExpanded()}
    </div>
  );
}
