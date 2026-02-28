// Supabase 客戶端配置
// 用於連接到 Supabase 資料庫

import { createClient } from '@supabase/supabase-js';

// Supabase 連線資訊（從環境變數讀取）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vtvytcrkoqbluvczyepm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_SOp1vthQKdTdQUwoHsMIQA_FCTxzbie';

// 建立 Supabase 客戶端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
