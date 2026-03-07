// 調度員審核管理頁面
'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Dispatcher {
  id: string;
  dispatcher_number: string;
  line_id: string;
  line_name: string;
  line_picture_url: string;
  name: string;
  phone: string;
  company: string;
  id_number: string;
  ein: string;
  bank_name: string;
  bank_code: string;
  bank_account: string;
  status: string;
  verified_at: string;
  created_at: string;
}

export default function AdminDispatchersPage() {
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispatcher, setSelectedDispatcher] = useState<Dispatcher | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'suspended' | 'all'>('pending');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchDispatchers();
  }, [filter]);

  const checkAdmin = () => {
    const admin = localStorage.getItem('gmo_admin');
    if (!admin) {
      router.push('/admin/login');
      return;
    }
    setIsAdmin(true);
  };

  const fetchDispatchers = async () => {
    setLoading(true);
    let query = supabaseAdmin.from('dispatchers').select('*');
    
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) {
      setDispatchers(data);
    }
    setLoading(false);
  };

  const handleAction = async () => {
    if (!selectedDispatcher || !action) return;

    let updates: any = {};
    let newStatus = '';
    
    if (action === 'approve') {
      // 自動產生調度員編號
      const dispatcherNumber = 'D' + Date.now().toString().slice(-6);
      updates = { 
        status: 'approved', 
        verified_at: new Date().toISOString(), 
        rejection_reason: null,
        dispatcher_number: dispatcherNumber
      };
      newStatus = 'approved';
    } else if (action === 'reject') {
      updates = { status: 'rejected', rejection_reason: reason };
      newStatus = 'rejected';
    } else if (action === 'suspend') {
      updates = { status: 'suspended' };
      newStatus = 'suspended';
    }

    const { error } = await supabaseAdmin
      .from('dispatchers')
      .update(updates)
      .eq('id', selectedDispatcher.id);

    if (!error) {
      alert(action === 'approve' ? '已核准該調度員' : action === 'reject' ? '已駁回該調度員' : '已停用該調度員');
      setSelectedDispatcher(null);
      setAction(null);
      setReason('');
      setFilter(newStatus as 'pending' | 'approved' | 'rejected' | 'suspended' | 'all');
      fetchDispatchers();
    }
  };

  const handleDelete = async (dispatcherId: string) => {
    if (!confirm('確定要刪除此調度員資料嗎？此操作無法復原。')) return;
    
    const { error } = await supabaseAdmin.from('dispatchers').delete().eq('id', dispatcherId);
    if (error) {
      alert('刪除失敗: ' + error.message);
    } else {
      alert('刪除成功');
      fetchDispatchers();
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      suspended: 'bg-gray-500'
    };
    const labels: any = {
      pending: '待審核',
      approved: '已核准',
      rejected: '已駁回',
      suspended: '已停用'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs text-white ${colors[status] || 'bg-gray-500'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#fafaf9]">
      {/* 導航列 */}
      <nav className="bg-[#1a1918] border-b border-[#292524] p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#d4af37]">GMO 管理後台</h1>
          <div className="flex gap-4">
            <Link href="/admin/drivers" className="text-[#a8a29e] hover:text-[#d4af37]">司機審核</Link>
            <Link href="/admin/dispatchers" className="text-[#d4af37] font-bold">調度員審核</Link>
            <Link href="/" className="text-[#a8a29e] hover:text-[#d4af37]">回首頁</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* 篩選標籤 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'pending', label: '待審核', count: dispatchers.filter(d => d.status === 'pending').length },
            { key: 'approved', label: '已核准', count: dispatchers.filter(d => d.status === 'approved').length },
            { key: 'rejected', label: '已駁回', count: dispatchers.filter(d => d.status === 'rejected').length },
            { key: 'suspended', label: '已停用', count: dispatchers.filter(d => d.status === 'suspended').length },
            { key: 'all', label: '全部', count: dispatchers.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.key 
                  ? 'bg-[#d4af37] text-[#0c0a09]' 
                  : 'bg-[#292524] text-[#a8a29e] hover:bg-[#44403c]'
              }`}
            >
              {tab.label} ({tab.count || dispatchers.length})
            </button>
          ))}
        </div>

        {/* 資料列表 */}
        {loading ? (
          <div className="text-center py-12 text-[#a8a29e]">載入中...</div>
        ) : dispatchers.length === 0 ? (
          <div className="text-center py-12 text-[#a8a29e]">目前沒有調度員資料</div>
        ) : (
          <div className="grid gap-4">
            {dispatchers.map((dispatcher) => (
              <div 
                key={dispatcher.id}
                className="bg-[#1a1918] border border-[#292524] rounded-lg p-4 flex items-center justify-between hover:border-[#d4af37] transition-colors"
              >
                <div className="flex items-center gap-4">
                  {dispatcher.line_picture_url ? (
                    <img 
                      src={dispatcher.line_picture_url} 
                      alt={dispatcher.line_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#292524] flex items-center justify-center text-[#d4af37]">
                      {dispatcher.name?.[0] || '?'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{dispatcher.name}</span>
                      {getStatusBadge(dispatcher.status)}
                    </div>
                    <div className="text-sm text-[#a8a29e]">
                      LINE: {dispatcher.line_name} | 電話: {dispatcher.phone}
                    </div>
                    <div className="text-xs text-[#78716c]">
                      公司: {dispatcher.company || '-'} | 編號: {dispatcher.dispatcher_number || '-'}
                    </div>
                    <div className="text-xs text-[#78716c]">
                      申請時間: {new Date(dispatcher.created_at).toLocaleString('zh-TW')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedDispatcher(dispatcher); setAction('approve'); }}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                  >
                    核准
                  </button>
                  <button
                    onClick={() => { setSelectedDispatcher(dispatcher); setAction('reject'); }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                  >
                    駁回
                  </button>
                  <button
                    onClick={() => { setSelectedDispatcher(dispatcher); setAction('suspend'); }}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                  >
                    停用
                  </button>
                  <button
                    onClick={() => handleDelete(dispatcher.id)}
                    className="px-3 py-1 bg-red-900 hover:bg-red-800 rounded text-sm"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 審核對話框 */}
      {selectedDispatcher && action && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1918] border border-[#292524] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#d4af37] mb-4">
              {action === 'approve' ? '核准調度員' : action === 'reject' ? '駁回調度員' : '停用調度員'}
            </h3>
            
            <div className="mb-4">
              <p className="text-[#a8a29e] mb-2">調度員: {selectedDispatcher.name}</p>
              <p className="text-[#a8a29e] mb-2">電話: {selectedDispatcher.phone}</p>
              {selectedDispatcher.company && (
                <p className="text-[#a8a29e] mb-2">公司: {selectedDispatcher.company}</p>
              )}
            </div>

            {action === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm text-[#a8a29e] mb-2">駁回原因</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#0c0a09] border border-[#292524] rounded p-2 text-[#fafaf9]"
                  rows={3}
                  placeholder="請輸入駁回原因..."
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setSelectedDispatcher(null); setAction(null); setReason(''); }}
                className="px-4 py-2 bg-[#292524] hover:bg-[#44403c] rounded"
              >
                取消
              </button>
              <button
                onClick={handleAction}
                className={`px-4 py-2 rounded ${
                  action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : action === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
