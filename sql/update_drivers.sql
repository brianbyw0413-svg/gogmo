-- 更新 drivers 資料表，新增銀行資料和選傳證件欄位

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS good_conduct_url TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS no_accident_url TEXT;

-- 修正 RLS Policy
DROP POLICY IF EXISTS "allow_insert_drivers" ON drivers;
DROP POLICY IF EXISTS "allow_select_drivers" ON drivers;

CREATE POLICY "allow_all_insert" ON drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_select" ON drivers FOR SELECT USING (true);
CREATE POLICY "allow_all_update" ON drivers FOR UPDATE USING (true);
