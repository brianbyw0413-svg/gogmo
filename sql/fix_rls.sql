-- 修正 RLS Policy for drivers table

-- 刪除舊 policy（如果存在）
DROP POLICY IF EXISTS "drivers_can_read_own" ON drivers;
DROP POLICY IF EXISTS "drivers_can_update_own" ON drivers;
DROP POLICY IF EXISTS "admins_can_manage_all" ON drivers;

-- 允許所有人插入新司機（註冊用）
CREATE POLICY "allow_insert_drivers" ON drivers FOR INSERT WITH CHECK (true);

-- 允許所有人讀取（公開資料）
CREATE POLICY "allow_select_drivers" ON drivers FOR SELECT USING (true);

-- 允許司機更新自己的資料
CREATE POLICY "drivers_update_own" ON drivers FOR UPDATE USING (line_id = (SELECT line_id FROM drivers WHERE id = auth.uid()));

-- 管理員可管理所有
CREATE POLICY "admins_can_manage_all" ON drivers FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE username = current_user)
);
