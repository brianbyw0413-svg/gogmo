-- ============================================
-- GMO 聊天室資料表 Migration
-- 建立時間: 2026-03-08
-- ============================================

-- 聊天室資料表 (chatrooms)
CREATE TABLE IF NOT EXISTS chatrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count INT DEFAULT 0
);

-- 聊天室參與者 (chat_participants)
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatroom_id UUID REFERENCES chatrooms(id) ON DELETE CASCADE NOT NULL,
    participant_type TEXT NOT NULL CHECK (participant_type IN ('dispatcher', 'driver', 'customer')),
    participant_id TEXT NOT NULL,
    participant_name TEXT,
    participant_phone TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- 聊天訊息資料表 (chat_messages)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatroom_id UUID REFERENCES chatrooms(id) ON DELETE CASCADE NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('dispatcher', 'driver', 'customer', 'system')),
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'status_update')),
    content TEXT NOT NULL,
    status_from TEXT,
    status_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_chatrooms_trip_id ON chatrooms(trip_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chatroom_id ON chat_participants(chatroom_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_participant_id ON chat_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chatroom_id ON chat_messages(chatroom_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- RLS
ALTER TABLE chatrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允許所有操作 chatrooms" ON chatrooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允許所有操作 chat_participants" ON chat_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允許所有操作 chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- 函數: 建立聊天室
CREATE OR REPLACE FUNCTION create_chatroom_for_trip(p_trip_id UUID)
RETURNS UUID AS $$
DECLARE
    v_chatroom_id UUID;
    v_trip RECORD;
BEGIN
    SELECT * INTO v_trip FROM trips WHERE id = p_trip_id;
    IF v_trip IS NULL THEN
        RAISE EXCEPTION '行程不存在';
    END IF;
    INSERT INTO chatrooms (trip_id, title)
    VALUES (p_trip_id, CONCAT('行程-', v_trip.pickup_area, '→', v_trip.dropoff_area))
    RETURNING id INTO v_chatroom_id;
    INSERT INTO chat_messages (chatroom_id, sender_type, sender_id, sender_name, message_type, content)
    VALUES (v_chatroom_id, 'system', 'system', '系統', 'system',
        CONCAT('聊天室已建立。服務日期：', v_trip.service_date, ' ', v_trip.service_time));
    RETURN v_chatroom_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函數: 發送訊息
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
    INSERT INTO chat_messages (chatroom_id, sender_type, sender_id, sender_name, message_type, content)
    VALUES (p_chatroom_id, p_sender_type, p_sender_id, p_sender_name, p_message_type, p_content)
    RETURNING id INTO v_message_id;
    UPDATE chatrooms SET last_message = p_content, last_message_at = NOW(), updated_at = NOW()
    WHERE id = p_chatroom_id;
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函數: 發送狀態更新
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
    v_status_text := CASE
        WHEN p_status_to = 'accepted' THEN '已接單'
        WHEN p_status_to = 'arrived' THEN '已抵達'
        WHEN p_status_to = 'picked_up' THEN '已上車'
        WHEN p_status_to = 'completed' THEN '已完成'
        WHEN p_status_to = 'cancelled' THEN '已取消'
        ELSE p_status_to
    END;
    INSERT INTO chat_messages (chatroom_id, sender_type, sender_id, sender_name, message_type, content, status_from, status_to)
    VALUES (v_chatroom_id, p_sender_type, p_sender_id, p_sender_name, 'status_update', v_status_text, p_status_from, p_status_to)
    RETURNING id INTO v_message_id;
    UPDATE chatrooms SET last_message = v_status_text, last_message_at = NOW(), updated_at = NOW()
    WHERE id = p_chatroom_id;
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
