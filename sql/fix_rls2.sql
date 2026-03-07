-- 簡化 RLS Policy，讓管理員可以操作

-- 重新啟用並設定簡單的 policy
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取和插入
DROP POLICY IF EXISTS "allow_insert_drivers" ON drivers;
DROP POLICY IF EXISTS "allow_select_drivers" ON drivers;
CREATE POLICY "anyone_can_read_insert" ON drivers FOR ALL USING (true) WITH CHECK (true);
