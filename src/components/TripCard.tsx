// TripCard 元件 - 行程卡片
// 根據不同狀態顯示不同顏色和內容

'use client';

import { Trip, TripStatus } from '@/types';

interface TripCardProps {
  trip: Trip;
  onAssignDriver?: (tripId: string) => void;
  onCancel?: (tripId: string) => void;
  onComplete?: (tripId: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'public';
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

// 取得狀態 CSS 類別
function getStatusClass(status: TripStatus): string {
  const classMap: Record<TripStatus, string> = {
    'open': 'status-open',
    'accepted': 'status-accepted',
    'arrived': 'status-arrived',
    'picked_up': 'status-picked_up',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled'
  };
  return classMap[status];
}

// 取得服務類型顯示
function getServiceTypeText(type: string): string {
  return type === 'dropoff' ? '送機' : '接機';
}

// 取得付款模式顯示
function getPaymentModeText(mode: string): string {
  return mode === 'customer_pay' ? '客下匯款' : '司機回金';
}

export default function TripCard({ 
  trip, 
  onAssignDriver, 
  onCancel,
  onComplete,
  showActions = true,
  variant = 'default'
}: TripCardProps) {
  const isCompact = variant === 'compact';
  const isPublic = variant === 'public';

  // 格式化時間
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  // 格式化日期
  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`
      glass-card p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
      ${isCompact ? 'p-3' : ''}
      ${isPublic ? 'cursor-pointer hover:border-[#d4af37]' : ''}
    `}>
      {/* 卡片-header：狀態標籤 + 服務類型 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(trip.status)}`}>
            {getStatusText(trip.status)}
          </span>
          <span className="text-xs text-[#a8a29e]">
            {getServiceTypeText(trip.service_type)}
          </span>
        </div>
        {!isPublic && (
          <span className={`text-xs px-2 py-1 rounded ${trip.payment_mode === 'customer_pay' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-blue-500/20 text-blue-400'}`}>
            {getPaymentModeText(trip.payment_mode)}
          </span>
        )}
      </div>

      {/* 路線資訊 */}
      <div className="space-y-2 mb-3">
        {/* 上車地點 */}
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isCompact ? 'text-xs' : ''}`}>
              {trip.pickup_area || trip.pickup_address}
            </p>
            {!isCompact && !isPublic && trip.pickup_address && (
              <p className="text-xs text-[#a8a29e] truncate">{trip.pickup_address}</p>
            )}
          </div>
        </div>
        
        {/* 下車地點 */}
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isCompact ? 'text-xs' : ''}`}>
              {trip.dropoff_area || trip.dropoff_address}
            </p>
            {!isCompact && !isPublic && trip.dropoff_address && (
              <p className="text-xs text-[#a8a29e] truncate">{trip.dropoff_address}</p>
            )}
          </div>
        </div>
      </div>

      {/* 詳細資訊（非精簡模式） */}
      {!isCompact && !isPublic && (
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div>
            <span className="text-[#a8a29e]">日期/時間：</span>
            <span className="text-[#fafaf9]">{formatDate(trip.service_date)} {formatTime(trip.service_time)}</span>
          </div>
          {trip.flight_number && (
            <div>
              <span className="text-[#a8a29e]">航班：</span>
              <span className="text-[#fafaf9]">{trip.flight_number}</span>
            </div>
          )}
          <div>
            <span className="text-[#a8a29e]">人數/行李：</span>
            <span className="text-[#fafaf9]">{trip.passenger_count}人 / {trip.luggage_count}件</span>
          </div>
          <div>
            <span className="text-[#a8a29e]">金額：</span>
            <span className="text-[#d4af37] font-semibold">${trip.amount}</span>
          </div>
        </div>
      )}

      {/* 司機資訊（已接單時顯示） */}
      {trip.driver && !isPublic && (
        <div className="mb-3 p-2 rounded-lg bg-[#1c1917] border border-[#292524]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                <span className="text-sm font-medium text-[#d4af37]">
                  {trip.driver.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{trip.driver.name}</p>
                <p className="text-xs text-[#a8a29e]">{trip.driver.car_color} {trip.driver.car_plate}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 備註 */}
      {trip.note && !isPublic && (
        <div className="mb-3 text-xs text-[#a8a29e] italic">
          備註：{trip.note}
        </div>
      )}

      {/* 動作按鈕 */}
      {showActions && !isPublic && trip.status !== 'completed' && trip.status !== 'cancelled' && (
        <div className="flex gap-2">
          {trip.status === 'open' && onAssignDriver && (
            <button
              onClick={() => onAssignDriver(trip.id)}
              className="flex-1 btn-gold text-sm py-1.5"
            >
              派單
            </button>
          )}
          {trip.status === 'open' && onCancel && (
            <button
              onClick={() => onCancel(trip.id)}
              className="px-3 py-1.5 text-sm border border-[#292524] rounded-lg hover:bg-[#292524] transition-colors"
            >
              撤單
            </button>
          )}
          {trip.status === 'accepted' && onComplete && (
            <button
              onClick={() => onComplete(trip.id)}
              className="flex-1 btn-gold text-sm py-1.5"
            >
              完成
            </button>
          )}
        </div>
      )}

      {/* 公開版簡化顯示 */}
      {isPublic && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#292524]">
          <div className="text-xs text-[#a8a29e]">
            {formatDate(trip.service_date)} {formatTime(trip.service_time)}
          </div>
          <div className="text-sm font-semibold text-[#d4af37]">
            ${trip.amount}
          </div>
        </div>
      )}
    </div>
  );
}
