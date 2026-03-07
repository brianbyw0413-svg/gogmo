// 管理員審核頁面
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Driver {
  id: string;
  driver_number: string;
  line_name: string;
  line_picture_url: string;
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
  good_conduct_url: string;
  no_accident_url: string;
  bank_name: string;
  bank_code: string;
  bank_account: string;
  status: string;
  created_at: string;
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'suspended' | 'all'>('pending');

  useEffect(() => {
    fetchDrivers();
  }, [filter]);

  const fetchDrivers = async () => {
    setLoading(true);
    let query = supabase.from('drivers').select('*');
    
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) {
      setDrivers(data);
    }
    setLoading(false);
  };

  const handleAction = async () => {
    if (!selectedDriver || !action) return;

    let updates: any = {};
    
    if (action === 'approve') {
      updates = { status: 'approved', verified_at: new Date().toISOString(), rejection_reason: null };
    } else if (action === 'reject') {
      updates = { status: 'rejected', rejection_reason: reason };
    } else if (action === 'suspend') {
      updates = { status: 'suspended' };
    }

    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', selectedDriver.id);

    if (!error) {
      alert(action === 'approve' ? '已核准該司機' : action === 'reject' ? '已駁回該司機' : '已停用該司機');
      setSelectedDriver(null);
      setAction(null);
      setReason('');
      fetchDrivers();
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!confirm('確定要刪除此司機資料嗎？此操作無法復原。')) return;
    
    const { error } = await supabase.from('drivers').delete().eq('id', driverId);
    if (!error) {
      alert('已刪除');
      fetchDrivers();
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
      suspended: 'bg-orange-500/20 text-orange-400',
    };
    const labels: any = {
      pending: '待審核',
      approved: '已核准',
      rejected: '已駁回',
      suspended: '已停用',
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
          <div className="flex gap-2 flex-wrap">
            {(['pending', 'approved', 'rejected', 'suspended', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filter === f
                    ? 'bg-[#d4af37] text-[#0c0a09]'
                    : 'bg-[#292524] text-[#a8a29e] hover:text-[#fafaf9]'
                }`}
              >
                {f === 'pending' ? '待審' : f === 'approved' ? '已核准' : f === 'rejected' ? '已駁回' : f === 'suspended' ? '已停用' : '總名冊'}
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
                      {driver.driver_number && (
                        <span className="text-xs text-[#d4af37]">{driver.driver_number}</span>
                      )}
                      {getStatusBadge(driver.status)}
                    </div>
                    <div className="text-sm text-[#a8a29e]">
                      {driver.phone} · {driver.license_plate} · {driver.car_model}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDriver(driver)}
                    className="px-4 py-2 bg-[#d4af37] text-[#0c0a09] rounded-lg text-sm font-medium hover:bg-[#e8c44a]"
                  >
                    檢視詳情
                  </button>
                  <button
                    onClick={() => handleDelete(driver.id)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30"
                  >
                    刪除
                  </button>
                </div>
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
                      <span className="text-[#78716c]">司機編號：</span>
                      <span className="text-[#d4af37] font-bold">{selectedDriver.driver_number || '尚未編號'}</span>
                    </div>
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

                {/* 銀行資料 */}
                <div>
                  <h3 className="text-sm font-medium text-[#a8a29e] mb-3">銀行資料</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-[#78716c]">銀行：</span>
                      <span className="text-[#fafaf9]">{selectedDriver.bank_name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[#78716c]">代碼：</span>
                      <span className="text-[#fafaf9]">{selectedDriver.bank_code || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[#78716c]">帳號：</span>
                      <span className="text-[#fafaf9]">{selectedDriver.bank_account || '-'}</span>
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

                    {/* 良民證 */}
                    <div className="flex items-center justify-between p-3 bg-[#292524] rounded-lg">
                      <div>
                        <p className="text-[#fafaf9]">良民證 <span className="text-xs text-[#78716c]">（選傳）</span></p>
                      </div>
                      {selectedDriver.good_conduct_url ? (
                        <a
                          href={selectedDriver.good_conduct_url}
                          target="_blank"
                          className="text-[#d4af37] text-sm hover:underline"
                        >
                          查看
                        </a>
                      ) : (
                        <span className="text-xs text-[#78716c]">未上傳</span>
                      )}
                    </div>

                    {/* 無肇事紀錄 */}
                    <div className="flex items-center justify-between p-3 bg-[#292524] rounded-lg">
                      <div>
                        <p className="text-[#fafaf9]">無肇事紀錄 <span className="text-xs text-[#78716c]">（選傳）</span></p>
                      </div>
                      {selectedDriver.no_accident_url ? (
                        <a
                          href={selectedDriver.no_accident_url}
                          target="_blank"
                          className="text-[#d4af37] text-sm hover:underline"
                        >
                          查看
                        </a>
                      ) : (
                        <span className="text-xs text-[#78716c]">未上傳</span>
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
                        <div>
                          <label className="block text-sm text-[#a8a29e] mb-2">駁回原因</label>
                          <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="input-dark w-full"
                          >
                            <option value="">請選擇駁回原因</option>
                            <option value="證件不符">證件不符</option>
                            <option value="證件過期">證件過期</option>
                            <option value="資料填寫錯誤">資料填寫錯誤</option>
                            <option value="其他">其他</option>
                          </select>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={handleAction}
                          disabled={action === 'reject' && !reason}
                          className={`flex-1 py-3 rounded-lg font-medium ${
                            action === 'approve'
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          } disabled:opacity-50`}
                        >
                          確認{action === 'approve' ? '核准' : '駁回'}
                        </button>
                        <button
                          onClick={() => { setAction(null); setReason(''); }}
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
                      <button
                        onClick={() => setAction('suspend')}
                        className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                      >
                        停用
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
