// LINE 綁定頁面
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// 建立 Supabase 客戶端
const supabaseAdmin = createClient(
  'https://vtvytcrkoqbluvczyepm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dnl0Y3Jrb3FibHV2Y3p5ZXBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5MzUwMywiZXhwIjoyMDg3NDY5NTAzfQ.w7wq0Ha9F3ucYQvl-xQ-0FHss0TjX7V52eR1NsjG3zE'
);

export default function LineBindingPage() {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [binding, setBinding] = useState(false);
  const [message, setMessage] = useState('');
  const [lineBound, setLineBound] = useState(false);

  useEffect(() => {
    // 檢查登入狀態
    const stored = localStorage.getItem('gmo_member');
    if (!stored) {
      router.push('/login');
      return;
    }
    const memberData = JSON.parse(stored);
    setMember(memberData);
    setLineBound(!!memberData.line_id);
  }, [router]);

  const handleBindLine = async () => {
    setBinding(true);
    setMessage('正在處理 LINE 綁定...');

    try {
      // 這裡應該跳轉到 LINE OAuth 授權頁面
      // 為了示範，我們模擬綁定成功
      
      // 實際上應該做：
      // 1. 跳轉到 LINE OAuth
      // 2. 取得 LINE userId
      // 3. 更新資料庫

      // 模擬：直接更新為已綁定（測試用）
      const { error } = await supabaseAdmin
        .from('gmo_members')
        .update({
          line_id: 'demo_line_' + Date.now(),
          line_name: 'Demo User',
          line_bound_at: new Date().toISOString()
        })
        .eq('id', member.id);

      if (error) throw error;

      // 更新 localStorage
      const updatedMember = { ...member, line_id: 'demo_line_' + Date.now() };
      localStorage.setItem('gmo_member', JSON.stringify(updatedMember));
      setMember(updatedMember);
      setLineBound(true);
      setMessage('LINE 綁定成功！');

    } catch (err: any) {
      setMessage('綁定失敗：' + err.message);
    } finally {
      setBinding(false);
    }
  };

  if (!member) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0c0a09',
        color: '#a8a29e'
      }}>
        載入中...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0c0a09',
      padding: '2rem 1rem'
    }}>
      <div style={{ 
        maxWidth: '28rem',
        margin: '0 auto',
        backgroundColor: '#1a1918',
        border: '1px solid #292524',
        borderRadius: '0.75rem',
        padding: '2rem'
      }}>
        {/* 標題 */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ 
            width: '4rem', 
            height: '4rem', 
            borderRadius: '50%',
            backgroundColor: lineBound ? '#22c55e' : '#d4af37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2rem'
          }}>
            {lineBound ? '✓' : '📱'}
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fafaf9', marginBottom: '0.5rem' }}>
            LINE 綁定
          </h1>
          <p style={{ color: '#a8a29e', fontSize: '0.875rem' }}>
            綁定 LINE 以接收行程通知
          </p>
        </div>

        {/* 會員資訊 */}
        <div style={{ 
          backgroundColor: '#0c0a09', 
          borderRadius: '0.5rem', 
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ color: '#a8a29e', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            登入帳號
          </p>
          <p style={{ color: '#fafaf9', fontWeight: 'bold' }}>{member.name}</p>
          <p style={{ color: '#78716c', fontSize: '0.875rem' }}>{member.username}</p>
          <p style={{ color: '#d4af37', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            身份：{member.role === 'driver' ? '司機' : member.role === 'dispatcher' ? '車頭' : '管理員'}
          </p>
        </div>

        {/* 綁定狀態 */}
        {lineBound ? (
          <div style={{ 
            backgroundColor: '#22c55e20', 
            border: '1px solid #22c55e',
            borderRadius: '0.5rem', 
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#22c55e', fontWeight: 'bold' }}>✓ 已綁定 LINE</p>
            <p style={{ color: '#a8a29e', fontSize: '0.875rem' }}>
              您可以收到 LINE 通知了
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#a8a29e', fontSize: '0.875rem', marginBottom: '1rem' }}>
              綁定 LINE 之後，您可以收到：
            </p>
            <ul style={{ color: '#a8a29e', fontSize: '0.875rem', paddingLeft: '1rem' }}>
              <li>新派單通知</li>
              <li>司機接單通知</li>
              <li>行程提醒</li>
              <li>重要訊息推播</li>
            </ul>
          </div>
        )}

        {/* 訊息 */}
        {message && (
          <p style={{ 
            color: message.includes('成功') ? '#22c55e' : '#ef4444', 
            fontSize: '0.875rem',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            {message}
          </p>
        )}

        {/* 綁定按鈕 */}
        {lineBound ? (
          <button
            onClick={() => router.back()}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              backgroundColor: '#292524',
              color: '#fafaf9',
              cursor: 'pointer',
              border: '1px solid #44403c'
            }}
          >
            返回
          </button>
        ) : (
          <button
            onClick={handleBindLine}
            disabled={binding}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              backgroundColor: binding ? '#44403c' : '#d4af37',
              color: binding ? '#78716c' : '#0c0a09',
              cursor: binding ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
          >
            {binding ? '處理中...' : '綁定 LINE 帳號'}
          </button>
        )}
      </div>
    </div>
  );
}
