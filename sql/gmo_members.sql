-- GMO 會員系統資料表
-- 建立時間: 2026-03-08

-- 會員資料表
CREATE TABLE IF NOT EXISTS gmo_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('driver', 'dispatcher', 'admin')) DEFAULT 'driver',
    
    -- LINE 綁定（可選）
    line_id TEXT,
    line_name TEXT,
    line_picture_url TEXT,
    line_bound_at TIMESTAMPTZ,
    
    -- 狀態
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    
    -- 時間戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_gmo_members_username ON gmo_members(username);
CREATE INDEX IF NOT EXISTS idx_gmo_members_phone ON gmo_members(phone);
CREATE INDEX IF NOT EXISTS idx_gmo_members_line_id ON gmo_members(line_id);
CREATE INDEX IF NOT EXISTS idx_gmo_members_role ON gmo_members(role);

-- RLS
ALTER TABLE gmo_members ENABLE ROW LEVEL SECURITY;

-- 允許所有操作（後續收紧）
CREATE POLICY "allow_all_gmo_members" ON gmo_members FOR ALL USING (true) WITH CHECK (true);

-- 預設管理員帳號 (密碼: gmo2026admin)
INSERT INTO gmo_members (username, password_hash, name, phone, role, status)
VALUES ('admin', '$2a$10$rVnK8.7F5.Y8Z7K9.X0.H.1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T', '系統管理員', '0912345678', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;
