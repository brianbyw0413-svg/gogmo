// TripCard 元件 - 行程卡片 (行控中心優化版 v4)
// 支援 default / public 兩種 variant
// v4: 依老闆要求重新設計卡片佈局

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

// 取得月份縮寫
function getMonthCode(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[d.getMonth()];
}

// 產生訂單編號
function generateTripNumber(tripNumber: number): string {
  return `${getMonthCode(new Date().toISOString())}${String(tripNumber).padStart(5, '0')}`;
}

// 格式化時間
function formatTime(time: string) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

// 格式化日期
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
      {/* 急單加價標籤 */}
      {trip.price_boost && trip.price_boost > 0 && (
        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
          +${trip.price_boost}
        </span>
      )}

      {/* 訂單編號標籤 */}
      <span className="absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#d4af37]/20 text-[#d4af37] z-10">
        {orderNumber}
      </span>

      {/* 接機/送機標籤 + 狀態 */}
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

      {/* 日期時間 */}
      <div className="mb-2 text-[10px] md:text-xs text-[#a8a29e]">
        {formatDate(trip.service_date)} {formatTime(trip.service_time)}
      </div>

      {/* 路線資訊 */}
      <div className="flex-1 space-y-1.5 overflow-hidden">
        <div className="flex items-start gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#d4af37] mt-1 flex-shrink-0" />
          <p className="text-xs md:text-sm font-medium text-[#fafaf9] truncate">
            {trip.pickup_area || trip.pickup_address}
          </p>
        </div>
        {trip.pickup_address && trip.pickup_address !== trip.pickup_area && (
          <p className="text-[9px] md:text-[10px] text-[#78716c] truncate ml-3.5">
            {trip.pickup_address}
          </p>
        )}
        <div className="flex items-start gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#d4af37] mt-1 flex-shrink-0" />
          <p className="text-xs md:text-sm font-medium text-[#fafaf9] truncate">
            {trip.dropoff_area || trip.dropoff_address}
          </p>
        </div>
        {trip.dropoff_address && trip.dropoff_address !== trip.dropoff_area && (
          <p className="text-[9px] md:text-[10px] text-[#78716c] truncate ml-3.5">
            {trip.dropoff_address}
          </p>
        )}
      </div>

      {/* 金額與人數 */}
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

// ==================== DEFAULT VARIANT (v4 新設計) ====================
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
  // 如果是 public variant，渲染公開版卡片
  if (variant === 'public') {
    return <PublicTripCard trip={trip} />;
  }

  // 其他 variant 暫時不處理
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

  // 處理加價
  const handlePriceBoost = (amount: number) => {
    if (onUpdatePrice) {
      onUpdatePrice(trip.id, amount);
    }
    setExpandedAction(null);
  };

  // 處理自訂金額
  const handleCustomPrice = () => {
    const amount = parseInt(customPrice);
    if (!isNaN(amount) && amount > 0 && onUpdatePrice) {
      onUpdatePrice(trip.id, amount);
    }
    setCustomPrice('');
    setExpandedAction(null);
  };

  // 處理狀態更新
  const handleStatusUpdate = (status: TripStatus) => {
    if (onUpdateStatus) {
      onUpdateStatus(trip.id, status);
    }
    setExpandedAction(null);
  };

  // 急單判斷
  const isUrgentTrip = (t: Trip): boolean => {
    return t.status === 'open' && (() => {
      const now = new Date();
      const serviceDateTime = new Date(`${t.service_date}T${t.service_time}`);
      const diffHours = (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 24;
    })();
  };

  // 根據狀態決定框線光暈
  const getBorderGlow = () => {
    // 急單：紅色呼吸光暈
    if (isUrgentTrip(trip)) {
      return 'ring-2 ring-red-500/70 shadow-lg shadow-red-500/40 animate-pulse';
    }
    // 已接單（accepted, arrived, picked_up）：綠色光暈
    if (isAccepted || isArrived || isPickedUp) {
      return 'ring-2 ring-green-500/50 shadow-lg shadow-green-500/20';
    }
    // 未接單（open）：紅色光暈
    if (isOpen) {
      return 'ring-2 ring-red-500/40 shadow-lg shadow-red-500/10';
    }
    return '';
  };

  // 產生狀態按鈕
  const renderStatusButtons = () => {
    const baseClass = "px-2 py-1 text-[10px] rounded transition-all ";
    
    if (trip.status === 'completed' || trip.status === 'cancelled') {
      return (
        <span className={`${baseClass} bg-gray-500/30 text-gray-400`}>
          {trip.status === 'completed' ? '已完成' : '已取消'}
        </span>
      );
    }

    const isCurrentStatus = (status: TripStatus) => trip.status === status;

    return (
      <div className="flex gap-1">
        <button
          onClick={() => handleStatusUpdate('arrived')}
          className={`${baseClass} ${isCurrentStatus('arrived') ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400 hover:bg-green-500/40'}`}
        >
          已抵達
        </button>
        <button
          onClick={() => handleStatusUpdate('picked_up')}
          className={`${baseClass} ${isCurrentStatus('picked_up') ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/40'}`}
        >
          客上
        </button>
        <button
          onClick={() => handleStatusUpdate('completed')}
          className={`${baseClass} ${isCurrentStatus('completed') ? 'bg-[#d4af37] text-white' : 'bg-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/40'}`}
        >
          客下
        </button>
      </div>
    );
  };

  // 渲染展開的功能區域
  const renderExpandedContent = () => {
    switch (expandedAction) {
      case '詳':
        return (
          <div className="absolute inset-0 bg-[#1c1917] z-30 p-3 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#d4af37]">訂單詳情</h3>
              <button 
                onClick={() => setExpandedAction(null)}
                className="text-[#a8a29e] hover:text-[#fafaf9]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">訂單編號：</span>
                <span className="text-[#fafaf9]">{orderNumber}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">服務類型：</span>
                <span className="text-[#fafaf9]">{isPickup ? '接機' : '送機'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">聯絡人：</span>
                <span className="text-[#fafaf9]">{trip.contact_name || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">聯絡電話：</span>
                <span className="text-[#fafaf9]">{trip.contact_phone || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">航班編號：</span>
                <span className="text-[#fafaf9]">{trip.flight_number || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">乘客人數：</span>
                <span className="text-[#fafaf9]">{trip.passenger_count}人</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">行李件數：</span>
                <span className="text-[#fafaf9]">{trip.luggage_count}件</span>
              </div>
              <div className="flex flex-col border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">上車地址：</span>
                <span className="text-[#fafaf9]">{trip.pickup_address || trip.pickup_area || '-'}</span>
              </div>
              <div className="flex flex-col border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">下车地址：</span>
                <span className="text-[#fafaf9]">{trip.dropoff_address || trip.dropoff_area || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">服務日期：</span>
                <span className="text-[#fafaf9]">{formatDate(trip.service_date)} {formatTime(trip.service_time)}</span>
              </div>
              <div className="flex justify-between border-b border-[#292524] pb-1">
                <span className="text-[#a8a29e]">應收金額：</span>
                <span className="text-[#d4af37] font-bold">${trip.amount}</span>
              </div>
              {trip.price_boost && trip.price_boost > 0 && (
                <div className="flex justify-between border-b border-[#292524] pb-1">
                  <span className="text-[#a8a29e]">加價金額：</span>
                  <span className="text-red-400 font-bold">+${trip.price_boost}</span>
                </div>
              )}
              {trip.note && (
                <div className="flex flex-col pt-1">
                  <span className="text-[#a8a29e]">備註：</span>
                  <span className="text-[#fafaf9]">{trip.note}</span>
                </div>
              )}
              {trip.driver && (
                <>
                  <div className="flex justify-between border-t border-[#292524] pt-2 mt-2">
                    <span className="text-[#a8a29e]">司機：</span>
                    <span className="text-[#fafaf9]">{trip.driver.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a8a29e]">車輛：</span>
                    <span className="text-[#fafaf9]">{trip.driver.car_color} {trip.driver.car_plate}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case '修':
        return (
          <div className="absolute inset-0 bg-[#1c1917] z-30 p-3 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#d4af37]">修改訂單</h3>
              <button 
                onClick={() => setExpandedAction(null)}
                className="text-[#a8a29e] hover:text-[#fafaf9]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#a8a29e] block mb-1">服務類型</label>
                <select 
                  defaultValue={trip.service_type}
                  className="w-full px-2 py-1.5 bg-[#0c0a09] border border-[#292524] rounded text-[#fafaf9]"
                >
                  <option value="pickup">接機</option>
                  <option value="dropoff">送機</option>
                </select>
              </div>
              <div>
                <label className="text-[#a8a29e] block mb-1">航班編號</label>
                <input 
                  type="text" 
                  defaultValue={trip.flight_number || ''}
                  className="w-full px-2 py-1.5 bg-[#0c0a09] border border-[#292524] rounded text-[#fafaf9]"
                />
              </div>
              <div>
                <label className="text-[#a8a29e] block mb-1">乘客人數</label>
                <input 
                  type="number" 
                  defaultValue={trip.passenger_count}
                  className="w-full px-2 py-1.5 bg-[#0c0a09] border border-[#292524] rounded text-[#fafaf9]"
                />
              </div>
              <div>
                <label className="text-[#a8a29e] block mb-1">行李件數</label>
                <input 
                  type="number" 
                  defaultValue={trip.luggage_count}
                  className="w-full px-2 py-1.5 bg-[#0c0a09] border border-[#292524] rounded text-[#fafaf9]"
                />
              </div>
              <div>
                <label className="text-[#a8a29e] block mb-1">上車地址</label>
                <input 
                  type="text" 
                  defaultValue={trip.pickup_address || ''}
                  className="w-full px-2 py-1.5 bg-[#0c0a09] border border-[#292524] rounded text-[#fafaf9]"
                />
              </div>
              <div>
                <label className="text-[#a8a29e] block mb-1">下车地址</label>
                <input 
                  type="text" 
                  defaultValue={trip.dropoff_address || ''}
                  className="w-full px-2 py-1.5 bg-[#0c0a09] border border-[#292524] rounded text-[#fafaf9]"
                />
              </div>
              <div>
                <label className="text-[#a8a29e] block mb-1">備註</label>
                <textarea 
                  defaultValue={trip.note || ''}
                  rows={2}
                  className="w-full px-2 py-1.5 bg-[#0c0a09] border border-[#292524] rounded text-[#fafaf9]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 bg-[#d4af37] text-[#0c0a09] rounded font-medium">
                  儲存修改
                </button>
                {onCancel && (
                  <button 
                    onClick={() => { onCancel(trip.id); setExpandedAction(null); }}
                    className="flex-1 py-2 bg-red-500/20 text-red-400 rounded font-medium"
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
          <div className="absolute inset-0 bg-[#1c1917] z-30 p-3 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#d4af37]">加價功能</h3>
              <button 
                onClick={() => setExpandedAction(null)}
                className="text-[#a8a29e] hover:text-[#fafaf9]"
              >
                ✕
              </button>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[100, 200, 300, 400, 500, 600, 800, 1000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => handlePriceBoost(amount)}
                    className="py-2 text-xs bg-[#292524] text-[#fafaf9] rounded hover:bg-[#d4af37] hover:text-[#0c0a09] transition-colors"
                  >
                    +${amount}
                  </button>
                ))}
              </div>
              <div className="border-t border-[#292524] pt-3">
                <label className="text-[#a8a29e] text-xs block mb-1">自訂金額</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="輸入金額"
                    className="flex-1 px-3 py-2 bg-[#0c0a09] border border-[#292524] rounded text-[#fafaf9] placeholder-[#78716c]"
                  />
                  <button
                    onClick={handleCustomPrice}
                    className="px-4 py-2 bg-[#d4af37] text-[#0c0a09] rounded font-medium"
                  >
                    確定
                  </button>
                </div>
              </div>
            </div>
            {trip.price_boost && trip.price_boost > 0 && (
              <div className="mt-3 pt-2 border-t border-[#292524] text-center">
                <span className="text-red-400 text-sm">目前加價：${trip.price_boost}</span>
              </div>
            )}
          </div>
        );

      case '聊':
        return (
          <div className="absolute inset-0 bg-[#1c1917] z-30 p-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#d4af37]">聊天室</h3>
              <button 
                onClick={() => setExpandedAction(null)}
                className="text-[#a8a29e] hover:text-[#fafaf9]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {trip.driver && (
                <Link
                  href={`/chat/${trip.id}?mode=driver`}
                  className="block w-full py-3 text-center text-xs bg-[#292524] text-[#fafaf9] rounded hover:bg-[#383433] transition-colors"
                >
                  🚗 司機對話
                </Link>
              )}
              <Link
                href={`/chat/${trip.id}?mode=customer`}
                className="block w-full py-3 text-center text-xs bg-[#292524] text-[#fafaf9] rounded hover:bg-[#383433] transition-colors"
              >
                👤 客人對話
              </Link>
              <Link
                href={`/chat/${trip.id}?mode=group`}
                className="block w-full py-3 text-center text-xs bg-[#d4af37]/20 text-[#d4af37] rounded hover:bg-[#d4af37]/30 transition-colors"
              >
                💬 三方聊天室
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`glass-card p-3 transition-all duration-300 hover:shadow-lg relative h-[260px] flex flex-col overflow-hidden ${getBorderGlow()}`}>
      {/* === 上方區域：訂單編號 + 接/送 + 金額 === */}
      <div className="flex items-center justify-between mb-2">
        {/* 訂單流水編號 */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
          {orderNumber}
        </span>

        {/* 接/送標籤 */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          isPickup 
            ? 'bg-blue-500/30 text-blue-300' 
            : 'bg-orange-500/30 text-orange-300'
        }`}>
          {isPickup ? '接' : '送'}
        </span>

        {/* 金額 */}
        <span className="text-lg font-bold text-[#d4af37]">
          ${trip.amount}
          {trip.price_boost && trip.price_boost > 0 && (
            <span className="text-xs text-red-400 ml-0.5">+{trip.price_boost}</span>
          )}
        </span>
      </div>

      {/* === 中間區域 === */}
      <div className="flex-1 flex gap-2 overflow-hidden">
        {/* 中間左邊：訂單資訊區 === */}
        <div className="flex-1 overflow-hidden">
          {/* 航班編號 */}
          {trip.flight_number && (
            <div className="text-xs mb-1">
              <span className="text-[#a8a29e]">航班：</span>
              <span className="text-[#fafaf9] font-medium ml-1">{trip.flight_number}</span>
            </div>
          )}
          
          {/* 起訖點 */}
          <div className="space-y-0.5">
            <div className="flex items-start gap-1">
              <span className="text-[8px] text-green-400 mt-0.5">●</span>
              <span className="text-[10px] text-[#fafaf9] truncate">
                {trip.pickup_area || trip.pickup_address || '-'}
              </span>
            </div>
            <div className="flex items-start gap-1">
              <span className="text-[8px] text-red-400 mt-0.5">●</span>
              <span className="text-[10px] text-[#fafaf9] truncate">
                {trip.dropoff_area || trip.dropoff_address || '-'}
              </span>
            </div>
          </div>

          {/* 日期時間 */}
          <div className="mt-2 text-[9px] text-[#a8a29e]">
            {formatDate(trip.service_date)} {formatTime(trip.service_time)}
          </div>
        </div>

        {/* 中間右邊：訂單動態 === */}
        <div className="w-[140px] flex flex-col justify-center">
          <div className="text-[9px] text-[#a8a29e] mb-1 text-center">訂單動態</div>
          {renderStatusButtons()}
          
          {/* 司機資訊 */}
          {trip.driver && (
            <div className="mt-2 text-[8px] text-center text-[#78716c]">
              {trip.driver.name} · {trip.driver.car_color}
            </div>
          )}
        </div>
      </div>

      {/* === 下方功能區 === */}
      <div className="flex gap-1 mt-2">
        <button
          onClick={() => setExpandedAction(expandedAction === '詳' ? null : '詳')}
          className={`flex-1 py-1.5 text-[10px] border rounded transition-colors ${
            expandedAction === '詳' 
              ? 'bg-[#d4af37] text-[#0c0a09] border-[#d4af37]' 
              : 'border-[#292524] text-[#a8a29e] hover:bg-[#292524]'
          }`}
        >
          詳
        </button>
        <button
          onClick={() => setExpandedAction(expandedAction === '修' ? null : '修')}
          className={`flex-1 py-1.5 text-[10px] border rounded transition-colors ${
            expandedAction === '修' 
              ? 'bg-[#d4af37] text-[#0c0a09] border-[#d4af37]' 
              : 'border-[#292524] text-[#a8a29e] hover:bg-[#292524]'
          }`}
        >
          修
        </button>
        <button
          onClick={() => setExpandedAction(expandedAction === '$' ? null : '$')}
          className={`flex-1 py-1.5 text-[10px] border rounded transition-colors ${
            expandedAction === '$' 
              ? 'bg-[#d4af37] text-[#0c0a09] border-[#d4af37]' 
              : 'border-[#292524] text-[#a8a29e] hover:bg-[#292524]'
          }`}
        >
          $
        </button>
        <button
          onClick={() => setExpandedAction(expandedAction === '聊' ? null : '聊')}
          className={`flex-1 py-1.5 text-[10px] border rounded transition-colors ${
            expandedAction === '聊' 
              ? 'bg-[#d4af37] text-[#0c0a09] border-[#d4af37]' 
              : 'border-[#292524] text-[#a8a29e] hover:bg-[#292524]'
          }`}
        >
          聊
        </button>
      </div>

      {/* === 展開的功能區域 === */}
      {expandedAction && renderExpandedContent()}
    </div>
  );
}
