// DispatchForm 元件 - 派單表單

'use client';

import { useState, useEffect } from 'react';
import { ServiceType, PaymentMode, Driver, DispatchFormData } from '@/types';
import { createTrip, getDrivers } from '@/lib/data';

interface DispatchFormProps {
  onSuccess?: () => void;
}

export default function DispatchForm({ onSuccess }: DispatchFormProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 表單資料
  const [formData, setFormData] = useState<DispatchFormData>({
    service_type: 'dropoff',
    payment_mode: 'customer_pay',
    pickup_address: '',
    dropoff_address: '',
    service_date: '',
    service_time: '',
    flight_number: '',
    passenger_count: 1,
    luggage_count: 0,
    amount: 0,
    driver_fee: 0,
    note: ''
  });

  // 載入司機列表
  useEffect(() => {
    getDrivers().then(setDrivers);
  }, []);

  // 計算司機回金（預設為金額的 80%）
  useEffect(() => {
    const suggestedFee = Math.round(formData.amount * 0.8);
    setFormData(prev => ({ ...prev, driver_fee: suggestedFee }));
  }, [formData.amount]);

  // 處理輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // 解析地區（取第一個區域作為簡略顯示）
      const pickupArea = formData.pickup_address.split('市')[0]?.split('縣')[0] || formData.pickup_address;
      const dropoffArea = formData.dropoff_address.split('市')[0]?.split('縣')[0] || formData.dropoff_address;

      const tripData = {
        ...formData,
        pickup_area: pickupArea,
        dropoff_area: dropoffArea,
        driver_id: selectedDriver || undefined
      };

      const result = await createTrip(tripData);

      if (result) {
        setMessage({ type: 'success', text: '派單成功！' });
        // 重置表單
        setFormData({
          service_type: 'dropoff',
          payment_mode: 'customer_pay',
          pickup_address: '',
          dropoff_address: '',
          service_date: '',
          service_time: '',
          flight_number: '',
          passenger_count: 1,
          luggage_count: 0,
          amount: 0,
          driver_fee: Math.round((formData.amount * 0.8) || 0),
          note: ''
        });
        setSelectedDriver('');
        onSuccess?.();
      } else {
        setMessage({ type: 'error', text: '派單失敗，請稍後再試' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '發生錯誤，請稍後再試' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 服務類型與付款模式 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">服務類型</label>
          <select
            name="service_type"
            value={formData.service_type}
            onChange={handleChange}
            className="input-dark w-full"
          >
            <option value="dropoff">送機</option>
            <option value="pickup">接機</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">付款模式</label>
          <select
            name="payment_mode"
            value={formData.payment_mode}
            onChange={handleChange}
            className="input-dark w-full"
          >
            <option value="customer_pay">客下匯款</option>
            <option value="driver_kickback">司機回金</option>
          </select>
        </div>
      </div>

      {/* 地址 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">上車地址</label>
          <input
            type="text"
            name="pickup_address"
            value={formData.pickup_address}
            onChange={handleChange}
            className="input-dark w-full"
            placeholder="例如：台北市中山區南京東路三段"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">下车地址</label>
          <input
            type="text"
            name="dropoff_address"
            value={formData.dropoff_address}
            onChange={handleChange}
            className="input-dark w-full"
            placeholder="例如：桃園國際機場第一航廈"
            required
          />
        </div>
      </div>

      {/* 日期時間 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">服務日期</label>
          <input
            type="date"
            name="service_date"
            value={formData.service_date}
            onChange={handleChange}
            className="input-dark w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">服務時間</label>
          <input
            type="time"
            name="service_time"
            value={formData.service_time}
            onChange={handleChange}
            className="input-dark w-full"
            required
          />
        </div>
      </div>

      {/* 航班與人數 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">航班編號</label>
          <input
            type="text"
            name="flight_number"
            value={formData.flight_number}
            onChange={handleChange}
            className="input-dark w-full"
            placeholder="例如：BR872"
          />
        </div>
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">乘客人數</label>
          <input
            type="number"
            name="passenger_count"
            value={formData.passenger_count}
            onChange={handleChange}
            className="input-dark w-full"
            min={1}
            max={10}
          />
        </div>
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">行李件數</label>
          <input
            type="number"
            name="luggage_count"
            value={formData.luggage_count}
            onChange={handleChange}
            className="input-dark w-full"
            min={0}
            max={10}
          />
        </div>
      </div>

      {/* 金額 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">車頭報價 (元)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="input-dark w-full"
            placeholder="0"
            min={0}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-[#a8a29e] mb-2">司機回金 (元)</label>
          <input
            type="number"
            name="driver_fee"
            value={formData.driver_fee}
            onChange={handleChange}
            className="input-dark w-full"
            placeholder="0"
            min={0}
          />
        </div>
      </div>

      {/* 司機選擇 */}
      <div>
        <label className="block text-sm text-[#a8a29e] mb-2">指定司機（可選）</label>
        <select
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
          className="input-dark w-full"
        >
          <option value="">自動派單</option>
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id}>
              {driver.name} - {driver.car_color} {driver.car_plate}
            </option>
          ))}
        </select>
      </div>

      {/* 備註 */}
      <div>
        <label className="block text-sm text-[#a8a29e] mb-2">備註</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          className="input-dark w-full h-20 resize-none"
          placeholder="特殊需求或注意事項..."
        />
      </div>

      {/* 訊息顯示 */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* 提交按鈕 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-gold w-full py-3 text-lg disabled:opacity-50"
      >
        {isSubmitting ? '派單中...' : '確認派單'}
      </button>
    </form>
  );
}
