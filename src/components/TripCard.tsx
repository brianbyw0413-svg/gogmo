// TripCard 元件 - 行程卡片 (行控中心優化版 v2)
// 根據老闆新設計：金額上方、訂單編號、光暈框線

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
  tripNumber?: number; // 訂單編號數字
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
  showChat = false,
  tripNumber = 1
}: TripCardProps) {
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showPriceMenu, setShowPriceMenu] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [showChatMenu, setShowChatMenu] = useState(false);

  const isPickup = trip.service_type === 'pickup';
  const isUrgent = isUrgentTrip(trip);
  const isDefault = variant === 'default';
  const isOpen = trip.status === 'open';
  const isAccepted = trip.status === 'accepted';

  // 訂單編號
  const orderNumber = generateTripNumber(tripNumber);

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
    setShowEditMenu(false);
  };

  // 只有 default variant 使用新設計
  if (!isDefault) {
    return null;
  }

  // 根據狀態決定框線光暈
  const getBorderGlow = () => {
    if (isAccepted) return 'ring-2 ring-green-500/50 shadow-lg shadow-green-500/20';
    if (isOpen) return 'ring-2 ring-red-500/50 shadow-lg shadow-red-500/20';
    return '';
  };

  // 急單底色
  const getBgClass = () => {
    if (isUrgent) return 'bg-red-900/30';
    return '';
  };

  return (
    <div className={`glass-card p-4 transition-all duration-300 hover:shadow-lg relative h-[340px] flex flex-col overflow-hidden ${getBorderGlow()} ${getBgClass()}`}>
      {/* === 右上角：訂單編號 === */}
      <div className="absolute top-2 right-2 text-[10px] font-mono text-[#a8a29e] bg-[#0c0a09]/80 px-2 py-1 rounded">
        {orderNumber}
      </div>

      {/* === 上方區域：金額 + 標籤 === */}
      <div className="flex items-start justify-between mb-2">
        {/* 金額 */}
        <div className="flex flex-col">
          <span className="text-[10px] text-[#a8a29e]">金額</span>
          <span className="text-2xl font-bold text-[#d4af37]">
            ${trip.amount}
            {trip.price_boost && trip.price_boost > 0 && (
              <span className="text-sm text-red-400 ml-1">+{trip.price_boost}</span>
            )}
          </span>
        </div>

        {/* 標籤區 */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* 接機/送機標籤 */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            isPickup 
              ? 'bg-blue-500/30 text-blue-300' 
              : 'bg-orange-500/30 text-orange-300'
          }`}>
            {isPickup ? '接機' : '送機'}
          </span>

          {/* 狀態標籤 */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            isOpen ? 'bg-red-500/30 text-red-300' :
            isAccepted ? 'bg-green-500/30 text-green-300' :
            trip.status === 'arrived' ? 'bg-purple-500/30 text-purple-300' :
            trip.status === 'picked_up' ? 'bg-blue-500/30 text-blue-300' :
            'bg-gray-500/30 text-gray-300'
          }`}>
            {getStatusText(trip.status)}
          </span>

          {/* 急單標籤 */}
          {isUrgent && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/50 text-white animate-pulse">
              急單
            </span>
          )}
        </div>
      </div>

      {/* === 中間區域：資訊 === */}
      <div className="flex-1 overflow-hidden mb-2">
        <div className="space-y-1.5 text-xs h-full">
          {/* 聯絡人 + 電話 */}
          <div className="flex justify-between">
            <span className="text-[#a8a29e]">聯絡人：</span>
            <span className="text-[#fafaf9] font-medium">{trip.contact_name || '-'}</span>
          </div>
          
          {/* 航班編號 */}
          {trip.flight_number && (
            <div className="flex justify-between">
              <span className="text-[#a8a29e]">航班：</span>
              <span className="text-[#fafaf9] font-medium">{trip.flight_number}</span>
            </div>
          )}
          
          {/* 人數/行李 */}
          <div className="flex justify-between">
            <span className="text-[#a8a29e]">人數/行李：</span>
            <span className="text-[#fafaf9]">{trip.passenger_count}人 / {trip.luggage_count}件</span>
          </div>

          {/* 日期時間 */}
          <div className="flex justify-between">
            <span className="text-[#a8a29e]">時間：</span>
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

          {/* 電話 */}
          <div className="flex justify-between">
            <span className="text-[#a8a29e]">電話：</span>
            <span className="text-[#fafaf9]">{trip.contact_phone || '-'}</span>
          </div>
        </div>
      </div>

      {/* === 執行狀態 === */}
      <div className="mb-2">
        <div className={`text-[10px] px-2 py-1 rounded text-center ${
          isAccepted ? 'bg-green-500/20 text-green-400' :
          isOpen ? 'bg-gray-500/20 text-gray-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {getExecutionStatus(trip.status)}
        </div>
        {/* 司機資訊 */}
        {trip.driver && (
          <div className="mt-1 text-[10px] text-center text-[#a8a29e]">
            司機：{trip.driver.name} ({trip.driver.car_color} {trip.driver.car_plate})
          </div>
        )}
      </div>

      {/* === 下方區域：功能按鈕 === */}
      <div className="flex gap-2 mt-auto">
        {/* 編輯按鈕 + 選單 */}
        <div className="relative flex-1">
          <button
            onClick={() => { setShowEditMenu(!showEditMenu); setShowPriceMenu(false); setShowChatMenu(false); }}
            className="w-full py-1.5 text-[10px] border border-[#292524] rounded-lg hover:bg-[#292524] transition-colors text-[#a8a29e]"
          >
            編輯
          </button>
          
          {showEditMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-[#1c1917] border border-[#292524] rounded-lg shadow-lg overflow-hidden z-20">
              <button
                onClick={() => handleEditOption('edit')}
                className="w-full px-2 py-1.5 text-[10px] text-[#fafaf9] hover:bg-[#292524] text-left"
              >
                修改
              </button>
              <button
                onClick={() => handleEditOption('cancel')}
                className="w-full px-2 py-1.5 text-[10px] text-red-400 hover:bg-[#292524] text-left"
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
            className="w-full py-1.5 text-[10px] border border-[#292524] rounded-lg hover:bg-[#292524] transition-colors text-[#a8a29e]"
          >
            加價
          </button>
          
          {showPriceMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-[#1c1917] border border-[#292524] rounded-lg shadow-lg overflow-hidden z-20">
              {[100, 200, 300, 400].map(amount => (
                <button
                  key={amount}
                  onClick={() => handlePriceBoost(amount)}
                  className="w-full px-2 py-1.5 text-[10px] text-[#fafaf9] hover:bg-[#292524] text-left"
                >
                  +${amount}
                </button>
              ))}
              <div className="px-2 py-1.5 border-t border-[#292524]">
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="自訂"
                    className="flex-1 px-2 py-1 text-[10px] bg-[#0c0a09] border border-[#292524] rounded text-[#fafaf9] placeholder-[#78716c]"
                  />
                  <button
                    onClick={handleCustomPrice}
                    className="px-2 py-1 text-[10px] bg-[#d4af37] text-[#0c0a09] rounded font-medium"
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
            className="w-full py-1.5 text-[10px] border border-[#d4af37] rounded-lg hover:bg-[#d4af37] hover:text-[#0c0a09] transition-colors text-[#d4af37]"
          >
            聊天室
          </button>
          
          {showChatMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-[#1c1917] border border-[#292524] rounded-lg shadow-lg overflow-hidden z-20">
              {trip.driver && (
                <Link
                  href={`/chat/${trip.id}?mode=driver`}
                  className="block w-full px-2 py-1.5 text-[10px] text-[#fafaf9] hover:bg-[#292524] text-left"
                >
                  司機對話
                </Link>
              )}
              <Link
                href={`/chat/${trip.id}?mode=customer`}
                className="block w-full px-2 py-1.5 text-[10px] text-[#fafaf9] hover:bg-[#292524] text-left"
              >
                客人對話
              </Link>
              <Link
                href={`/chat/${trip.id}?mode=group`}
                className="block w-full px-2 py-1.5 text-[10px] text-[#d4af37] hover:bg-[#292524] text-left"
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
