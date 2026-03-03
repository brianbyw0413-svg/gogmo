// TripCard 元件 - 行程卡片 (v5c — 質感配色升級)
// 暗色漸層底 + 金色標籤 + 層次分明面板
// 佈局不變：頂部標頭 | 中間左右分區 | 底部四按鈕

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
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[d.getMonth()];
}

function generateTripNumber(tripNumber: number): string {
  return `${getMonthCode(new Date().toISOString())}${String(tripNumber).padStart(5, '0')}`;
}

function formatTime(time: string) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

function formatDate(date: string) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

// ==================== PUBLIC VARIANT ====================
function PublicTripCard({ trip }: { trip: Trip }) {
  const isPickup = trip.service_type === 'pickup';
  const orderNumber = generateTripNumber(1);

  return (
    <div className="glass-card p-2 md:p-3 h-full flex flex-col relative overflow-hidden">
      {trip.price_boost && trip.price_boost > 0 && (
        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
          +${trip.price_boost}
        </span>
      )}
      <span className="absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#d4af37]/20 text-[#d4af37] z-10">
        {orderNumber}
      </span>
      <div className="mb-2 flex items-center justify-between mt-4">
        <span className={`text-xs md:text-sm font-bold px-2.5 py-1.5 rounded ${
          isPickup ? 'bg-blue-500/40 text-blue-300' : 'bg-orange-500/40 text-orange-300'
        }`}>
          {isPickup ? '接機' : '送機'}
        </span>
        <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
          待接單
        </span>
      </div>
      <div className="mb-2 text-[10px] md:text-xs text-[#a8a29e]">
        {formatDate(trip.service_date)} {formatTime(trip.service_time)}
      </div>
      <div className="flex-1 space-y-1.5 overflow-hidden">
        <div className="flex items-start gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#d4af37] mt-1 flex-shrink-0" />
          <p className="text-xs md:text-sm font-medium text-[#fafaf9] truncate">
            {trip.pickup_area || trip.pickup_address}
          </p>
        </div>
        <div className="flex items-start gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#d4af37] mt-1 flex-shrink-0" />
          <p className="text-xs md:text-sm font-medium text-[#fafaf9] truncate">
            {trip.dropoff_area || trip.dropoff_address}
          </p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-[#292524] flex items-center justify-between">
        <div className="text-[9px] md:text-[10px] text-[#a8a29e]">
          {trip.passenger_count}人 / {trip.luggage_count}件
          {trip.flight_number && <span className="ml-1">/ {trip.flight_number}</span>}
        </div>
        <span className="text-sm md:text-base font-bold text-[#d4af37]">
          ${trip.amount}
        </span>
      </div>
    </div>
  );
}

// ==================== DEFAULT VARIANT (v5c) ====================
export default function TripCard({ 
  trip, 
  onAssignDriver, 
  onCancel,
  onComplete,
  onUpdatePrice,
  onUpdateStatus,
  showActions = true,
  variant = 'default',
  showChat = false,
  tripNumber = 1
}: TripCardProps) {
  if (variant === 'public') {
    return <PublicTripCard trip={trip} />;
  }
  if (variant !== 'default') {
    return null;
  }

  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState('');

  const isPickup = trip.service_type === 'pickup';
  const isOpen = trip.status === 'open';
  const isAccepted = trip.status === 'accepted';
  const isArrived = trip.status === 'arrived';
  const isPickedUp = trip.status === 'picked_up';
  
  const orderNumber = generateTripNumber(tripNumber);

  const handlePriceBoost = (amount: number) => {
    if (onUpdatePrice) onUpdatePrice(trip.id, amount);
    setExpandedAction(null);
  };

  const handleCustomPrice = () => {
    const amount = parseInt(customPrice);
    if (!isNaN(amount) && amount > 0 && onUpdatePrice) onUpdatePrice(trip.id, amount);
    setCustomPrice('');
    setExpandedAction(null);
  };

  const handleStatusUpdate = (status: TripStatus) => {
    if (onUpdateStatus) onUpdateStatus(trip.id, status);
    setExpandedAction(null);
  };

  const isUrgentTrip = (t: Trip): boolean => {
    return t.status === 'open' && (() => {
      const now = new Date();
      const serviceDateTime = new Date(`${t.service_date}T${t.service_time}`);
      const diffHours = (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 24;
    })();
  };

  const isUrgent = isUrgentTrip(trip);

  // 外框光暈
  const getOuterGlow = () => {
    if (isUrgent) return 'ring-2 ring-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.35)] animate-pulse';
    if (isAccepted || isArrived || isPickedUp) return 'ring-2 ring-green-500/50 shadow-[0_0_16px_rgba(34,197,94,0.2)]';
    if (isOpen) return 'ring-2 ring-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]';
    return '';
  };

  // ── 色彩系統 ──
  // 卡片底：#141211 (深黑偏暖)
  // 面板底：#1e1c1a (深棕灰) + 金色細邊框
  // 標頭分隔線：金色漸層
  // 狀態按鈕未啟動：#2a2725 + 金色細邊

  const renderStatusButtons = () => {
    if (trip.status === 'completed' || trip.status === 'cancelled') {
      return (
        <div className="flex flex-col gap-2">
          <div className="px-3 py-2.5 rounded-lg text-center text-sm font-bold bg-[#2a2725] text-[#78716c] border border-[#3a3735]">
            {trip.status === 'completed' ? '已完成' : '已取消'}
          </div>
        </div>
      );
    }

    const statusIs = (s: TripStatus) => trip.status === s;
    const arrivedActive = statusIs('arrived') || statusIs('picked_up') || statusIs('completed');
    const pickedUpActive = statusIs('picked_up') || statusIs('completed');
    const completedActive = statusIs('completed');

    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={() => handleStatusUpdate('arrived')}
          className={`px-3 py-2.5 rounded-lg text-center text-sm font-bold transition-all ${
            arrivedActive
              ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:border-emerald-500/50 hover:text-emerald-400'
          }`}
        >
          已抵達
        </button>
        <button
          onClick={() => handleStatusUpdate('picked_up')}
          className={`px-3 py-2.5 rounded-lg text-center text-sm font-bold transition-all ${
            pickedUpActive
              ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:border-blue-500/50 hover:text-blue-400'
          }`}
        >
          客上
        </button>
        <button
          onClick={() => handleStatusUpdate('completed')}
          className={`px-3 py-2.5 rounded-lg text-center text-sm font-bold transition-all ${
            completedActive
              ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-[#2a2725] text-[#8a8580] border border-[#3a3735] hover:border-[#d4af37]/50 hover:text-[#d4af37]'
          }`}
        >
          客下
        </button>
      </div>
    );
  };

  // ── 展開面板 ──
  const renderExpandedContent = () => {
    const panelClass = "absolute inset-0 z-30 p-4 overflow-y-auto rounded-xl bg-[#141211] border border-[#d4af37]/30";
    const closeBtn = (
      <button onClick={() => setExpandedAction(null)} className="text-[#a8a29e] hover:text-[#fafaf9] text-lg leading-none">✕</button>
    );

    switch (expandedAction) {
      case '詳':
        return (
          <div className={panelClass}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#d4af37]">訂單詳情</h3>
              {closeBtn}
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['訂單編號', orderNumber],
                ['服務類型', isPickup ? '接機' : '送機'],
                ['聯絡人', trip.contact_name || '-'],
                ['聯絡電話', trip.contact_phone || '-'],
                ['航班編號', trip.flight_number || '-'],
                ['乘客人數', `${trip.passenger_count}人`],
                ['行李件數', `${trip.luggage_count}件`],
                ['服務日期', `${formatDate(trip.service_date)} ${formatTime(trip.service_time)}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-[#2a2725] pb-1">
                  <span className="text-[#8a8580]">{label}：</span>
                  <span className="text-[#e8e6e3]">{value}</span>
                </div>
              ))}
              <div className="flex flex-col border-b border-[#2a2725] pb-1">
                <span className="text-[#8a8580]">上車地址：</span>
                <span className="text-[#e8e6e3]">{trip.pickup_address || trip.pickup_area || '-'}</span>
              </div>
              <div className="flex flex-col border-b border-[#2a2725] pb-1">
                <span className="text-[#8a8580]">下車地址：</span>
                <span className="text-[#e8e6e3]">{trip.dropoff_address || trip.dropoff_area || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#2a2725] pb-1">
                <span className="text-[#8a8580]">應收金額：</span>
                <span className="text-[#d4af37] font-bold">${trip.amount}</span>
              </div>
              {trip.price_boost && trip.price_boost > 0 && (
                <div className="flex justify-between border-b border-[#2a2725] pb-1">
                  <span className="text-[#8a8580]">加價金額：</span>
                  <span className="text-red-400 font-bold">+${trip.price_boost}</span>
                </div>
              )}
              {trip.note && (
                <div className="flex flex-col pt-1">
                  <span className="text-[#8a8580]">備註：</span>
                  <span className="text-[#e8e6e3]">{trip.note}</span>
                </div>
              )}
              {trip.driver && (
                <>
                  <div className="flex justify-between border-t border-[#2a2725] pt-2 mt-2">
                    <span className="text-[#8a8580]">司機：</span>
                    <span className="text-[#e8e6e3]">{trip.driver.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8a8580]">車輛：</span>
                    <span className="text-[#e8e6e3]">{trip.driver.car_color} {trip.driver.car_plate}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case '改':
        return (
          <div className={panelClass}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#d4af37]">修改訂單</h3>
              {closeBtn}
            </div>
            <div className="space-y-3 text-xs">
              {[
                { label: '航班編號', type: 'text', defaultValue: trip.flight_number || '' },
                { label: '乘客人數', type: 'number', defaultValue: trip.passenger_count },
                { label: '行李件數', type: 'number', defaultValue: trip.luggage_count },
                { label: '上車地址', type: 'text', defaultValue: trip.pickup_address || '' },
                { label: '下車地址', type: 'text', defaultValue: trip.dropoff_address || '' },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-[#8a8580] block mb-1">{field.label}</label>
                  <input 
                    type={field.type}
                    defaultValue={field.defaultValue}
                    className="w-full px-2 py-1.5 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] focus:border-[#d4af37]/50 focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="text-[#8a8580] block mb-1">備註</label>
                <textarea 
                  defaultValue={trip.note || ''}
                  rows={2}
                  className="w-full px-2 py-1.5 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] focus:border-[#d4af37]/50 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 bg-[#d4af37] text-[#0c0a09] rounded font-bold hover:bg-[#e8c44a] transition-colors">
                  儲存修改
                </button>
                {onCancel && (
                  <button 
                    onClick={() => { onCancel(trip.id); setExpandedAction(null); }}
                    className="flex-1 py-2 bg-red-500/15 text-red-400 rounded font-bold border border-red-500/30 hover:bg-red-500/25"
                  >
                    撤單
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case '$':
        return (
          <div className={`${panelClass} flex flex-col`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#d4af37]">加價功能</h3>
              {closeBtn}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[100, 200, 300, 400, 500, 600, 800, 1000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => handlePriceBoost(amount)}
                    className="py-2 text-xs bg-[#2a2725] text-[#c8c0b8] rounded border border-[#3a3735] hover:bg-[#d4af37] hover:text-[#0c0a09] hover:border-[#d4af37] transition-all font-medium"
                  >
                    +${amount}
                  </button>
                ))}
              </div>
              <div className="border-t border-[#2a2725] pt-3">
                <label className="text-[#8a8580] text-xs block mb-1">自訂金額</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="輸入金額"
                    className="flex-1 px-3 py-2 bg-[#1e1c1a] border border-[#3a3735] rounded text-[#e8e6e3] placeholder-[#5a5550] focus:border-[#d4af37]/50 focus:outline-none"
                  />
                  <button
                    onClick={handleCustomPrice}
                    className="px-4 py-2 bg-[#d4af37] text-[#0c0a09] rounded font-bold hover:bg-[#e8c44a]"
                  >
                    確定
                  </button>
                </div>
              </div>
            </div>
            {trip.price_boost && trip.price_boost > 0 && (
              <div className="mt-3 pt-2 border-t border-[#2a2725] text-center">
                <span className="text-red-400 text-sm font-medium">目前加價：${trip.price_boost}</span>
              </div>
            )}
          </div>
        );

      case '聊':
        return (
          <div className={panelClass}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#d4af37]">聊天室</h3>
              {closeBtn}
            </div>
            <div className="space-y-2">
              {trip.driver && (
                <Link
                  href={`/chat/${trip.id}?mode=driver`}
                  className="block w-full py-3 text-center text-xs bg-[#2a2725] text-[#c8c0b8] rounded-lg border border-[#3a3735] hover:border-[#d4af37]/50 hover:text-[#fafaf9] transition-all font-medium"
                >
                  司機對話
                </Link>
              )}
              <Link
                href={`/chat/${trip.id}?mode=customer`}
                className="block w-full py-3 text-center text-xs bg-[#2a2725] text-[#c8c0b8] rounded-lg border border-[#3a3735] hover:border-[#d4af37]/50 hover:text-[#fafaf9] transition-all font-medium"
              >
                客人對話
              </Link>
              <Link
                href={`/chat/${trip.id}?mode=group`}
                className="block w-full py-3 text-center text-xs bg-[#d4af37]/10 text-[#d4af37] rounded-lg border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition-all font-medium"
              >
                三方聊天室
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all duration-300 ${getOuterGlow()}`}
      style={{
        background: 'linear-gradient(180deg, #1a1816 0%, #131110 100%)',
        border: '1px solid #2a2725',
        height: '320px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ═══ 頂部列：訂單編號 | 急 | 接/送 | 金額 ═══ */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.25)' }}
      >
        {/* 訂單編號 */}
        <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#d4af37] text-[#0c0a09] tracking-wide">
          {orderNumber}
        </span>

        {/* 急單標籤 */}
        {isUrgent && (
          <span className="text-[11px] font-bold px-2 py-1 rounded bg-red-500 text-white">
            急
          </span>
        )}

        {/* 接/送標籤 */}
        <span className={`text-[11px] font-bold px-2 py-1 rounded ${
          isPickup
            ? 'bg-blue-500/25 text-blue-400 border border-blue-500/40'
            : 'bg-orange-500/25 text-orange-400 border border-orange-500/40'
        }`}>
          {isPickup ? '接' : '送'}
        </span>

        {/* 金額 — 靠右 */}
        <span className="ml-auto text-xl font-extrabold text-[#d4af37] drop-shadow-[0_0_6px_rgba(212,175,55,0.3)]">
          ${trip.amount}元
          {trip.price_boost && trip.price_boost > 0 && (
            <span className="text-sm text-red-400 ml-1 font-bold">+{trip.price_boost}</span>
          )}
        </span>
      </div>

      {/* ═══ 中間主體：左(資訊) + 右(狀態按鈕) ═══ */}
      <div className="flex gap-2 p-2 flex-1 min-h-0">
        {/* 左邊面板：行程資訊 */}
        <div
          className="flex-1 rounded-lg p-3 flex flex-col justify-center gap-1.5"
          style={{
            background: '#1e1c1a',
            border: '1px solid #3a3735',
          }}
        >
          <p className="text-[13px] font-bold text-[#e8e6e3]">
            {formatDate(trip.service_date)} {formatTime(trip.service_time)}
          </p>
          {trip.flight_number && (
            <p className="text-[13px] font-bold text-[#d4af37]">
              {trip.flight_number}
            </p>
          )}
          <p className="text-[13px] font-medium text-[#c8c0b8] truncate">
            {trip.pickup_area || trip.pickup_address || '-'}
          </p>
          <p className="text-[13px] font-medium text-[#c8c0b8] truncate">
            {trip.dropoff_area || trip.dropoff_address || '-'}
          </p>
          {trip.note ? (
            <p className="text-xs text-[#8a8580] truncate italic">
              {trip.note}
            </p>
          ) : (
            <p className="text-xs text-[#5a5550] italic">
              備註
            </p>
          )}
        </div>

        {/* 右邊面板：狀態按鈕 */}
        <div
          className="w-[100px] rounded-lg p-2 flex flex-col justify-center"
          style={{
            background: '#1e1c1a',
            border: '1px solid #3a3735',
          }}
        >
          {renderStatusButtons()}
          {trip.driver && (
            <p className="mt-2 text-[9px] text-center text-[#6a6560] truncate">
              {trip.driver.name}
            </p>
          )}
        </div>
      </div>

      {/* ═══ 底部功能列：詳 改 $ 聊 ═══ */}
      <div className="flex gap-2 px-2 pb-2 flex-shrink-0">
        {['詳', '改', '$', '聊'].map(label => (
          <button
            key={label}
            onClick={() => setExpandedAction(expandedAction === label ? null : label)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              expandedAction === label 
                ? 'bg-[#b8962f] text-[#0c0a09] shadow-inner' 
                : 'bg-gradient-to-b from-[#e0be42] to-[#c9a432] text-[#0c0a09] hover:from-[#eaca50] hover:to-[#d4af37] shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══ 展開的功能區域 (overlay) ═══ */}
      {expandedAction && renderExpandedContent()}
    </div>
  );
}
