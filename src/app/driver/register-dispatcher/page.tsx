// 調度員註冊頁面
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function RegisterDispatcherContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lineLogin = searchParams.get('line_login') === 'true';
  
  const [lineUser, setLineUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // 表單資料
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    idNumber: '',
    ein: '',
    phone: '',
    bankName: '',
    bankCode: '',
    bankAccount: '',
  });

  useEffect(() => {
    if (lineLogin) {
      const user = localStorage.getItem('gmo_line_user');
      if (user) {
        setLineUser(JSON.parse(user));
      } else {
        router.push('/driver');
      }
    }
    setLoading(false);
  }, [lineLogin, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const dispatcherId = crypto.randomUUID();
      const dispatcherNumber = 'DP' + Math.floor(1000 + Math.random() * 9000);

      // 檢查是否已有相同 line_id 的資料，若有則先刪除（允許重新註冊）
      if (lineUser?.userId) {
        await supabase.from('dispatchers').delete().eq('line_id', lineUser.userId);
      }

      // 儲存調度員資料
      const { error: insertError } = await supabase.from('dispatchers').insert({
        id: dispatcherId,
        dispatcher_number: dispatcherNumber,
        line_id: lineUser?.userId,
        line_name: lineUser?.displayName,
        line_picture_url: lineUser?.pictureUrl,
        name: formData.name,
        company: formData.company || null,
        id_number: formData.idNumber || null,
        ein: formData.ein || null,
        phone: formData.phone,
        bank_name: formData.bankName,
        bank_code: formData.bankCode,
        bank_account: formData.bankAccount,
        status: 'pending',
      });

      if (insertError) throw insertError;

      localStorage.removeItem('gmo_line_user');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '提交失敗，請稍後重試');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09]">
        <div className="text-[#a8a29e]">載入中...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09]">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-xl font-bold text-[#fafaf9] mb-2">提交成功！</h1>
          <p className="text-[#a8a29e] mb-4">
            您的資料已提交審核，管理員確認後會發送通知。
          </p>
          <p className="text-sm text-[#d4af37] mb-4">
            預計審核時間：1-2 個工作天
          </p>
          <button onClick={() => router.push('/driver')} className="btn-gold">
            返回登入頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 標題 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#fafaf9]">調度員註冊</h1>
          <p className="text-[#a8a29e] mt-2">請填寫完整資料以提交審核</p>
        </div>

        {lineUser && (
          <div className="glass-card p-4 mb-6 flex items-center gap-4">
            <img src={lineUser.pictureUrl} alt="LINE" className="w-12 h-12 rounded-full" />
            <div>
              <p className="text-[#fafaf9] font-medium">LINE ID: {lineUser.displayName}</p>
              <p className="text-xs text-[#a8a29e]">已自動帶入</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資料 */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-[#fafaf9] mb-4">基本資料</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">姓名/車行名稱 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-dark w-full"
                  placeholder="請輸入姓名或車行名稱"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#a8a29e] mb-2">個人身份證字號</label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    className="input-dark w-full"
                    placeholder="A123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#a8a29e] mb-2">車行統編</label>
                  <input
                    type="text"
                    name="ein"
                    value={formData.ein}
                    onChange={handleInputChange}
                    className="input-dark w-full"
                    placeholder="12345678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">聯絡電話 *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="input-dark w-full"
                  placeholder="0912345678"
                />
              </div>
            </div>
          </div>

          {/* 銀行資料 */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-[#fafaf9] mb-4">銀行資料</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">銀行名稱 *</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  required
                  className="input-dark w-full"
                  placeholder="例如：玉山銀行"
                />
              </div>
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">銀行代碼 *</label>
                <input
                  type="text"
                  name="bankCode"
                  value={formData.bankCode}
                  onChange={handleInputChange}
                  required
                  className="input-dark w-full"
                  placeholder="例如：808"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">銀行帳號 *</label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  required
                  className="input-dark w-full"
                  placeholder="帳號"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-gold w-full py-4 text-lg disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交審核'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-[#a8a29e]">加入 LINE 好友以完成註冊</p>
          <a href="https://lin.ee/te3BuUwK" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline block font-bold">
            點擊加入 @627exwrq
          </a>
          <p className="text-xs text-[#78716c]">或 LINE ID：@627exwrq</p>
          <a href="/driver" className="text-sm text-[#a8a29e] hover:text-[#d4af37]">
            ← 返回登入頁
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RegisterDispatcherPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0c0a09]"><div className="text-[#a8a29e]">載入中...</div></div>}>
      <RegisterDispatcherContent />
    </Suspense>
  );
}
