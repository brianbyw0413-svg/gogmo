// 司機個人資料頁面
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface DriverData {
  id: string;
  driver_number: string;
  line_name: string;
  name: string;
  phone: string;
  license_plate: string;
  car_model: string;
  seats: number;
  car_color: string;
  driver_license_expiry: string;
  vehicle_reg_expiry: string;
  insurance_expiry: string;
  bank_name: string;
  bank_code: string;
  bank_account: string;
  good_conduct_url: string;
  no_accident_url: string;
  status: string;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriverData = async () => {
      const lineUser = localStorage.getItem('gmo_line_user');
      if (!lineUser) {
        router.push('/driver');
        return;
      }

      const profile = JSON.parse(lineUser);
      
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('line_id', profile.userId)
        .single();

      if (error || !data) {
        alert('找不到您的資料');
        router.push('/driver');
        return;
      }

      setDriver(data);
      setLoading(false);
    };

    fetchDriverData();
  }, [router]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09]">
        <div className="text-[#a8a29e]">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 標題 */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-[#a8a29e] hover:text-[#fafaf9]">
            ← 返回
          </button>
          <h1 className="text-xl font-bold text-[#fafaf9]">個人資料設定</h1>
        </div>

        {/* 警語 */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-400 text-sm">
            ⚠️ 此頁面為資料顯示用途，無法修改。若有修改需求，請聯繫客服。
          </p>
        </div>

        {driver && (
          <div className="space-y-6">
            {/* 基本資料 */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[#fafaf9] mb-4">基本資料</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#78716c]">司機編號：</span>
                  <span className="text-[#d4af37] font-bold">{driver.driver_number}</span>
                </div>
                <div>
                  <span className="text-[#78716c]">LINE 名稱：</span>
                  <span className="text-[#fafaf9]">{driver.line_name}</span>
                </div>
                <div>
                  <span className="text-[#78716c]">姓名：</span>
                  <span className="text-[#fafaf9]">{driver.name}</span>
                </div>
                <div>
                  <span className="text-[#78716c]">電話：</span>
                  <span className="text-[#fafaf9]">{driver.phone}</span>
                </div>
              </div>
            </div>

            {/* 車輛資料 */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[#fafaf9] mb-4">車輛資料</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#78716c]">車號：</span>
                  <span className="text-[#fafaf9]">{driver.license_plate}</span>
                </div>
                <div>
                  <span className="text-[#78716c]">車型：</span>
                  <span className="text-[#fafaf9]">{driver.car_model}</span>
                </div>
                <div>
                  <span className="text-[#78716c]">座位數：</span>
                  <span className="text-[#fafaf9]">{driver.seats} 人座</span>
                </div>
                <div>
                  <span className="text-[#78716c]">車色：</span>
                  <span className="text-[#fafaf9]">{driver.car_color || '-'}</span>
                </div>
              </div>
            </div>

            {/* 證件日期 */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[#fafaf9] mb-4">證件效期</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-[#78716c]">職業駕照：</span>
                  <span className="text-[#fafaf9]">{formatDate(driver.driver_license_expiry)}</span>
                </div>
                <div>
                  <span className="text-[#78716c]">行照：</span>
                  <span className="text-[#fafaf9]">{formatDate(driver.vehicle_reg_expiry)}</span>
                </div>
                <div>
                  <span className="text-[#78716c]">保險證：</span>
                  <span className="text-[#fafaf9]">{formatDate(driver.insurance_expiry)}</span>
                </div>
              </div>
            </div>

            {/* 銀行資料 */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[#fafaf9] mb-4">銀行資料</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-[#78716c]">銀行：</span>
                  <span className="text-[#fafaf9]">{driver.bank_name || '-'}</span>
                </div>
                <div>
                  <span className="text-[#78716c]">代碼：</span>
                  <span className="text-[#fafaf9]">{driver.bank_code || '-'}</span>
                </div>
                <div>
                  <span className="text-[#78716c]">帳號：</span>
                  <span className="text-[#fafaf9]">{driver.bank_account || '-'}</span>
                </div>
              </div>
            </div>

            {/* 選傳證件 */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[#fafaf9] mb-4">選傳證件</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#78716c]">良民證：</span>
                  {driver.good_conduct_url ? (
                    <a href={driver.good_conduct_url} target="_blank" className="text-[#d4af37] hover:underline">查看</a>
                  ) : (
                    <span className="text-[#78716c]">未上傳</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#78716c]">無肇事紀錄：</span>
                  {driver.no_accident_url ? (
                    <a href={driver.no_accident_url} target="_blank" className="text-[#d4af37] hover:underline">查看</a>
                  ) : (
                    <span className="text-[#78716c]">未上傳</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0c0a09]"><div className="text-[#a8a29e]">載入中...</div></div></Suspense>}>
      <ProfileContent />
    </Suspense>
  );
}
