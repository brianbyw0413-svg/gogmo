-- PickYouUP 資料庫 Migration - MVP 版本
-- 建立時間: 2026-02-28

-- 啟用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 司機資料表 (drivers)
-- ============================================
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    car_plate TEXT,
    car_color TEXT,
    car_type TEXT CHECK (car_type IN ('small', 'large')),
    bank_name TEXT,
    bank_account TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 行程資料表 (trips)
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    service_type TEXT CHECK (service_type IN ('dropoff', 'pickup')) NOT NULL,
    payment_mode TEXT CHECK (payment_mode IN ('customer_pay', 'driver_kickback')) NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    pickup_area TEXT,
    dropoff_area TEXT,
    service_date DATE NOT NULL,
    service_time TIME NOT NULL,
    flight_number TEXT,
    passenger_count INT DEFAULT 1,
    luggage_count INT DEFAULT 0,
    amount INT NOT NULL,
    driver_fee INT NOT NULL,
    note TEXT,
    status TEXT CHECK (status IN ('open', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled')) DEFAULT 'open',
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_service_date ON trips(service_date);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);

-- ============================================
-- 帳務資料表 (transactions)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('customer_pay', 'driver_kickback')) NOT NULL,
    amount INT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_transactions_trip_id ON transactions(trip_id);
CREATE INDEX IF NOT EXISTS idx_transactions_driver_id ON transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ============================================
-- Realtime 訂閱設定 (針對 trips 表)
-- ============================================
-- 啟用 Realtime 功能（由 Supabase Dashboard 或 CLI 控制）
-- ALTER PUBLICATION supabase_realtime ADD TABLE trips;

-- ============================================
-- Row Level Security (RLS) - MVP 寬鬆設定
-- ============================================
-- 啟用 RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- MVP 階段：允許所有操作（之後再收紧）
CREATE POLICY "允許所有操作 drivers" ON drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允許所有操作 trips" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允許所有操作 transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 範例司機資料 (Mock Data)
-- ============================================
INSERT INTO drivers (name, phone, car_plate, car_color, car_type, bank_name, bank_account) VALUES
('王小明', '0912-345-678', 'ABC-1234', '黑色', 'small', '玉山銀行', '1234567890123'),
('李小華', '0988-888-888', 'DEF-5678', '白色', 'small', '中國信託', '9876543210987'),
('張志強', '0933-333-333', 'GHI-9012', '銀色', 'large', '台新銀行', '5555666677778888'),
('林俊傑', '0977-777-777', 'JKL-3456', '深灰色', 'small', '富邦銀行', '1111222233334444')
ON CONFLICT DO NOTHING;

-- ============================================
-- 範例行程資料 (Mock Data)
-- ============================================
INSERT INTO trips (service_type, payment_mode, pickup_address, dropoff_address, pickup_area, dropoff_area, service_date, service_time, flight_number, passenger_count, luggage_count, amount, driver_fee, note, status) VALUES
('dropoff', 'customer_pay', '台北市中山區南京東路三段', '桃園國際機場第一航廈', '台北市', '桃園機場', '2026-03-01', '08:30:00', 'BR872', 3, 2, 1200, 900, '請提前30分鐘到達', 'accepted'),
('pickup', 'driver_kickback', '桃園國際機場第二航廈', '台中市逢甲大學', '桃園機場', '台中市', '2026-03-01', '14:00:00', 'CI641', 2, 1, 2500, 1800, '航班延誤勿催', 'open'),
('dropoff', 'customer_pay', '高雄市鼓山區西子灣', '高雄國際機場', '高雄市', '高雄機場', '2026-03-02', '06:00:00', 'AE982', 1, 1, 800, 600, '早班機', 'completed'),
('pickup', 'customer_pay', '新竹科學園區', '台北松山機場', '新竹市', '台北市', '2026-03-02', '11:00:00', 'B7-100', 4, 3, 1500, 1100, '行李較多', 'accepted'),
('dropoff', 'driver_kickback', '台南火車站', '高雄國際機場', '台南市', '高雄機場', '2026-03-02', '16:30:00', 'GE865', 2, 2, 1800, 1300, '', 'open'),
('pickup', 'customer_pay', '宜蘭礁溪溫泉區', '台北火車站', '宜蘭縣', '台北市', '2026-03-03', '09:00:00', '', 2, 1, 1400, 1000, '泡完溫泉好上路', 'arrived'),
('dropoff', 'customer_pay', '台北101大樓', '桃園國際機場第二航廈', '台北市', '桃園機場', '2026-03-03', '13:00:00', 'JL802', 3, 2, 1100, 800, '', 'open')
ON CONFLICT DO NOTHING;

-- 為現有行程添加司機
UPDATE trips SET driver_id = (SELECT id FROM drivers WHERE name = '王小明') WHERE service_date = '2026-03-01' AND service_time = '08:30:00';
UPDATE trips SET driver_id = (SELECT id FROM drivers WHERE name = '李小華') WHERE service_date = '2026-03-02' AND service_time = '11:00:00';
UPDATE trips SET driver_id = (SELECT id FROM drivers WHERE name = '張志強') WHERE service_date = '2026-03-03' AND service_time = '09:00:00';
