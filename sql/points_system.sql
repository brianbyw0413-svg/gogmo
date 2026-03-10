-- GMO 點數系統資料表
-- 建立時間: 2026-03-09

-- 司機點數帳戶
CREATE TABLE IF NOT EXISTS point_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES gmo_members(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    
    -- 儲值等級（用於折扣計算）
    tier TEXT DEFAULT 'none' CHECK (tier IN ('none', 'bronze', 'silver', 'gold', 'platinum', 'diamond')),
    
    -- 統計
    total_topup INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 點數異動記錄
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES gmo_members(id) ON DELETE CASCADE,
    
    -- 異動類型
    type TEXT NOT NULL CHECK (type IN (
        'topup',           -- 儲值
        'topup_bonus',     -- 儲值加贈
        'deduct_accept',   -- 接單扣點
        'deduct_cancel',   -- 取消加扣
        'reward',          -- 獎勵
        'reward_bonus',    -- 獎勵加碼
        'adjust',          -- 人工調整
        'refund'           -- 退款
    )),
    
    -- 金額
    amount INTEGER NOT NULL,  -- 正數為加點，負數為扣點（儲值bonus和獎勵為正數）
    points_before INTEGER NOT NULL,
    points_after INTEGER NOT NULL,
    
    -- 關聯資料
    related_trip_id UUID,     -- 相關行程ID（扣點用）
    related_order_id TEXT,    -- 相關訂單ID（儲值用）
    
    -- 備註
    note TEXT,
    created_by UUID,         -- 操作者
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 儲值方案
CREATE TABLE IF NOT EXISTS topup_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,           -- 方案名稱
    amount INTEGER NOT NULL,      -- 儲值金額
    bonus_points INTEGER DEFAULT 0,  -- 贈送點數
    discount_rate DECIMAL(4,2) DEFAULT 1.00,  -- 折扣率
    
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_point_accounts_member ON point_accounts(member_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_member ON point_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created ON point_transactions(created_at DESC);

-- RLS
ALTER TABLE point_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topup_plans ENABLE ROW LEVEL SECURITY;

-- Policy: 會員只能查看自己的帳戶
CREATE POLICY "members_can_read_own_points" ON point_accounts FOR SELECT 
    USING (member_id IN (SELECT id FROM gmo_members WHERE line_id = auth.uid()));

CREATE POLICY "members_can_read_own_transactions" ON point_transactions FOR SELECT 
    USING (member_id IN (SELECT id FROM gmo_members WHERE line_id = auth.uid()));

-- Admin 可以管理所有
CREATE POLICY "admins_manage_all_points" ON point_accounts FOR ALL 
    USING (EXISTS (SELECT 1 FROM gmo_members WHERE role = 'admin' AND id = member_id));

CREATE POLICY "admins_manage_all_transactions" ON point_transactions FOR ALL 
    USING (EXISTS (SELECT 1 FROM gmo_members WHERE role = 'admin'));

-- 所有人都可以讀取儲值方案
CREATE POLICY "anyone_read_topup_plans" ON topup_plans FOR SELECT USING (true);

-- 插入預設儲值方案
INSERT INTO topup_plans (name, amount, bonus_points, discount_rate, sort_order) VALUES
    ('基本儲值', 500, 0, 1.00, 1),
    ('小額儲值', 1000, 50, 0.95, 2),
    ('中額儲值', 2000, 150, 0.93, 3),
    ('大額儲值', 3000, 260, 0.92, 4),
    ('豪華儲值', 4000, 400, 0.91, 5),
    ('旗艦儲值', 5000, 600, 0.89, 6)
ON CONFLICT DO NOTHING;
