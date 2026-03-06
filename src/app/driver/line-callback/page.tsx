// LINE Login callback page
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const CHANNEL_ID = '2009340718';
const CHANNEL_SECRET = '96edf72369f40752fdbf3b03b4aca7a7';

function LineCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      setError('無法取得授權碼');
      setLoading(false);
      return;
    }

    // Exchange code for access token
    fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${window.location.origin}/driver/line-callback`,
        client_id: CHANNEL_ID,
        client_secret: CHANNEL_SECRET,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) {
          // Get user profile
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
        // Store LINE info and redirect to driver page
        // For now, we'll use the displayName as the driver name
        localStorage.setItem('gmo_line_user', JSON.stringify(profile));
        router.push('/driver?line_login=true');
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
        <a href="/driver" className="btn-gold inline-block">返回登入頁</a>
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
