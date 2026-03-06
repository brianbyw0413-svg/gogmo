-- GMO 司機認證系統資料表

-- 司機資料表
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id TEXT UNIQUE,
  line_name TEXT,
  line_picture_url TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  car_model TEXT NOT NULL,
  seats INTEGER NOT NULL DEFAULT 4,
  car_color TEXT,
  
  -- 證件 URL
  driver_license_url TEXT,
  driver_license_expiry DATE,
  vehicle_reg_url TEXT,
  vehicle_reg_expiry DATE,
  insurance_url TEXT,
  insurance_expiry DATE,
  
  -- 認證狀態
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 認證記錄表
CREATE TABLE IF NOT EXISTS driver_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  admin_id UUID,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'suspended', 'reactivated')),
  reason TEXT,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 管理員帳號表
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 司機 policy
CREATE POLICY "drivers_can_read_own" ON drivers FOR SELECT USING (line_id = auth.uid());
CREATE POLICY "drivers_can_update_own" ON drivers FOR UPDATE USING (line_id = auth.uid());
CREATE POLICY "admins_can_manage_all" ON drivers FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE username = auth.jwt() ->> 'email')
);

-- 認證記錄 policy
CREATE POLICY "admins_can_manage_verifications" ON driver_verifications FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE username = auth.jwt() ->> 'email')
);

-- 管理員 policy
CREATE POLICY "admins_full_access" ON admins FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE username = auth.jwt() ->> 'email')
);

-- 創建預設超級管理員 (密碼: gmo2026admin)
INSERT INTO admins (username, password_hash, role) 
VALUES ('admin', '$2a$10$rVnK8.7F5.Y8Z7K9.X0.H.1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T', 'super_admin')
ON CONFLICT (username) DO NOTHING;
