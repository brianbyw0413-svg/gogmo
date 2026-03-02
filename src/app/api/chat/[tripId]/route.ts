import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTrip } from '@/lib/data';

// GET /api/chat/[tripId] - 取得行程的聊天室
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;

    // 取得行程資料
    const trip = await getTrip(tripId);
    if (!trip) {
      return NextResponse.json({ error: '行程不存在' }, { status: 404 });
    }

    // 查詢或建立聊天室
    const { data: chatroom, error: chatroomError } = await supabase
      .from('chatrooms')
      .select('*')
      .eq('trip_id', tripId)
      .single();

    let chatroomId: string;

    if (chatroom) {
      chatroomId = chatroom.id;
    } else {
      // 建立新聊天室
      const { data: newChatroom, error: createError } = await supabase
        .from('chatrooms')
        .insert([{ trip_id: tripId }])
        .select()
        .single();

      if (createError || !newChatroom) {
        console.error('建立聊天室失敗:', createError);
        return NextResponse.json({ error: '建立聊天室失敗' }, { status: 500 });
      }

      chatroomId = newChatroom.id;

      // 建立系統訊息
      await supabase.from('chat_messages').insert([{
        chatroom_id: chatroomId,
        sender_type: 'system',
        sender_id: 'system',
        sender_name: '系統',
        message_type: 'system',
        content: `聊天室已建立。服務日期：${trip.service_date} ${trip.service_time}`
      }]);
    }

    // 取得參與者
    const { data: participants } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('chatroom_id', chatroomId)
      .eq('is_active', true);

    // 取得訊息
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chatroom_id', chatroomId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      chatroom: {
        ...chatroom,
        id: chatroomId,
        trip
      },
      participants: participants || [],
      messages: messages || []
    });
  } catch (error) {
    console.error('取得聊天室錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

// POST /api/chat/[tripId] - 發送訊息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { sender_type, sender_id, sender_name, content, message_type, status_from, status_to } = body;

    if (!content || !sender_type || !sender_id || !sender_name) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 取得行程資料
    const trip = await getTrip(tripId);
    if (!trip) {
      return NextResponse.json({ error: '行程不存在' }, { status: 404 });
    }

    // 查詢聊天室
    let { data: chatroom, error: chatroomError } = await supabase
      .from('chatrooms')
      .select('*')
      .eq('trip_id', tripId)
      .single();

    let chatroomId: string;

    if (chatroom) {
      chatroomId = chatroom.id;
    } else {
      // 如果聊天室不存在，先建立
      const { data: newChatroom } = await supabase
        .from('chatrooms')
        .insert([{ trip_id: tripId }])
        .select()
        .single();

      if (!newChatroom) {
        return NextResponse.json({ error: '建立聊天室失敗' }, { status: 500 });
      }
      chatroomId = newChatroom.id;
    }

    // 發送訊息
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert([{
        chatroom_id: chatroomId,
        sender_type,
        sender_id,
        sender_name,
        message_type: message_type || 'text',
        content,
        status_from,
        status_to
      }])
      .select()
      .single();

    if (messageError) {
      console.error('發送訊息失敗:', messageError);
      return NextResponse.json({ error: '發送訊息失敗' }, { status: 500 });
    }

    // 更新聊天室的最後訊息
    await supabase
      .from('chatrooms')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', chatroomId);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('發送訊息錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
