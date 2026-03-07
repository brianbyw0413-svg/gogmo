// 身份選擇頁面
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function RoleSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<{ driver: boolean; dispatcher: boolean }>({
    driver: false,
    dispatcher: false,
  });

  useEffect(() => {
    const checkRoles = async () => {
      const lineUser = localStorage.getItem('gmo_line_user');
      if (!lineUser) {
        router.push('/');
        return;
      }

      const profile = JSON.parse(lineUser);
      const lineId = profile.userId;

      // 檢查是否有司機身份
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, status')
        .eq('line_id', lineId)
        .eq('status', 'approved')
        .single();

      // 檢查是否有調度員身份
      const { data: dispatcherData } = await supabase
        .from('dispatchers')
        .select('id, status')
        .eq('line_id', lineId)
        .eq('status', 'approved')
        .single();

      setRoles({
        driver: !!driverData,
        dispatcher: !!dispatcherData,
      });
      setLoading(false);
    };

    checkRoles();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09]">
        <div className="text-[#a8a29e]">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0a09]">
      <div className="w-full max-w-md p-8 glass-card text-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-full bg-[#d4af37] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-[#0c0a09]">G</span>
          </div>
          <h1 className="text-2xl font-bold text-[#fafaf9]">請選擇登入身份</h1>
          <p className="text-[#a8a29e] mt-2">您有以下身份可以選擇</p>
        </div>

        <div className="space-y-4">
          {roles.driver && (
            <button
              onClick={() => router.push('/driver')}
              className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#e8c44a] text-[#0c0a09] rounded-xl font-bold"
            >
              🚗 司機端
            </button>
          )}

          {roles.dispatcher && (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 bg-gradient-to-r from-[#4a5568] to-[#2d3748] text-[#fafaf9] rounded-xl font-bold"
            >
              📋 調度端
            </button>
          )}

          {!roles.driver && !roles.dispatcher && (
            <div className="text-center">
              <p className="text-[#a8a29e] mb-4">您尚未完成任何身份驗證</p>
              <a
                href="/"
                className="text-[#d4af37] hover:underline"
              >
                回到首頁註冊
              </a>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={() => {
              localStorage.removeItem('gmo_line_user');
              router.push('/');
            }}
            className="text-sm text-[#78716c] hover:text-[#a8a29e]"
          >
            重新登入
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoleSelectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0c0a09]"><div className="text-[#a8a29e]">載入中...</div></div>}>
      <RoleSelectContent />
    </Suspense>
  );
}
