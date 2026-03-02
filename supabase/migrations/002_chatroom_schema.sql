-- PickYouUP 聊天室 Migration
-- 建立時間: 2026-03-02

-- ============================================
-- 聊天室資料表 (chatrooms)
-- 每筆行程一個聊天室
-- ============================================
CREATE TABLE IF NOT EXISTS chatrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- 聊天室標題（可選）
    title TEXT,
    -- 最後一條訊息
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    -- 未讀計數（可擴展）
    unread_count INT DEFAULT 0
);

-- 聊天室參與者 (chat_participants)
-- 車頭、司機、客人都是參與者
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatroom_id UUID REFERENCES chatrooms(id) ON DELETE CASCADE NOT NULL,
    participant_type TEXT NOT NULL CHECK (participant_type IN ('dispatcher', 'driver', 'customer')),
    participant_id TEXT NOT NULL, -- 可以是 driver id 或客人識別碼
    participant_name TEXT,
    participant_phone TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 聊天訊息資料表 (chat_messages)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatroom_id UUID REFERENCES chatrooms(id) ON DELETE CASCADE NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('dispatcher', 'driver', 'customer', 'system')),
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'status_update')),
    content TEXT NOT NULL,
    -- 狀態更新專用欄位
    status_from TEXT,
    status_to TEXT,
    -- 時間戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- 已讀狀態
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_chatrooms_trip_id ON chatrooms(trip_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chatroom_id ON chat_participants(chatroom_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_participant_id ON chat_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chatroom_id ON chat_messages(chatroom_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE chatrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 允許所有操作（之後再收紧）
CREATE POLICY "允許所有操作 chatrooms" ON chatrooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允許所有操作 chat_participants" ON chat_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允許所有操作 chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 聊天室功能函數
-- ============================================

-- 自動建立聊天室函數（當行程建立時調用）
CREATE OR REPLACE FUNCTION create_chatroom_for_trip(p_trip_id UUID)
RETURNS UUID AS $$
DECLARE
    v_chatroom_id UUID;
    v_trip RECORD;
BEGIN
    -- 取得行程資料
    SELECT * INTO v_trip FROM trips WHERE id = p_trip_id;
    
    IF v_trip IS NULL THEN
        RAISE EXCEPTION '行程不存在';
    END IF;

    -- 建立聊天室
    INSERT INTO chatrooms (trip_id, title)
    VALUES (p_trip_id, CONCAT('行程-', v_trip.pickup_area, '→', v_trip.dropoff_area))
    RETURNING id INTO v_chatroom_id;

    -- 建立系統訊息
    INSERT INTO chat_messages (chatroom_id, sender_type, sender_id, sender_name, message_type, content)
    VALUES (
        v_chatroom_id, 
        'system', 
        'system', 
        '系統', 
        'system',
        CONCAT('聊天室已建立。服務日期：', v_trip.service_date, ' ', v_trip.service_time)
    );

    RETURN v_chatroom_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 發送訊息並更新聊天室狀態的函數
CREATE OR REPLACE FUNCTION send_chat_message(
    p_chatroom_id UUID,
    p_sender_type TEXT,
    p_sender_id TEXT,
    p_sender_name TEXT,
    p_content TEXT,
    p_message_type TEXT DEFAULT 'text'
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
BEGIN
    -- 插入訊息
    INSERT INTO chat_messages (chatroom_id, sender_type, sender_id, sender_name, message_type, content)
    VALUES (p_chatroom_id, p_sender_type, p_sender_id, p_sender_name, p_message_type, p_content)
    RETURNING id INTO v_message_id;

    -- 更新聊天室的最後訊息
    UPDATE chatrooms
    SET 
        last_message = p_content,
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = p_chatroom_id;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 發送狀態更新訊息的函數
CREATE OR REPLACE FUNCTION send_status_update_message(
    p_chatroom_id UUID,
    p_sender_type TEXT,
    p_sender_id TEXT,
    p_sender_name TEXT,
    p_status_from TEXT,
    p_status_to TEXT
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
    v_status_text TEXT;
BEGIN
    -- 狀態對應文字
    v_status_text := CASE 
        WHEN p_status_to = 'accepted' THEN '已接單'
        WHEN p_status_to = 'arrived' THEN '已抵達'
        WHEN p_status_to = 'picked_up' THEN '已上車'
        WHEN p_status_to = 'completed' THEN '已完成'
        WHEN p_status_to = 'cancelled' THEN '已取消'
        ELSE p_status_to
    END;

    INSERT INTO chat_messages (
        chatroom_id, sender_type, sender_id, sender_name, 
        message_type, content, status_from, status_to
    )
    VALUES (
        p_chatroom_id, p_sender_type, p_sender_id, p_sender_name,
        'status_update', v_status_text, p_status_from, p_status_to
    )
    RETURNING id INTO v_message_id;

    -- 更新聊天室最後訊息
    UPDATE chatrooms
    SET 
        last_message = v_status_text,
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = p_chatroom_id;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
