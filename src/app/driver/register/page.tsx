// 司機註冊頁面
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function RegisterContent() {
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
    phone: '',
    licensePlate: '',
    carModel: '',
    seats: 5,
    carColor: '',
    driverLicenseExpiry: '',
    vehicleRegExpiry: '',
    insuranceExpiry: '',
    bankName: '',
    bankCode: '',
    bankAccount: '',
  });
  
  // 檔案
  const [files, setFiles] = useState({
    driverLicense: null as File | null,
    vehicleReg: null as File | null,
    insurance: null as File | null,
    goodConduct: null as File | null,    // 良民證
    noAccident: null as File | null,    // 無肇事紀錄
  });
  
  const [uploadProgress, setUploadProgress] = useState({
    driverLicense: false,
    vehicleReg: false,
    insurance: false,
    goodConduct: false,
    noAccident: false,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // 車號和車型自動轉大寫
    let newValue = value;
    if (name === 'licensePlate' || name === 'carModel') {
      newValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [field]: e.target.files![0] }));
    }
  };

  const uploadFile = async (file: File, driverId: string, type: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${driverId}/${type}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('driver-docs')
      .upload(fileName, file, { upsert: true });
    
    if (error) {
      console.error(`Upload ${type} error:`, error);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('driver-docs')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // 產生 driver ID
      const driverId = crypto.randomUUID();
      
      // 上傳證件
      const urls: any = {};
      
      if (files.driverLicense) {
        setUploadProgress(prev => ({ ...prev, driverLicense: true }));
        urls.driver_license_url = await uploadFile(files.driverLicense, driverId, 'driver_license');
        setUploadProgress(prev => ({ ...prev, driverLicense: false }));
      }
      
      if (files.vehicleReg) {
        setUploadProgress(prev => ({ ...prev, vehicleReg: true }));
        urls.vehicle_reg_url = await uploadFile(files.vehicleReg, driverId, 'vehicle_reg');
        setUploadProgress(prev => ({ ...prev, vehicleReg: false }));
      }
      
      if (files.insurance) {
        setUploadProgress(prev => ({ ...prev, insurance: true }));
        urls.insurance_url = await uploadFile(files.insurance, driverId, 'insurance');
        setUploadProgress(prev => ({ ...prev, insurance: false }));
      }

      // 選傳證件
      if (files.goodConduct) {
        setUploadProgress(prev => ({ ...prev, goodConduct: true }));
        urls.good_conduct_url = await uploadFile(files.goodConduct, driverId, 'good_conduct');
        setUploadProgress(prev => ({ ...prev, goodConduct: false }));
      }
      
      if (files.noAccident) {
        setUploadProgress(prev => ({ ...prev, noAccident: true }));
        urls.no_accident_url = await uploadFile(files.noAccident, driverId, 'no_accident');
        setUploadProgress(prev => ({ ...prev, noAccident: false }));
      }

      // 產生司機編號 FDXXXX
      const driverNumber = 'FD' + Math.floor(1000 + Math.random() * 9000);

      // 儲存司機資料
      const { error: insertError } = await supabase.from('drivers').insert({
        id: driverId,
        driver_number: driverNumber,
        line_id: lineUser?.userId,
        line_name: lineUser?.displayName,
        line_picture_url: lineUser?.pictureUrl,
        name: formData.name,
        phone: formData.phone,
        license_plate: formData.licensePlate,
        car_model: formData.carModel,
        seats: formData.seats,
        car_color: formData.carColor,
        driver_license_url: urls.driver_license_url,
        driver_license_expiry: formData.driverLicenseExpiry || null,
        vehicle_reg_url: urls.vehicle_reg_url,
        vehicle_reg_expiry: formData.vehicleRegExpiry || null,
        insurance_url: urls.insurance_url,
        insurance_expiry: formData.insuranceExpiry || null,
        good_conduct_url: urls.good_conduct_url || null,
        no_accident_url: urls.no_accident_url || null,
        bank_name: formData.bankName,
        bank_code: formData.bankCode,
        bank_account: formData.bankAccount,
        status: 'pending',
      });

      if (insertError) throw insertError;

      // 清除 LINE user data
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
            您的資料已提交審核，管理員確認後會發送認證通知。
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
          <h1 className="text-2xl font-bold text-[#fafaf9]">司機註冊</h1>
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
                <label className="block text-sm text-[#a8a29e] mb-2">姓名 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-dark w-full"
                  placeholder="請輸入姓名"
                />
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

          {/* 車輛資料 */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-[#fafaf9] mb-4">車輛資料</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">車號 *</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  required
                  className="input-dark w-full"
                  placeholder="ABC-1234"
                />
              </div>
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">車型（廠牌+車型）*</label>
                <input
                  type="text"
                  name="carModel"
                  value={formData.carModel}
                  onChange={handleInputChange}
                  required
                  className="input-dark w-full"
                  placeholder="Toyota Altis"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#a8a29e] mb-2">座位數 *</label>
                  <select
                    name="seats"
                    value={formData.seats}
                    onChange={handleInputChange}
                    className="input-dark w-full"
                  >
                    <option value={5}>5 人座</option>
                    <option value={6}>6 人座</option>
                    <option value={7}>7 人座</option>
                    <option value={9}>9 人座</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#a8a29e] mb-2">車色</label>
                  <input
                    type="text"
                    name="carColor"
                    value={formData.carColor}
                    onChange={handleInputChange}
                    className="input-dark w-full"
                    placeholder="黑色"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 證件上傳 */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-[#fafaf9] mb-4">證件上傳</h2>
            <div className="space-y-6">
              {/* 職業駕照 */}
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">職業駕照 *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'driverLicense')}
                  required
                  className="input-dark w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#d4af37] file:text-[#0c0a09] file:font-medium"
                />
                <input
                  type="date"
                  name="driverLicenseExpiry"
                  value={formData.driverLicenseExpiry}
                  onChange={handleInputChange}
                  className="input-dark w-full mt-2"
                  placeholder="到期日（選填）"
                />
              </div>

              {/* 行照 */}
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">行照 *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'vehicleReg')}
                  required
                  className="input-dark w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#d4af37] file:text-[#0c0a09] file:font-medium"
                />
                <input
                  type="date"
                  name="vehicleRegExpiry"
                  value={formData.vehicleRegExpiry}
                  onChange={handleInputChange}
                  className="input-dark w-full mt-2"
                  placeholder="到期日（選填）"
                />
              </div>

              {/* 保險證 */}
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">保險證 *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'insurance')}
                  required
                  className="input-dark w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#d4af37] file:text-[#0c0a09] file:font-medium"
                />
                <input
                  type="date"
                  name="insuranceExpiry"
                  value={formData.insuranceExpiry}
                  onChange={handleInputChange}
                  className="input-dark w-full mt-2"
                  placeholder="到期日（選填）"
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

          {/* 選傳證件（提升派單優先權） */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-[#fafaf9] mb-4">
              選傳證件 <span className="text-sm text-[#d4af37]">（非強制，有助提升派單優先權）</span>
            </h2>
            <div className="space-y-6">
              {/* 良民證 */}
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">
                  良民證 <span className="text-xs text-[#78716c]">（非強制）</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'goodConduct')}
                  className="input-dark w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#292524] file:text-[#a8a29e] file:font-medium"
                />
              </div>

              {/* 無肇事紀錄 */}
              <div>
                <label className="block text-sm text-[#a8a29e] mb-2">
                  無肇事紀錄 <span className="text-xs text-[#78716c]">（非強制）</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'noAccident')}
                  className="input-dark w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#292524] file:text-[#a8a29e] file:font-medium"
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
          <a href="https://line.me/R/@627exwrq" target="_blank" rel="noopener noreferrer" className="text-sm text-[#d4af37] hover:underline block">
            加入 LINE 好友 →
          </a>
          <a href="/driver" className="text-sm text-[#a8a29e] hover:text-[#d4af37]">
            ← 返回登入頁
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0c0a09]"><div className="text-[#a8a29e]">載入中...</div></div>}>
      <RegisterContent />
    </Suspense>
  );
}
