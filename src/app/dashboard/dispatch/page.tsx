// 快速派單頁面

'use client';

import { useState } from 'react';
import DispatchForm from '@/components/DispatchForm';

export default function DispatchPage() {
  const [activeTab, setActiveTab] = useState<'customer_pay' | 'driver_kickback'>('customer_pay');

  return (
    <div className="max-w-4xl mx-auto">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#fafaf9] mb-2">快速派單</h1>
        <p className="text-[#a8a29e]">建立新行程並派發給司機</p>
      </div>

      {/* TAB 切換 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('customer_pay')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            activeTab === 'customer_pay' 
              ? 'bg-[#d4af37] text-[#0c0a09] font-medium' 
              : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524] hover:border-[#d4af37]'
          }`}
        >
          客下匯款
        </button>
        <button
          onClick={() => setActiveTab('driver_kickback')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            activeTab === 'driver_kickback' 
              ? 'bg-[#d4af37] text-[#0c0a09] font-medium' 
              : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524] hover:border-[#d4af37]'
          }`}
        >
          司機回金
        </button>
      </div>

      {/* 派單表單 */}
      <div className="glass-card p-6">
        <DispatchForm />
      </div>

      {/* 提示說明 */}
      <div className="mt-6 p-4 glass-card border-l-4 border-l-[#d4af37]">
        <h3 className="text-sm font-medium text-[#fafaf9] mb-2">派單說明</h3>
        <ul className="text-xs text-[#a8a29e] space-y-1">
          <li>• 客下匯款：車頭向客人收費後派單，司機完成服務後車頭結帳</li>
          <li>• 司機回金：司機先向客人收費，事後回金給車頭</li>
          <li>• 派單後可至行控中心查看即時狀態</li>
        </ul>
      </div>
    </div>
  );
}
