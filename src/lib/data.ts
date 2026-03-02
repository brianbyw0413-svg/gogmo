// 資料庫操作輔助函數
// 包含 Supabase 連線與 Mock Data Fallback

import { supabase } from './supabase';
import { mockTrips, mockDrivers, mockTransactions } from './mockData';
import { Trip, Driver, Transaction, TripStatus, PaymentMode } from '@/types';

// 標記是否使用 Mock Data
let useMockData = false;

// 測試 Supabase 連線
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('drivers').select('id').limit(1);
    if (error) {
      console.warn('Supabase 連線失敗，使用 Mock Data:', error.message);
      useMockData = true;
      return false;
    }
    useMockData = false;
    return true;
  } catch (error) {
    console.warn('Supabase 連線錯誤，使用 Mock Data');
    useMockData = true;
    return false;
  }
}

// 取得所有行程（帶司機資料）
export async function getTrips(): Promise<Trip[]> {
  if (useMockData) {
    return mockTrips;
  }

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('service_date', { ascending: true })
    .order('service_time', { ascending: true });

  if (error) {
    console.error('取得行程失敗:', error);
    return mockTrips;
  }

  // 取得司機資料
  const { data: drivers } = await supabase.from('drivers').select('*');
  
  // 合併司機資料
  return (data || []).map(trip => ({
    ...trip,
    driver: drivers?.find(d => d.id === trip.driver_id)
  }));
}

// 取得單一行程
export async function getTrip(id: string): Promise<Trip | null> {
  if (useMockData) {
    return mockTrips.find(t => t.id === id) || null;
  }

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('取得行程失敗:', error);
    return null;
  }

  return data;
}

// 取得開放中的行程（未結單）
export async function getOpenTrips(): Promise<Trip[]> {
  const trips = await getTrips();
  return trips.filter(t => t.status === 'open');
}

// 取得已接受的行程
export async function getAcceptedTrips(): Promise<Trip[]> {
  const trips = await getTrips();
  return trips.filter(t => ['accepted', 'arrived', 'picked_up'].includes(t.status));
}

// 依狀態取得行程
export async function getTripsByStatus(status: TripStatus): Promise<Trip[]> {
  const trips = await getTrips();
  return trips.filter(t => t.status === status);
}

// 依付款模式取得行程
export async function getTripsByPaymentMode(paymentMode: PaymentMode): Promise<Trip[]> {
  const trips = await getTrips();
  return trips.filter(t => t.payment_mode === paymentMode);
}

// 建立新行程
export async function createTrip(tripData: Partial<Trip>): Promise<Trip | null> {
  if (useMockData) {
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      created_at: new Date().toISOString(),
      service_type: tripData.service_type || 'dropoff',
      payment_mode: tripData.payment_mode || 'customer_pay',
      pickup_address: tripData.pickup_address || '',
      dropoff_address: tripData.dropoff_address || '',
      pickup_area: tripData.pickup_area || '',
      dropoff_area: tripData.dropoff_area || '',
      service_date: tripData.service_date || '',
      service_time: tripData.service_time || '',
      flight_number: tripData.flight_number || '',
      passenger_count: tripData.passenger_count || 1,
      luggage_count: tripData.luggage_count || 0,
      amount: tripData.amount || 0,
      driver_fee: tripData.driver_fee || 0,
      note: tripData.note || '',
      status: 'open',
      driver_id: undefined,
      updated_at: new Date().toISOString()
    };
    mockTrips.push(newTrip);
    return newTrip;
  }

  const { data, error } = await supabase
    .from('trips')
    .insert([tripData])
    .select()
    .single();

  if (error) {
    console.error('建立行程失敗:', error);
    return null;
  }

  return data;
}

// 更新行程狀態
export async function updateTripStatus(id: string, status: TripStatus): Promise<boolean> {
  if (useMockData) {
    const trip = mockTrips.find(t => t.id === id);
    if (trip) {
      trip.status = status;
      trip.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  const { error } = await supabase
    .from('trips')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('更新行程狀態失敗:', error);
    return false;
  }

  return true;
}

// 更新行程加價金額
export async function updateTripPriceBoost(id: string, boostAmount: number): Promise<boolean> {
  if (useMockData) {
    const trip = mockTrips.find(t => t.id === id);
    if (trip) {
      trip.price_boost = (trip.price_boost || 0) + boostAmount;
      trip.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  // 先取得現有加價金額
  const { data: existingTrip } = await supabase
    .from('trips')
    .select('price_boost')
    .eq('id', id)
    .single();

  const currentBoost = existingTrip?.price_boost || 0;
  const newBoost = currentBoost + boostAmount;

  const { error } = await supabase
    .from('trips')
    .update({ price_boost: newBoost, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('更新加價金額失敗:', error);
    return false;
  }

  return true;
}

// 分配司機
export async function assignDriver(tripId: string, driverId: string): Promise<boolean> {
  if (useMockData) {
    const trip = mockTrips.find(t => t.id === tripId);
    const driver = mockDrivers.find(d => d.id === driverId);
    if (trip && driver) {
      trip.driver_id = driverId;
      trip.driver = driver;
      trip.status = 'accepted';
      trip.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  const { error } = await supabase
    .from('trips')
    .update({ 
      driver_id: driverId, 
      status: 'accepted',
      updated_at: new Date().toISOString() 
    })
    .eq('id', tripId);

  if (error) {
    console.error('分配司機失敗:', error);
    return false;
  }

  return true;
}

// 取得所有司機
export async function getDrivers(): Promise<Driver[]> {
  if (useMockData) {
    return mockDrivers;
  }

  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('取得司機失敗:', error);
    return mockDrivers;
  }

  return data || [];
}

// 取得所有帳務
export async function getTransactions(): Promise<Transaction[]> {
  if (useMockData) {
    return mockTransactions;
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('取得帳務失敗:', error);
    return mockTransactions;
  }

  // 合併關聯資料
  const trips = await getTrips();
  const drivers = await getDrivers();

  return (data || []).map(trans => ({
    ...trans,
    trip: trips.find(t => t.id === trans.trip_id),
    driver: drivers.find(d => d.id === trans.driver_id)
  }));
}

// 建立帳務記錄
export async function createTransaction(transData: Partial<Transaction>): Promise<Transaction | null> {
  if (useMockData) {
    const newTrans: Transaction = {
      id: `trans-${Date.now()}`,
      trip_id: transData.trip_id || '',
      driver_id: transData.driver_id,
      type: transData.type || 'customer_pay',
      amount: transData.amount || 0,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    mockTransactions.push(newTrans);
    return newTrans;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([transData])
    .select()
    .single();

  if (error) {
    console.error('建立帳務失敗:', error);
    return null;
  }

  return data;
}

// 標記帳務完成
export async function completeTransaction(id: string): Promise<boolean> {
  if (useMockData) {
    const trans = mockTransactions.find(t => t.id === id);
    if (trans) {
      trans.status = 'completed';
      trans.completed_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  const { error } = await supabase
    .from('transactions')
    .update({ 
      status: 'completed', 
      completed_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    console.error('標記帳務完成失敗:', error);
    return false;
  }

  return true;
}

// 計算統計資料
export async function getFinanceStats(paymentMode?: PaymentMode) {
  let trips = await getTrips();
  
  if (paymentMode) {
    trips = trips.filter(t => t.payment_mode === paymentMode);
  }

  const pending = trips.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completed = trips.filter(t => t.status === 'completed');

  return {
    totalTrips: trips.length,
    totalAmount: trips.reduce((sum, t) => sum + t.amount, 0),
    pendingAmount: pending.reduce((sum, t) => sum + t.amount, 0),
    completedAmount: completed.reduce((sum, t) => sum + t.amount, 0)
  };
}

// ============================================
// 聊天室相關函數
// ============================================
import { Chatroom, ChatMessage, ChatParticipant } from '@/types';

// 聊天室 Mock Data
let mockChatrooms: Chatroom[] = [];
let mockMessages: ChatMessage[] = [];
let mockParticipants: ChatParticipant[] = [];

// 取得或建立行程的聊天室
export async function getOrCreateChatroom(tripId: string): Promise<Chatroom | null> {
  if (useMockData) {
    let chatroom = mockChatrooms.find(c => c.trip_id === tripId);
    if (!chatroom) {
      chatroom = {
        id: `chat-${Date.now()}`,
        trip_id: tripId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        title: '行程聊天室',
        unread_count: 0
      };
      mockChatrooms.push(chatroom);
    }
    // 加入相關資料
    chatroom.participants = mockParticipants.filter(p => p.chatroom_id === chatroom.id);
    chatroom.messages = mockMessages.filter(m => m.chatroom_id === chatroom.id).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return chatroom;
  }

  // 檢查是否已存在聊天室
  const { data: existingChatroom } = await supabase
    .from('chatrooms')
    .select('*')
    .eq('trip_id', tripId)
    .single();

  if (existingChatroom) {
    // 取得聊天室相關資料
    const { data: participants } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('chatroom_id', existingChatroom.id);

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chatroom_id', existingChatroom.id)
      .order('created_at', { ascending: true });

    return {
      ...existingChatroom,
      participants: participants || [],
      messages: messages || []
    };
  }

  // 建立新聊天室
  const { data: newChatroom, error } = await supabase
    .from('chatrooms')
    .insert([{ trip_id: tripId }])
    .select()
    .single();

  if (error || !newChatroom) {
    console.error('建立聊天室失敗:', error);
    return null;
  }

  // 建立系統訊息
  await supabase.from('chat_messages').insert([{
    chatroom_id: newChatroom.id,
    sender_type: 'system',
    sender_id: 'system',
    sender_name: '系統',
    message_type: 'system',
    content: '聊天室已建立'
  }]);

  return {
    ...newChatroom,
    participants: [],
    messages: [{
      id: `msg-${Date.now()}`,
      chatroom_id: newChatroom.id,
      sender_type: 'system',
      sender_id: 'system',
      sender_name: '系統',
      message_type: 'system',
      content: '聊天室已建立',
      created_at: new Date().toISOString(),
      is_read: false
    }]
  };
}

// 取得聊天室的訊息
export async function getChatMessages(chatroomId: string): Promise<ChatMessage[]> {
  if (useMockData) {
    return mockMessages.filter(m => m.chatroom_id === chatroomId).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chatroom_id', chatroomId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('取得訊息失敗:', error);
    return [];
  }

  return data || [];
}

// 發送訊息
export async function sendMessage(
  chatroomId: string,
  senderType: string,
  senderId: string,
  senderName: string,
  content: string,
  messageType: string = 'text',
  statusFrom?: string,
  statusTo?: string
): Promise<ChatMessage | null> {
  if (useMockData) {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatroom_id: chatroomId,
      sender_type: senderType as any,
      sender_id: senderId,
      sender_name: senderName,
      message_type: messageType as any,
      content,
      status_from: statusFrom,
      status_to: statusTo,
      created_at: new Date().toISOString(),
      is_read: false
    };
    mockMessages.push(newMessage);

    // 更新聊天室的最後訊息
    const chatroom = mockChatrooms.find(c => c.id === chatroomId);
    if (chatroom) {
      chatroom.last_message = content;
      chatroom.last_message_at = newMessage.created_at;
      chatroom.updated_at = newMessage.created_at;
    }

    return newMessage;
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{
      chatroom_id: chatroomId,
      sender_type: senderType,
      sender_id: senderId,
      sender_name: senderName,
      message_type: messageType,
      content,
      status_from: statusFrom,
      status_to: statusTo
    }])
    .select()
    .single();

  if (error) {
    console.error('發送訊息失敗:', error);
    return null;
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

  return data;
}

// 加入參與者到聊天室
export async function addParticipant(
  chatroomId: string,
  participantType: string,
  participantId: string,
  participantName?: string,
  participantPhone?: string
): Promise<ChatParticipant | null> {
  if (useMockData) {
    const newParticipant: ChatParticipant = {
      id: `part-${Date.now()}`,
      chatroom_id: chatroomId,
      participant_type: participantType as any,
      participant_id: participantId,
      participant_name: participantName,
      participant_phone: participantPhone,
      joined_at: new Date().toISOString(),
      is_active: true
    };
    mockParticipants.push(newParticipant);
    return newParticipant;
  }

  const { data, error } = await supabase
    .from('chat_participants')
    .insert([{
      chatroom_id: chatroomId,
      participant_type: participantType,
      participant_id: participantId,
      participant_name: participantName,
      participant_phone: participantPhone
    }])
    .select()
    .single();

  if (error) {
    console.error('加入參與者失敗:', error);
    return null;
  }

  return data;
}

// 標記訊息為已讀
export async function markMessagesAsRead(chatroomId: string, userId: string): Promise<boolean> {
  if (useMockData) {
    return true;
  }

  const { error } = await supabase
    .from('chat_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('chatroom_id', chatroomId)
    .neq('sender_id', userId);

  if (error) {
    console.error('標記已讀失敗:', error);
    return false;
  }

  return true;
}

// 取得行程的所有聊天記錄（for dashboard）
export async function getTripsWithChatrooms(): Promise<Chatroom[]> {
  if (useMockData) {
    return mockChatrooms;
  }

  const { data, error } = await supabase
    .from('chatrooms')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('取得聊天室失敗:', error);
    return [];
  }

  return data || [];
}
