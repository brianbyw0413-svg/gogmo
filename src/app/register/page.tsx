// 會員註冊頁面 - 手機號碼帳號版
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabaseAdmin = createClient(
  'https://vtvytcrkoqbluvczyepm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dnl0Y3Jrb3FibHV2Y3p5ZXBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5MzUwMywiZXhwIjoyMDg3NDY5NTAzfQ.w7wq0Ha9F3ucYQvl-xQ-0FHss0TjX7V52eR1NsjG3zE'
);

function hashPassword(password: string): string {
  return 'hashed_' + btoa(password);
}

// 格式化電話號碼
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: 基本資料, 2: 證件上傳
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'driver' as 'driver' | 'dispatcher'
  });
  const [driverDocs, setDriverDocs] = useState({
    driver_license_url: '',
    driver_license_expiry: '',
    vehicle_reg_url: '',
    vehicle_reg_expiry: '',
    insurance_url: '',
    insurance_expiry: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 驗證
    if (formData.password !== formData.confirmPassword) {
      setError('密碼與確認密碼不一致');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('密碼至少需要 6 個字');
      setLoading(false);
      return;
    }

    if (formData.role === 'driver' && step === 1) {
      setStep(2);
      setLoading(false);
      return;
    }

    try {
      // 檢查手機是否已存在
      const { data: existing } = await supabaseAdmin
        .from('gmo_members')
        .select('id')
        .eq('phone', formData.phone)
        .single();

      if (existing) {
        setError('此手機號碼已被註冊');
        setLoading(false);
        return;
      }

      // 建立會員
      const memberData: any = {
        username: formData.phone, // 帳號 = 手機號碼
        password_hash: hashPassword(formData.password),
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        status: formData.role === 'driver' ? 'pending' : 'active' // 司機需要審核
      };

      // 司機額外欄位
      if (formData.role === 'driver') {
        memberData.driver_license_url = driverDocs.driver_license_url || null;
        memberData.driver_license_expiry = driverDocs.driver_license_expiry || null;
        memberData.vehicle_reg_url = driverDocs.vehicle_reg_url || null;
        memberData.vehicle_reg_expiry = driverDocs.vehicle_reg_expiry || null;
        memberData.insurance_url = driverDocs.insurance_url || null;
        memberData.insurance_expiry = driverDocs.insurance_expiry || null;
      }

      const { error: insertError } = await supabaseAdmin
        .from('gmo_members')
        .insert(memberData);

      if (insertError) throw insertError;

      alert(formData.role === 'driver' 
        ? '註冊成功！請等待管理員審核通過後，即可開始接單。' 
        : '註冊成功！請重新登入。');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || '註冊失敗，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0c0a09', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '32rem', margin: '0 auto', backgroundColor: '#1a1918', border: '1px solid #292524', borderRadius: '0.75rem', padding: '2rem' }}>
        
        {/* 標題 */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fafaf9', marginBottom: '0.5rem' }}>
            {step === 1 ? '會員註冊' : '上傳證件'}
          </h1>
          <p style={{ color: '#a8a29e', fontSize: '0.875rem' }}>
            {formData.role === 'driver' ? '司機' : '車頭/調度員'}註冊 - GMO 機場接送平台
          </p>
        </div>

        {/* 步驟指示 */}
        {formData.role === 'driver' && (
          <div style={{ display: 'flex', marginBottom: '1.5rem', gap: '0.5rem' }}>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: step >= 1 ? '#d4af37' : '#292524' }} />
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: step >= 2 ? '#d4af37' : '#292524' }} />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* ====== 步驟 1: 基本資料 ====== */}
          {step === 1 && (
            <>
              {/* 手機號碼（帳號） */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>
                  手機號碼（帳號）*
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
                  placeholder="09xx-xxx-xxx"
                  maxLength={12}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0c0a09', border: '1px solid #292524', borderRadius: '0.5rem', color: '#fafaf9', outline: 'none' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '0.25rem' }}>此號碼將作為您的登入帳號</p>
              </div>

              {/* 密碼 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>密碼 *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="至少6個字"
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0c0a09', border: '1px solid #292524', borderRadius: '0.5rem', color: '#fafaf9', outline: 'none' }}
                />
              </div>

              {/* 確認密碼 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>確認密碼 *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  placeholder="再次輸入密碼"
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0c0a09', border: '1px solid #292524', borderRadius: '0.5rem', color: '#fafaf9', outline: 'none' }}
                />
              </div>

              {/* 姓名 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>姓名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="請輸入姓名"
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0c0a09', border: '1px solid #292524', borderRadius: '0.5rem', color: '#fafaf9', outline: 'none' }}
                />
              </div>

              {/* 身份 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>身份 *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as 'driver' | 'dispatcher' }))}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0c0a09', border: '1px solid #292524', borderRadius: '0.5rem', color: '#fafaf9', outline: 'none' }}
                >
                  <option value="driver">我是司機</option>
                  <option value="dispatcher">我是車頭/調度員</option>
                </select>
              </div>
            </>
          )}

          {/* ====== 步驟 2: 證件上傳（司機專屬）====== */}
          {step === 2 && formData.role === 'driver' && (
            <>
              <div style={{ backgroundColor: '#0c0a09', padding: '1rem', borderRadius: '0.5rem' }}>
                <p style={{ color: '#d4af37', fontSize: '0.875rem', marginBottom: '1rem' }}>請上傳以下證件並填寫有效期</p>
                
                {/* 駕照 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>1. 駕照 *</label>
                  <input
                    type="text"
                    placeholder="請輸入駕照到期日"
                    value={driverDocs.driver_license_expiry}
                    onChange={(e) => setDriverDocs(d => ({ ...d, driver_license_expiry: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem', backgroundColor: '#1a1918', border: '1px solid #292524', borderRadius: '0.5rem', color: '#fafaf9', marginBottom: '0.5rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#78716c' }}>（圖片上傳功能開發中，請先填寫到期日）</p>
                </div>

                {/* 行照 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>2. 行照 *</label>
                  <input
                    type="text"
                    placeholder="請輸入行照到期日"
                    value={driverDocs.vehicle_reg_expiry}
                    onChange={(e) => setDriverDocs(d => ({ ...d, vehicle_reg_expiry: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem', backgroundColor: '#1a1918', border: '1px solid #292524', borderRadius: '0.5rem', color: '#fafaf9', marginBottom: '0.5rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#78716c' }}>（圖片上傳功能開發中，請先填寫到期日）</p>
                </div>

                {/* 保險 */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#a8a29e', marginBottom: '0.5rem' }}>3. 保險證 *</label>
                  <input
                    type="text"
                    placeholder="請輸入保險到期日"
                    value={driverDocs.insurance_expiry}
                    onChange={(e) => setDriverDocs(d => ({ ...d, insurance_expiry: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem', backgroundColor: '#1a1918', border: '1px solid #292524', borderRadius: '0.5rem', color: '#fafaf9', marginBottom: '0.5rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#78716c' }}>（圖片上傳功能開發中，請先填寫到期日）</p>
                </div>
              </div>

              {/* 返回按鈕 */}
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#292524', color: '#a8a29e', border: 'none', cursor: 'pointer' }}
              >
                ← 返回上一步
              </button>
            </>
          )}

          {/* 錯誤 */}
          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

          {/* 提交 */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', backgroundColor: loading ? '#44403c' : '#d4af37', color: loading ? '#78716c' : '#0c0a09', cursor: loading ? 'not-allowed' : 'pointer', border: 'none', marginTop: '0.5rem' }}
          >
            {loading ? '處理中...' : step === 1 && formData.role === 'driver' ? '下一步：上傳證件' : '確認註冊'}
          </button>
        </form>

        {/* 登入 */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/login" style={{ fontSize: '0.875rem', color: '#a8a29e' }}>已經有帳號？登入</Link>
        </div>
      </div>
    </div>
  );
}
