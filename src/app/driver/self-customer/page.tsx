// 自客登記 — 司機端
'use client';

import { useState } from 'react';
import { useDriver } from '@/lib/driverContext';
import { ServiceType, TripMatch } from '@/types';

export default function SelfCustomerPage() {
  const { addSelfCustomerTrip, getMatchesForTrip } = useDriver();

  const [serviceType, setServiceType] = useState<ServiceType>('dropoff');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [serviceTime, setServiceTime] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [luggageCount, setLuggageCount] = useState(0);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [relatedMatches, setRelatedMatches] = useState<TripMatch[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupAddress || !dropoffAddress || !serviceDate || !serviceTime) {
      setError('請填寫上車地址、下車地址、日期和時間');
      return;
    }

    const newTrip = addSelfCustomerTrip({
      service_type: serviceType,
      pickup_address: pickupAddress,
      dropoff_address: dropoffAddress,
      pickup_area: pickupAddress,
      dropoff_area: dropoffAddress,
      service_date: serviceDate,
      service_time: serviceTime + ':00',
      flight_number: flightNumber || undefined,
      passenger_count: passengerCount,
      luggage_count: luggageCount,
      amount,
      driver_fee: amount,
      note: note || undefined,
    });

    // 取得配對結果
    const matches = getMatchesForTrip(newTrip);
    setRelatedMatches(matches);
    setSubmitted(true);
    setError('');
  };

  const resetForm = () => {
    setServiceType('dropoff');
    setPickupAddress('');
    setDropoffAddress('');
    setServiceDate('');
    setServiceTime('');
    setFlightNumber('');
    setPassengerCount(1);
    setLuggageCount(0);
    setAmount(0);
    setNote('');
    setSubmitted(false);
    setRelatedMatches([]);
  };

  if (submitted) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-[#fafaf9] mb-6">自客登記</h1>

        {/* 成功訊息 */}
        <div className="glass-card p-6 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#22c55e]/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#fafaf9] mb-2">登記成功！</h2>
          <p className="text-[#a8a29e]">自客行程已加入您的行程列表</p>
        </div>

        {/* 順路/成套配對推薦 */}
        {relatedMatches.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#fafaf9] mb-3 flex items-center gap-2">
              <span className="text-[#d4af37]">✨</span> 發現配對行程！
            </h2>
            <div className="space-y-3">
              {relatedMatches.map((match) => (
                <div key={match.trip.id} className="glass-card match-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>
                      {match.matchType === 'route' ? '⚡' : '🔗'}
                    </span>
                    <span className="text-sm text-[#d4af37] font-medium">{match.reason}</span>
                    <span className="ml-auto text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-full">
                      {match.matchScore}分
                    </span>
                  </div>
                  <div className="text-sm text-[#fafaf9]">
                    {match.trip.pickup_area} → {match.trip.dropoff_area}
                  </div>
                  <div className="text-xs text-[#a8a29e] mt-1">
                    {match.trip.service_date} {match.trip.service_time?.slice(0, 5)} · ${match.trip.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={resetForm}
          className="btn-gold w-full py-3"
        >
          繼續登記
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-[#fafaf9] mb-6">自客登記</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {/* 服務類型 */}
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">服務類型</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setServiceType('dropoff')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                serviceType === 'dropoff'
                  ? 'bg-[#d4af37] text-[#0c0a09]'
                  : 'border border-[#292524] text-[#a8a29e] hover:border-[#d4af37]'
              }`}
            >
              ✈️ 送機
            </button>
            <button
              type="button"
              onClick={() => setServiceType('pickup')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                serviceType === 'pickup'
                  ? 'bg-[#d4af37] text-[#0c0a09]'
                  : 'border border-[#292524] text-[#a8a29e] hover:border-[#d4af37]'
              }`}
            >
              🛬 接機
            </button>
          </div>
        </div>

        {/* 上車地址 */}
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">上車地址</label>
          <input
            type="text"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            className="input-dark w-full"
            placeholder="輸入上車地址..."
          />
        </div>

        {/* 下車地址 */}
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">下車地址</label>
          <input
            type="text"
            value={dropoffAddress}
            onChange={(e) => setDropoffAddress(e.target.value)}
            className="input-dark w-full"
            placeholder="輸入下車地址..."
          />
        </div>

        {/* 日期 + 時間 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-[#a8a29e] mb-2">日期</label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="input-dark w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-[#a8a29e] mb-2">時間</label>
            <input
              type="time"
              value={serviceTime}
              onChange={(e) => setServiceTime(e.target.value)}
              className="input-dark w-full"
            />
          </div>
        </div>

        {/* 航班編號 */}
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">航班編號（選填）</label>
          <input
            type="text"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            className="input-dark w-full"
            placeholder="例：BR872"
          />
        </div>

        {/* 人數 + 行李 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-[#a8a29e] mb-2">人數</label>
            <input
              type="number"
              value={passengerCount}
              onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
              className="input-dark w-full"
              min={1}
              max={10}
            />
          </div>
          <div>
            <label className="block text-sm text-[#a8a29e] mb-2">行李件數</label>
            <input
              type="number"
              value={luggageCount}
              onChange={(e) => setLuggageCount(parseInt(e.target.value) || 0)}
              className="input-dark w-full"
              min={0}
              max={20}
            />
          </div>
        </div>

        {/* 金額 */}
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">金額</label>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="input-dark w-full"
            placeholder="輸入金額"
            min={0}
          />
        </div>

        {/* 備註 */}
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">備註</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input-dark w-full resize-none"
            rows={3}
            placeholder="其他注意事項..."
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button type="submit" className="btn-gold w-full py-3">
          提交登記
        </button>
      </form>
    </div>
  );
}
