// 會員登入頁面
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// 建立 Supabase 客戶端
const supabaseAdmin = createClient(
  'https://vtvytcrkoqbluvczyepm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dnl0Y3Jrb3FibHV2Y3p5ZXBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5MzUwMywiZXhwIjoyMDg3NDY5NTAzfQ.w7wq0Ha9F3ucYQvl-xQ-0FHss0TjX7V52eR1NsjG3zE'
);

// 簡單的密碼雜湊比對（模擬）
function verifyPassword(password: string, hash: string): boolean {
  return 'hashed_' + btoa(password) === hash;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('請輸入帳號和密碼');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 查詢會員
      const { data: member, error: fetchError } = await supabaseAdmin
        .from('gmo_members')
        .select('*')
        .eq('username', username)
        .single();

      if (fetchError || !member) {
        setError('帳號或密碼錯誤');
        setLoading(false);
        return;
      }

      // 檢查密碼
      if (!verifyPassword(password, member.password_hash)) {
        setError('帳號或密碼錯誤');
        setLoading(false);
        return;
      }

      // 檢查狀態
      if (member.status !== 'active') {
        setError('帳號已被停用，請聯絡管理員');
        setLoading(false);
        return;
      }

      // 登入成功，儲存會員資料
      localStorage.setItem('gmo_member', JSON.stringify({
        id: member.id,
        username: member.username,
        name: member.name,
        role: member.role,
        line_id: member.line_id
      }));

      // 根據身份跳轉
      if (member.role === 'admin') {
        router.push('/admin');
      } else if (member.role === 'dispatcher') {
        router.push('/dashboard');
      } else {
        router.push('/driver');
      }

    } catch (err: any) {
      setError('登入失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0c0a09',
      padding: '1rem'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '28rem',
        padding: '2rem',
        backgroundColor: '#1a1918',
        border: '1px solid #292524',
        borderRadius: '0.75rem'
      }}>
        {/* 標題 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '4rem', 
            height: '4rem', 
            borderRadius: '0.75rem',
            background: 'linear-gradient(to bottom right, #d4af37, #b8962f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0c0a09' }}>G</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fafaf9', marginBottom: '0.5rem' }}>
            會員登入
          </h1>
          <p style={{ color: '#a8a29e', fontSize: '0.875rem' }}>GMO 機場接送平台</p>
        </div>

        {/* 表單 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 帳號 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>
              帳號
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#0c0a09',
                border: '1px solid #292524',
                borderRadius: '0.5rem',
                color: '#fafaf9',
                outline: 'none'
              }}
              placeholder="請輸入帳號"
            />
          </div>

          {/* 密碼 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#0c0a09',
                border: '1px solid #292524',
                borderRadius: '0.5rem',
                color: '#fafaf9',
                outline: 'none'
              }}
              placeholder="請輸入密碼"
            />
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>
          )}

          {/* 登入按鈕 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              backgroundColor: loading ? '#44403c' : '#d4af37',
              color: loading ? '#78716c' : '#0c0a09',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none'
            }}
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        {/* 註冊連結 */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/register" style={{ fontSize: '0.875rem', color: '#a8a29e' }}>
            還沒有帳號？註冊
          </Link>
        </div>
      </div>
    </div>
  );
}
