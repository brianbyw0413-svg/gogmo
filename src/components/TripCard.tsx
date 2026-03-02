// TripCard 元件 - 行程卡片 (行控中心優化版)
// 根據老闆新設計：統一大小、三區塊佈局

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
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'public' | 'driver';
  showChat?: boolean;
}

// 取得狀態顯示文字
function getStatusText(status: TripStatus): string {
  const statusMap: Record<TripStatus, string> = {
    'open': '待接單',
    'accepted': '已接單',
    'arrived': '已抵達',
    'picked_up': '已上車',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status];
}

// 取得執行狀態顯示
function getExecutionStatus(status: TripStatus): string {
  const execMap: Record<TripStatus, string> = {
    'open': '等待司機接單',
    'accepted': '等待抵達',
    'arrived': '等待客人上車',
    'picked_up': '前往目的地',
    'completed': '行程完成',
    'cancelled': '已取消'
  };
  return execMap[status];
}

// 取得執行狀態 CSS
function getExecutionStatusClass(status: TripStatus): string {
  const classMap: Record<TripStatus, string> = {
    'open': 'bg-gray-500/20 text-gray-400',
    'accepted': 'bg-yellow-500/20 text-yellow-400',
    'arrived': 'bg-green-500/20 text-green-400',
    'picked_up': 'bg-blue-500/20 text-blue-400',
    'completed': 'bg-[#d4af37]/20 text-[#d4af37]',
    'cancelled': 'bg-red-500/20 text-red-400'
  };
  return classMap[status];
}

// 急單判斷
function isUrgentTrip(trip: Trip): boolean {
  return trip.status === 'open' && (() => {
    const now = new Date();
    const serviceDateTime = new Date(`${trip.service_date}T${trip.service_time}`);
    const diffHours = (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 24;
  })();
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

export default function TripCard({ 
  trip, 
  onAssignDriver, 
  onCancel,
  onComplete,
  onUpdatePrice,
  showActions = true,
  variant = 'default',
  showChat = false
}: TripCardProps) {
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showPriceMenu, setShowPriceMenu] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [showChatMenu, setShowChatMenu] = useState(false);

  const isPickup = trip.service_type === 'pickup';
  const isUrgent = isUrgentTrip(trip);
  const isDefault = variant === 'default';

  // 處理加價
  const handlePriceBoost = (amount: number) => {
    if (onUpdatePrice) {
      onUpdatePrice(trip.id, amount);
    }
    setShowPriceMenu(false);
  };

  // 處理自訂金額
  const handleCustomPrice = () => {
    const amount = parseInt(customPrice);
    if (!isNaN(amount) && amount > 0 && onUpdatePrice) {
      onUpdatePrice(trip.id, amount);
    }
    setCustomPrice('');
    setShowPriceMenu(false);
  };

  // 處理編輯選項
  const handleEditOption = (option: string) => {
    if (option === 'cancel' && onCancel) {
      onCancel(trip.id);
    }
    // 修改功能預留
    setShowEditMenu(false);
  };

  // 處理聊天室選項
  const handleChatOption = (target: string) => {
    // 這裡可以導向不同的聊天室
    // 司機聊天室、客人聊天室、或三方聊天室
    setShowChatMenu(false);
  };

  // 只有 default variant 使用新設計
  if (!isDefault) {
    return null; // 其他 variant 暂时不处理
  }

  return (
    <div className="glass-card p-4 transition-all duration-300 hover:shadow-lg relative h-[320px] flex flex-col">
      {/* === 上方區域：標籤放置區 === */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* 接機/送機標籤 */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded ${
          isPickup 
            ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30' 
            : 'bg-orange-500/30 text-orange-300 border border-orange-500/30'
        }`}>
          {isPickup ? '接機' : '送機'}
        </span>

        {/* 狀態標籤 */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded ${
          trip.status === 'open' ? 'bg-red-500/30 text-red-300 border border-red-500/30' :
          trip.status === 'accepted' ? 'bg-green-500/30 text-green-300 border border-green-500/30' :
          trip.status === 'arrived' ? 'bg-purple-500/30 text-purple-300 border border-purple-500/30' :
          trip.status === 'picked_up' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30' :
          'bg-gray-500/30 text-gray-300 border border-gray-500/30'
        }`}>
          {getStatusText(trip.status)}
        </span>

        {/* 急單標籤 */}
        {isUrgent && (
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-red-500/30 text-red-300 border border-red-500/30 animate-pulse">
            急單
          </span>
        )}

        {/* 加價金額標籤 */}
        {trip.price_boost && trip.price_boost > 0 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/30">
            +${trip.price_boost}
          </span>
        )}
      </div>

      {/* === 中間區域：左(大)資訊區 + 右(小)執行狀態 === */}
      <div className="flex-1 flex gap-3 min-h-0 mb-3">
        {/* 中間左側：資訊區 */}
        <div className="flex-1 bg-[#1c1917]/50 rounded-lg p-3 overflow-y-auto">
          <div className="space-y-2 text-xs">
            {/* 聯絡人 */}
            <div className="flex">
              <span className="text-[#a8a29e] w-16 flex-shrink-0">聯絡人：</span>
              <span className="text-[#fafaf9] font-medium">{trip.contact_name || '-'}</span>
            </div>
            
            {/* 航班編號 */}
            {trip.flight_number && (
              <div className="flex">
                <span className="text-[#a8a29e] w-16 flex-shrink-0">航班：</span>
                <span className="text-[#fafaf9] font-medium">{trip.flight_number}</span>
              </div>
            )}
            
            {/* 人數/行李 */}
            <div className="flex">
              <span className="text-[#a8a29e] w-16 flex-shrink-0">人數：</span>
              <span className="text-[#fafaf9]">{trip.passenger_count}人 / {trip.luggage_count}件</span>
            </div>

            {/* 日期時間 */}
            <div className="flex">
              <span className="text-[#a8a29e] w-16 flex-shrink-0">時間：</span>
              <span className="text-[#fafaf9]">{formatDate(trip.service_date)} {formatTime(trip.service_time)}</span>
            </div>

            {/* 上車地點 */}
            <div className="flex flex-col">
              <span className="text-[#a8a29e] text-[10px]">上車：</span>
              <span className="text-[#fafaf9] truncate">{trip.pickup_area || trip.pickup_address || '-'}</span>
            </div>

            {/* 下車地點 */}
            <div className="flex flex-col">
              <span className="text-[#a8a29e] text-[10px]">下车：</span>
              <span className="text-[#fafaf9] truncate">{trip.dropoff_area || trip.dropoff_address || '-'}</span>
            </div>

            {/* 聯絡電話 */}
            <div className="flex">
              <span className="text-[#a8a29e] w-16 flex-shrink-0">電話：</span>
              <span className="text-[#fafaf9]">{trip.contact_phone || '-'}</span>
            </div>

            {/* 金額 */}
            <div className="flex pt-1 border-t border-[#292524]">
              <span className="text-[#a8a29e] w-16 flex-shrink-0">金額：</span>
              <span className="text-[#d4af37] font-bold text-sm">${trip.amount}</span>
            </div>
          </div>
        </div>

        {/* 中間右側：執行狀態 */}
        <div className="w-24 flex-shrink-0 bg-[#1c1917]/50 rounded-lg p-2 flex flex-col items-center justify-center">
          <div className={`text-xs font-medium px-2 py-1 rounded text-center ${getExecutionStatusClass(trip.status)}`}>
            {getExecutionStatus(trip.status)}
          </div>
          
          {/* 司機資訊（如果已接單） */}
          {trip.driver && (
            <div className="mt-2 text-center">
              <div className="text-[10px] text-[#a8a29e]">司機</div>
              <div className="text-xs text-[#fafaf9] font-medium">{trip.driver.name}</div>
              <div className="text-[10px] text-[#78716c]">{trip.driver.car_color}</div>
            </div>
          )}
        </div>
      </div>

      {/* === 下方區域：功能按鈕 === */}
      <div className="flex gap-2">
        {/* 編輯按鈕 + 選單 */}
        <div className="relative flex-1">
          <button
            onClick={() => { setShowEditMenu(!showEditMenu); setShowPriceMenu(false); setShowChatMenu(false); }}
            className="w-full py-2 text-xs border border-[#292524] rounded-lg hover:bg-[#292524] transition-colors text-[#a8a29e]"
          >
            編輯
          </button>
          
          {/* 編輯選單 */}
          {showEditMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-[#1c1917] border border-[#292524] rounded-lg shadow-lg overflow-hidden z-20">
              <button
                onClick={() => handleEditOption('edit')}
                className="w-full px-3 py-2 text-xs text-[#fafaf9] hover:bg-[#292524] text-left"
              >
                修改
              </button>
              <button
                onClick={() => handleEditOption('cancel')}
                className="w-full px-3 py-2 text-xs text-red-400 hover:bg-[#292524] text-left"
              >
                撤單
              </button>
            </div>
          )}
        </div>

        {/* 加價按鈕 + 選單 */}
        <div className="relative flex-1">
          <button
            onClick={() => { setShowPriceMenu(!showPriceMenu); setShowEditMenu(false); setShowChatMenu(false); }}
            className="w-full py-2 text-xs border border-[#292524] rounded-lg hover:bg-[#292524] transition-colors text-[#a8a29e]"
          >
            加價
          </button>
          
          {/* 加價選單 */}
          {showPriceMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-[#1c1917] border border-[#292524] rounded-lg shadow-lg overflow-hidden z-20">
              {[100, 200, 300, 400].map(amount => (
                <button
                  key={amount}
                  onClick={() => handlePriceBoost(amount)}
                  className="w-full px-3 py-2 text-xs text-[#fafaf9] hover:bg-[#292524] text-left"
                >
                  +${amount}
                </button>
              ))}
              <div className="px-3 py-2 border-t border-[#292524]">
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="自訂"
                    className="flex-1 px-2 py-1 text-xs bg-[#0c0a09] border border-[#292524] rounded text-[#fafaf9] placeholder-[#78716c]"
                  />
                  <button
                    onClick={handleCustomPrice}
                    className="px-2 py-1 text-xs bg-[#d4af37] text-[#0c0a09] rounded font-medium"
                  >
                    確定
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 聊天室按鈕 + 選單 */}
        <div className="relative flex-1">
          <button
            onClick={() => { setShowChatMenu(!showChatMenu); setShowEditMenu(false); setShowPriceMenu(false); }}
            className="w-full py-2 text-xs border border-[#d4af37] rounded-lg hover:bg-[#d4af37] hover:text-[#0c0a09] transition-colors text-[#d4af37]"
          >
            聊天室
          </button>
          
          {/* 聊天室選單 */}
          {showChatMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-[#1c1917] border border-[#292524] rounded-lg shadow-lg overflow-hidden z-20">
              {trip.driver && (
                <Link
                  href={`/chat/${trip.id}?mode=driver`}
                  className="block w-full px-3 py-2 text-xs text-[#fafaf9] hover:bg-[#292524] text-left"
                >
                  司機對話
                </Link>
              )}
              <Link
                href={`/chat/${trip.id}?mode=customer`}
                className="block w-full px-3 py-2 text-xs text-[#fafaf9] hover:bg-[#292524] text-left"
              >
                客人對話
              </Link>
              <Link
                href={`/chat/${trip.id}?mode=group`}
                className="block w-full px-3 py-2 text-xs text-[#d4af37] hover:bg-[#292524] text-left"
              >
                三方聊天室
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
