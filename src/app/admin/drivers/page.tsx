// 司機審核管理頁面 - 使用 gmo_members
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://vtvytcrkoqbluvczyepm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dnl0Y3Jrb3FibHV2Y3p5ZXBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5MzUwMywiZXhwIjoyMDg3NDY5NTAzfQ.w7wq0Ha9F3ucYQvl-xQ-0FHss0TjX7V52eR1NsjG3zE'
);

interface Member {
  id: string;
  username: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  driver_license_url: string;
  driver_license_expiry: string;
  vehicle_reg_url: string;
  vehicle_reg_expiry: string;
  insurance_url: string;
  insurance_expiry: string;
  created_at: string;
}

export default function AdminDriversPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [action, setAction] = useState<string>('');
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState<string>('pending');
  const [showModal, setShowModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const admin = localStorage.getItem('gmo_admin');
    if (!admin) {
      window.location.href = '/login';
      return;
    }
    setIsAdmin(true);
    setInitLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin || initLoading) return;
    fetchMembers();
  }, [filter, isAdmin, initLoading]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      let query = supabaseAdmin.from('gmo_members').select('*').eq('role', 'driver');
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) setMembers(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAction = async () => {
    if (!selectedMember || !action) return;
    let updates: any = {};
    if (action === 'approve') {
      updates = { status: 'active', verified_at: new Date().toISOString() };
    } else if (action === 'reject') {
      updates = { status: 'rejected', rejection_reason: reason };
    } else if (action === 'suspend') {
      updates = { status: 'suspended' };
    }

    const { error } = await supabaseAdmin.from('gmo_members').update(updates).eq('id', selectedMember.id);
    if (error) {
      alert('操作失敗: ' + error.message);
    } else {
      alert(action === 'approve' ? '已核准該司機' : action === 'reject' ? '已駁回該司機' : '已停用該司機');
      setShowModal(false);
      setSelectedMember(null);
      setAction('');
      setReason('');
      fetchMembers();
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = { pending: 'bg-yellow-500', active: 'bg-green-500', rejected: 'bg-red-500', suspended: 'bg-gray-500' };
    const labels: any = { pending: '待審核', active: '已核准', rejected: '已駁回', suspended: '已停用' };
    return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', color: 'white', backgroundColor: colors[status] || '#6b7280' }}>{labels[status] || status}</span>;
  };

  const openDetail = (member: Member) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  if (initLoading) return <div style={{ minHeight: '100vh', backgroundColor: '#0c0a09', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37' }}>載入中...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0c0a09', color: '#fafaf9' }}>
      {/* 導航列 */}
      <nav style={{ backgroundColor: '#1a1918', borderBottom: '1px solid #292524', padding: '1rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#d4af37' }}>GMO 管理後台</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="/admin/drivers" style={{ color: '#d4af37', fontWeight: 'bold' }}>司機審核</a>
            <a href="/admin/dispatchers" style={{ color: '#a8a29e' }}>調度員審核</a>
            <a href="/" style={{ color: '#a8a29e' }}>回首頁</a>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1.5rem' }}>
        {/* 篩選 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['pending', 'active', 'rejected', 'suspended', 'all'].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '500', backgroundColor: filter === tab ? '#d4af37' : '#292524', color: filter === tab ? '#0c0a09' : '#a8a29e', border: 'none', cursor: 'pointer' }}>
              {tab === 'pending' ? '待審核' : tab === 'active' ? '已核准' : tab === 'rejected' ? '已駁回' : tab === 'suspended' ? '已停用' : '全部'}
            </button>
          ))}
        </div>

        {/* 列表 */}
        {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#a8a29e' }}>載入中...</div> : members.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem', color: '#a8a29e' }}>目前沒有司機資料</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {members.map(member => (
              <div key={member.id} onClick={() => openDetail(member)} style={{ backgroundColor: '#1a1918', border: '1px solid #292524', borderRadius: '0.5rem', padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{member.name}</span>
                      {getStatusBadge(member.status)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#a8a29e' }}>電話: {member.phone}</div>
                    <div style={{ fontSize: '0.75rem', color: '#78716c' }}>註冊時間: {new Date(member.created_at).toLocaleString('zh-TW')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {member.status === 'pending' && <button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setAction('approve'); setShowModal(true); }} style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', backgroundColor: '#22c55e', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>核准</button>}
                    <button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setAction('reject'); setShowModal(true); }} style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>駁回</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 詳細 Modal */}
      {showModal && selectedMember && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
          <div style={{ backgroundColor: '#1a1918', border: '1px solid #292524', borderRadius: '0.5rem', padding: '1.5rem', maxWidth: '32rem', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#d4af37', marginBottom: '1rem' }}>司機資料審核</h3>
            
            <div style={{ backgroundColor: '#0c0a09', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ color: '#a8a29e', fontSize: '0.75rem' }}>姓名</p>
              <p style={{ fontWeight: 'bold' }}>{selectedMember.name}</p>
              <p style={{ color: '#a8a29e', fontSize: '0.75rem', marginTop: '0.5rem' }}>電話</p>
              <p>{selectedMember.phone}</p>
            </div>

            {/* 證件資訊 */}
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#d4af37', fontWeight: 'bold', marginBottom: '0.5rem' }}>證件有效期</p>
              
              <div style={{ backgroundColor: '#0c0a09', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                <p style={{ color: '#a8a29e', fontSize: '0.75rem' }}>1. 駕照到期日</p>
                <p style={{ color: selectedMember.driver_license_expiry ? '#22c55e' : '#ef4444' }}>{selectedMember.driver_license_expiry || '未填寫'}</p>
              </div>

              <div style={{ backgroundColor: '#0c0a09', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
                <p style={{ color: '#a8a29e', fontSize: '0.75rem' }}>2. 行照到期日</p>
                <p style={{ color: selectedMember.vehicle_reg_expiry ? '#22c55e' : '#ef4444' }}>{selectedMember.vehicle_reg_expiry || '未填寫'}</p>
              </div>

              <div style={{ backgroundColor: '#0c0a09', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <p style={{ color: '#a8a29e', fontSize: '0.75rem' }}>3. 保險到期日</p>
                <p style={{ color: selectedMember.insurance_expiry ? '#22c55e' : '#ef4444' }}>{selectedMember.insurance_expiry || '未填寫'}</p>
              </div>
            </div>

            {/* 圖片顯示區（預留） */}
            {selectedMember.driver_license_url && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#d4af37', fontWeight: 'bold', marginBottom: '0.5rem' }}>證件圖片</p>
                <img src={selectedMember.driver_license_url} alt="駕照" style={{ maxWidth: '100%', borderRadius: '0.5rem' }} />
              </div>
            )}

            {action === 'reject' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>駁回原因</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0c0a09', border: '1px solid #292524', borderRadius: '0.5rem', color: '#fafaf9' }} placeholder="請輸入駁回原因..." />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setSelectedMember(null); setAction(''); setReason(''); }} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#292524', color: '#a8a29e', border: 'none', cursor: 'pointer' }}>取消</button>
              <button onClick={handleAction} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: action === 'approve' ? '#22c55e' : action === 'reject' ? '#ef4444' : '#6b7280', color: 'white', border: 'none', cursor: 'pointer' }}>確認</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
