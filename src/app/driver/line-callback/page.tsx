// LINE Login callback page
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Channel IDs
const DRIVER_CHANNEL_ID = '2009340718';
const DISPATCHER_CHANNEL_ID = '2009277112';
// 請填入 GMO-Dispatcher 的 Channel Secret
const DISPATCHER_CHANNEL_SECRET = '8d86d9d32d3e5807f9c964f766a439be';

function LineCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state') || 'driver';

    if (!code) {
      // 檢查是否有錯誤
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

    // 根據 state 決定使用哪個 Channel
    const isDispatcher = state === 'dispatcher';
    const channelId = isDispatcher ? DISPATCHER_CHANNEL_ID : DRIVER_CHANNEL_ID;
    const channelSecret = isDispatcher ? DISPATCHER_CHANNEL_SECRET : '96edf72369f40752fdbf3b03b4aca7a7';
    const redirectUri = `${window.location.origin}/driver/line-callback`;

    // Exchange code for access token
    fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Token response:', data);
        if (data.access_token) {
          // Get user profile
          return fetch('https://api.line.me/v2/profile', {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          });
        } else {
          throw new Error(data.error_description || '取得 access token 失敗: ' + JSON.stringify(data));
        }
      })
      .then((res) => res.json())
      .then((profile) => {
        // Store LINE info
        localStorage.setItem('gmo_line_user', JSON.stringify(profile));
        localStorage.setItem('gmo_login_type', state);
        
        // 根據 state 決定導向
        if (state === 'driver_register') {
          // 司機註冊 → 導向註冊頁面
          router.push('/driver/register?line_login=true');
        } else if (state === 'dispatcher_register') {
          // 調度註冊 → 導向註冊頁面
          router.push('/driver/register-dispatcher?line_login=true');
        } else if (state === 'dispatcher') {
          // 調度登入 → 車頭後台
          router.push('/dashboard?line_login=true');
        } else {
          // 司機登入 → 司機頁面
          router.push('/driver?line_login=true');
        }
      })
      .catch((err) => {
        setError(err.message || '登入失敗');
        setLoading(false);
      });
  }, [searchParams, router]);

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

export default function LineCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0c0a09]"><div className="text-[#a8a29e]">載入中...</div></div>}>
      <LineCallbackContent />
    </Suspense>
  );
}
