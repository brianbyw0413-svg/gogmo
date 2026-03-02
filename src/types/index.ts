// PickYouUP 類型定義

// 行程狀態
export type TripStatus = 'open' | 'accepted' | 'arrived' | 'picked_up' | 'completed' | 'cancelled';

// 服務類型
export type ServiceType = 'dropoff' | 'pickup';

// 付款模式
export type PaymentMode = 'customer_pay' | 'driver_kickback';

// 司機類型
export type CarType = 'small' | 'large';

// 司機資料
export interface Driver {
  id: string;
  name: string;
  phone?: string;
  car_plate?: string;
  car_color?: string;
  car_type?: CarType;
  bank_name?: string;
  bank_account?: string;
  created_at: string;
  is_active: boolean;
}

// 行程資料
export interface Trip {
  id: string;
  created_at: string;
  service_type: ServiceType;
  payment_mode: PaymentMode;
  pickup_address: string;
  dropoff_address: string;
  pickup_area?: string;
  dropoff_area?: string;
  service_date: string;
  service_time: string;
  flight_number?: string;
  passenger_count: number;
  luggage_count: number;
  amount: number;
  driver_fee: number;
  note?: string;
  status: TripStatus;
  driver_id?: string;
  updated_at: string;
  price_boost?: number;
  // 聯絡人資料
  contact_name?: string;
  contact_phone?: string;
  // 關聯資料
  driver?: Driver;
}

// 帳務類型
export type TransactionType = 'customer_pay' | 'driver_kickback';
export type TransactionStatus = 'pending' | 'completed';

// 帳務資料
export interface Transaction {
  id: string;
  trip_id: string;
  driver_id?: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  completed_at?: string;
  created_at: string;
  // 關聯資料
  trip?: Trip;
  driver?: Driver;
}

// 智慧配對結果
export interface TripMatch {
  trip: Trip;
  matchType: 'route' | 'bundle' | 'time';
  matchScore: number;
  reason: string; // e.g. "與您 3/5 的桃園送機順路"
  relatedTrip?: Trip; // 關聯的已接行程
}

// 司機端登入資料
export interface DriverSession {
  driver: Driver;
  loginAt: string;
}

// 派單表單資料
export interface DispatchFormData {
  service_type: ServiceType;
  payment_mode: PaymentMode;
  pickup_address: string;
  dropoff_address: string;
  service_date: string;
  service_time: string;
  flight_number: string;
  passenger_count: number;
  luggage_count: number;
  amount: number;
  driver_fee: number;
  note: string;
}

// 儀表板統計資料
export interface FinanceStats {
  totalTrips: number;
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
}

// ============================================
// 聊天室類型定義
// ============================================

// 參與者類型
export type ParticipantType = 'dispatcher' | 'driver' | 'customer';

// 訊息類型
export type MessageType = 'text' | 'system' | 'status_update';

// 聊天室參與者
export interface ChatParticipant {
  id: string;
  chatroom_id: string;
  participant_type: ParticipantType;
  participant_id: string;
  participant_name?: string;
  participant_phone?: string;
  joined_at: string;
  last_read_at?: string;
  is_active: boolean;
}

// 聊天訊息
export interface ChatMessage {
  id: string;
  chatroom_id: string;
  sender_type: ParticipantType | 'system';
  sender_id: string;
  sender_name: string;
  message_type: MessageType;
  content: string;
  status_from?: string;
  status_to?: string;
  created_at: string;
  is_read: boolean;
  read_at?: string;
}

// 聊天室
export interface Chatroom {
  id: string;
  trip_id: string;
  created_at: string;
  updated_at: string;
  title?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  // 關聯資料
  participants?: ChatParticipant[];
  messages?: ChatMessage[];
  trip?: Trip;
}

// 聊天室建立請求
export interface CreateChatroomRequest {
  tripId: string;
  customerName?: string;
  customerPhone?: string;
}

// 發送訊息請求
export interface SendMessageRequest {
  sender_type: ParticipantType | 'system';
  sender_id: string;
  sender_name: string;
  content: string;
  message_type?: MessageType;
  status_from?: string;
  status_to?: string;
}
