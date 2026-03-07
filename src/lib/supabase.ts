// Supabase 客戶端配置
// 用於連接到 Supabase 資料庫

import { createClient } from '@supabase/supabase-js';

// Supabase 連線資訊
const supabaseUrl = 'https://vtvytcrkoqbluvczyepm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dnl0Y3Jrb3FibHV2Y3p5ZXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTM1MDMsImV4cCI6MjA4NzQ2OTUwM30.811m4zP4IRTJh5XFcg1zclb3JH3XNmAbsCyCff2Cze8';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dnl0Y3Jrb3FibHV2Y3p5ZXBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5MzUwMywiZXhwIjoyMDg3NDY5NTAzfQ.w7wq0Ha9F3ucYQvl-xQ-0FHss0TjX7V52eR1NsjG3zE';

// 建立 Supabase 客戶端（一般用戶）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 建立 Supabase 客戶端（服務角色 - 繞過 RLS）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
