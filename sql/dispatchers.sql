-- 建立調度員資料表
CREATE TABLE IF NOT EXISTS dispatchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatcher_number TEXT UNIQUE,
  line_id TEXT,
  line_name TEXT,
  line_picture_url TEXT,
  name TEXT NOT NULL,
  company TEXT,
  id_number TEXT,
  ein TEXT,
  phone TEXT NOT NULL,
  bank_name TEXT,
  bank_code TEXT,
  bank_account TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE dispatchers ENABLE ROW LEVEL SECURITY;

-- Policy
DROP POLICY IF EXISTS "allow_all_dispatchers" ON dispatchers;
CREATE POLICY "allow_all_dispatchers" ON dispatchers FOR ALL USING (true);
