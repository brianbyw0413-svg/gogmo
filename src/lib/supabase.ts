// Supabase 客戶端配置
// 用於連接到 Supabase 資料庫

import { createClient } from '@supabase/supabase-js';

// Supabase 連線資訊（從環境變數讀取）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vtvytcrkoqbluvczyepm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_SOp1vthQKdTdQUwoHsMIQA_FCTxzbie';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_service_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dnl0Y3Jrb3FibHV2Y3l5ZXBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0ODQ2MjIwMCwiZXhwIjoxOTY0MDM4MjAwfQ.9R4c3XKj9Y2Z5vT1rP8nL4mQ6jH2sA';

// 建立 Supabase 客戶端（一般用戶）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 建立 Supabase 客戶端（服務角色 - 繞過 RLS）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
