// 管理員審核頁面
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Driver {
  id: string;
  line_name: string;
  name: string;
  phone: string;
  license_plate: string;
  car_model: string;
  seats: number;
  car_color: string;
  driver_license_url: string;
  driver_license_expiry: string;
  vehicle_reg_url: string;
  vehicle_reg_expiry: string;
  insurance_url: string;
  insurance_expiry: string;
  status: string;
  created_at: string;
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchDrivers();
  }, [filter]);

  const fetchDrivers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setDrivers(data);
    }
    setLoading(false);
  };

  const handleAction = async () => {
    if (!selectedDriver || !action) return;

    const updates: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      verified_at: action === 'approve' ? new Date().toISOString() : null,
      rejection_reason: action === 'reject' ? reason : null,
    };

    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', selectedDriver.id);

    if (!error) {
      alert(action === 'approve' ? '已核准該司機' : '已駁回該司機');
      setSelectedDriver(null);
      setAction(null);
      setReason('');
      fetchDrivers();
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
    };
    const labels: any = {
      pending: '待審核',
      approved: '已核准',
      rejected: '已駁回',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>{labels[status]}</span>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  const isExpired = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] p-6">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#fafaf9]">司機審核管理</h1>
            <p className="text-[#a8a29e] mt-1">審核司機認證資料</p>
          </div>
          <div className="flex gap-2">
            {(['pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filter === f
                    ? 'bg-[#d4af37] text-[#0c0a09]'
                    : 'bg-[#292524] text-[#a8a29e] hover:text-[#fafaf9]'
                }`}
              >
                {f === 'pending' ? '待審' : f === 'approved' ? '已核准' : '已駁回'}
              </button>
            ))}
          </div>
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="text-center text-[#a8a29e] py-12">載入中...</div>
        ) : drivers.length === 0 ? (
          <div className="glass-card p-12 text-center text-[#a8a29e]">
            沒有待審核的司機
          </div>
        ) : (
          <div className="grid gap-4">
            {drivers.map((driver) => (
              <div key={driver.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#292524] flex items-center justify-center text-[#d4af37] font-bold">
                    {driver.name?.[0] || '司'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#fafaf9]">{driver.name}</span>
                      {getStatusBadge(driver.status)}
                    </div>
                    <div className="text-sm text-[#a8a29e]">
                      {driver.phone} · {driver.license_plate} · {driver.car_model}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDriver(driver)}
                  className="px-4 py-2 bg-[#d4af37] text-[#0c0a09] rounded-lg text-sm font-medium hover:bg-[#e8c44a]"
                >
                  檢視詳情
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 詳情 Modal */}
        {selectedDriver && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1c1a18] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#292524]">
                <h2 className="text-xl font-bold text-[#fafaf9]">司機資料詳情</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* 基本資料 */}
                <div>
                  <h3 className="text-sm font-medium text-[#a8a29e] mb-3">基本資料</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#78716c]">LINE 名稱：</span>
                      <span className="text-[#fafaf9]">{selectedDriver.line_name}</span>
                    </div>
                    <div>
                      <span className="text-[#78716c]">姓名：</span>
                      <span className="text-[#fafaf9]">{selectedDriver.name}</span>
                    </div>
                    <div>
                      <span className="text-[#78716c]">電話：</span>
                      <span className="text-[#fafaf9]">{selectedDriver.phone}</span>
                    </div>
                  </div>
                </div>

                {/* 車輛資料 */}
                <div>
                  <h3 className="text-sm font-medium text-[#a8a29e] mb-3">車輛資料</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#78716c]">車號：</span>
                      <span className="text-[#fafaf9]">{selectedDriver.license_plate}</span>
                    </div>
                    <div>
                      <span className="text-[#78716c]">車型：</span>
                      <span className="text-[#fafaf9]">{selectedDriver.car_model}</span>
                    </div>
                    <div>
                      <span className="text-[#78716c]">座位數：</span>
                      <span className="text-[#fafaf9]">{selectedDriver.seats} 人座</span>
                    </div>
                    <div>
                      <span className="text-[#78716c]">車色：</span>
                      <span className="text-[#fafaf9]">{selectedDriver.car_color || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 證件 */}
                <div>
                  <h3 className="text-sm font-medium text-[#a8a29e] mb-3">證件資料</h3>
                  <div className="space-y-4">
                    {/* 職業駕照 */}
                    <div className="flex items-center justify-between p-3 bg-[#292524] rounded-lg">
                      <div>
                        <p className="text-[#fafaf9]">職業駕照</p>
                        <p className="text-xs text-[#78716c]">
                          到期日：{formatDate(selectedDriver.driver_license_expiry)}
                          {isExpired(selectedDriver.driver_license_expiry) && (
                            <span className="text-red-400 ml-2">已過期</span>
                          )}
                        </p>
                      </div>
                      {selectedDriver.driver_license_url && (
                        <a
                          href={selectedDriver.driver_license_url}
                          target="_blank"
                          className="text-[#d4af37] text-sm hover:underline"
                        >
                          查看
                        </a>
                      )}
                    </div>

                    {/* 行照 */}
                    <div className="flex items-center justify-between p-3 bg-[#292524] rounded-lg">
                      <div>
                        <p className="text-[#fafaf9]">行照</p>
                        <p className="text-xs text-[#78716c]">
                          到期日：{formatDate(selectedDriver.vehicle_reg_expiry)}
                          {isExpired(selectedDriver.vehicle_reg_expiry) && (
                            <span className="text-red-400 ml-2">已過期</span>
                          )}
                        </p>
                      </div>
                      {selectedDriver.vehicle_reg_url && (
                        <a
                          href={selectedDriver.vehicle_reg_url}
                          target="_blank"
                          className="text-[#d4af37] text-sm hover:underline"
                        >
                          查看
                        </a>
                      )}
                    </div>

                    {/* 保險證 */}
                    <div className="flex items-center justify-between p-3 bg-[#292524] rounded-lg">
                      <div>
                        <p className="text-[#fafaf9]">保險證</p>
                        <p className="text-xs text-[#78716c]">
                          到期日：{formatDate(selectedDriver.insurance_expiry)}
                          {isExpired(selectedDriver.insurance_expiry) && (
                            <span className="text-red-400 ml-2">已過期</span>
                          )}
                        </p>
                      </div>
                      {selectedDriver.insurance_url && (
                        <a
                          href={selectedDriver.insurance_url}
                          target="_blank"
                          className="text-[#d4af37] text-sm hover:underline"
                        >
                          查看
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作區 */}
              {selectedDriver.status === 'pending' && (
                <div className="p-6 border-t border-[#292524]">
                  {action ? (
                    <div className="space-y-4">
                      {action === 'reject' && (
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="請輸入駁回原因..."
                          className="input-dark w-full h-24"
                        />
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={handleAction}
                          className={`flex-1 py-3 rounded-lg font-medium ${
                            action === 'approve'
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          確認{action === 'approve' ? '核准' : '駁回'}
                        </button>
                        <button
                          onClick={() => setAction(null)}
                          className="flex-1 py-3 bg-[#292524] text-[#a8a29e] rounded-lg"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setAction('approve')}
                        className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                      >
                        核准
                      </button>
                      <button
                        onClick={() => setAction('reject')}
                        className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                      >
                        駁回
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 border-t border-[#292524]">
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="w-full py-3 text-[#a8a29e] hover:text-[#fafaf9]"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
