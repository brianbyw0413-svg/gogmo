// 管理員登入頁面
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 簡單的客戶端驗證（實際應該由 server-side 驗證）
    if (username === 'admin' && password === 'gmo2026admin') {
      localStorage.setItem('gmo_admin', 'true');
      router.push('/admin/drivers');
    } else {
      setError('帳號或密碼錯誤');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0a09]">
      <div className="w-full max-w-md p-8 glass-card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#b8962f] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-[#0c0a09]">A</span>
          </div>
          <h1 className="text-2xl font-bold text-[#fafaf9]">管理員登入</h1>
          <p className="text-[#a8a29e] mt-2">GMO 司機管理系統</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-[#a8a29e] mb-2">帳號</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-dark w-full"
              placeholder="請輸入帳號"
            />
          </div>
          <div>
            <label className="block text-sm text-[#a8a29e] mb-2">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark w-full"
              placeholder="請輸入密碼"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-[#a8a29e] hover:text-[#d4af37]">
            ← 返回首頁
          </a>
        </div>
      </div>
    </div>
  );
}
