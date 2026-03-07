// LINE Login callback page - 統一登入系統
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';

// 統一的 LINE Channel (gmo-driver)
const CHANNEL_ID = '2009340718';
const CHANNEL_SECRET = '96edf72369f40752fdbf3b03b4aca7a7';

function LineCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleSelect, setRoleSelect] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state') || 'login';

    if (!code) {
      const error = searchParams.get('error');
      const errorMessage = searchParams.get('error_message');
      if (error) {
        setError(`${error}: ${errorMessage || 'LINE 登入失敗'}`);
      } else {
        setError('無法取得授權碼');
      }
      setLoading(false);
      return;
    }

    const redirectUri = `${window.location.origin}/driver/line-callback`;

    // 使用統一的 Channel
    fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: CHANNEL_ID,
        client_secret: CHANNEL_SECRET,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) {
          return fetch('https://api.line.me/v2/profile', {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          });
        } else {
          throw new Error(data.error_description || '取得 access token 失敗');
        }
      })
      .then((res) => res.json())
      .then((profile) => {
        setUserProfile(profile);
        localStorage.setItem('gmo_line_user', JSON.stringify(profile));
        
        // 檢查用戶身份
        checkUserRoles(profile, state);
      })
      .catch((err) => {
        setError(err.message || '登入失敗');
        setLoading(false);
      });
  }, [searchParams]);

  const checkUserRoles = async (profile: any, state: string) => {
    // 同時檢查司機和調度員資料
    const [driverRes, dispatcherRes] = await Promise.all([
      supabaseAdmin.from('drivers').select('id, status').eq('line_id', profile.userId).single(),
      supabaseAdmin.from('dispatchers').select('id, status').eq('line_id', profile.userId).single()
    ]);

    const driver = driverRes.data;
    const dispatcher = dispatcherRes.data;

    // 儲存權限資訊
    const roles = {
      hasDriver: !!driver,
      driverStatus: driver?.status || null,
      hasDispatcher: !!dispatcher,
      dispatcherStatus: dispatcher?.status || null
    };
    localStorage.setItem('gmo_user_roles', JSON.stringify(roles));

    // 判斷導向
    if (state === 'driver_register') {
      // 明確要註冊司機
      if (driver) {
        if (driver.status === 'approved') {
          router.push('/driver?line_login=true');
        } else if (driver.status === 'pending') {
          alert('您的司機申請正在審核中');
          router.push('/');
        } else {
          router.push('/driver/register?line_login=true&re_register=true');
        }
      } else {
        router.push('/driver/register?line_login=true');
      }
    } else if (state === 'dispatcher_register') {
      // 明確要註冊調度員
      if (dispatcher) {
        if (dispatcher.status === 'approved') {
          router.push('/dashboard?line_login=true');
        } else if (dispatcher.status === 'pending') {
          alert('您的調度員申請正在審核中');
          router.push('/');
        } else {
          router.push('/driver/register-dispatcher?line_login=true&re_register=true');
        }
      } else {
        router.push('/driver/register-dispatcher?line_login=true');
      }
    } else {
      // 一般登入 - 自動判斷身份
      const isDriverApproved = driver?.status === 'approved';
      const isDispatcherApproved = dispatcher?.status === 'approved';

      if (isDriverApproved && isDispatcherApproved) {
        // 兩邊都有權限 - 讓他選
        setRoleSelect(true);
        setLoading(false);
      } else if (isDriverApproved) {
        router.push('/driver?line_login=true');
      } else if (isDispatcherApproved) {
        router.push('/dashboard?line_login=true');
      } else if (driver?.status === 'pending') {
        alert('您的司機申請正在審核中');
        router.push('/');
      } else if (dispatcher?.status === 'pending') {
        alert('您的調度員申請正在審核中');
        router.push('/');
      } else {
        // 都沒有資料，導向首頁讓他選
        router.push('/?line_login=true');
      }
    }

    if (!roleSelect) {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: 'driver' | 'dispatcher') => {
    if (role === 'driver') {
      router.push('/driver?line_login=true');
    } else {
      router.push('/dashboard?line_login=true');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#a8a29e]">登入中...</p>
        </div>
      </div>
    );
  }

  // 角色選擇畫面
  if (roleSelect && userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09] p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#292524] mx-auto mb-4 overflow-hidden">
            {userProfile.pictureUrl ? (
              <img src={userProfile.pictureUrl} alt={userProfile.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-[#d4af37]">
                {userProfile.displayName?.[0] || '?'}
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-[#fafaf9] mb-2">歡迎回來！</h1>
          <p className="text-[#a8a29e] mb-6">請選擇您要以什麼身份進入系統：</p>
          
          <div className="space-y-3">
            <button
              onClick={() => handleRoleSelect('driver')}
              className="w-full p-4 bg-[#1a1918] border border-[#d4af37] rounded-lg hover:bg-[#d4af37]/10 transition-colors"
            >
              <div className="text-xl mb-1">🚗 司機</div>
              <div className="text-sm text-[#a8a29e]">進入司機後台</div>
            </button>
            
            <button
              onClick={() => handleRoleSelect('dispatcher')}
              className="w-full p-4 bg-[#1a1918] border border-[#d4af37] rounded-lg hover:bg-[#d4af37]/10 transition-colors"
            >
              <div className="text-xl mb-1">📋 調度員</div>
              <div className="text-sm text-[#a8a29e]">進入車頭後台</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09]">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-[#fafaf9] mb-2">登入失敗</h1>
          <p className="text-[#a8a29e] mb-4">{error}</p>
          <a href="/" className="btn-gold inline-block">返回首頁</a>
        </div>
      </div>
    );
  }

  return null;
}

export default function LineCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0c0a09]"><div className="text-[#a8a29e]">載入中...</div></div>}>
      <LineCallbackContent />
    </Suspense>
  );
}
