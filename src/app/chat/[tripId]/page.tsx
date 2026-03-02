'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Trip, ChatMessage, TripStatus } from '@/types';

interface ChatPageProps {
  // Props interface
}

export default function ChatPage() {
  const params = useParams();
  const tripId = params?.tripId as string;
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ type: 'dispatcher' | 'driver' | 'customer'; name: string; id: string }>({
    type: 'dispatcher',
    name: '車頭',
    id: 'dispatcher-1'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滾動到最新訊息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 取得聊天室資料
  useEffect(() => {
    if (!tripId) return;
    
    const fetchChatData = async () => {
      try {
        const response = await fetch(`/api/chat/${tripId}`);
        const data = await response.json();
        
        if (data.chatroom?.trip) {
          setTrip(data.chatroom.trip);
        }
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('取得聊天室資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();
    
    // 定期刷新訊息 (每 10 秒)
    const interval = setInterval(fetchChatData, 10000);
    return () => clearInterval(interval);
  }, [tripId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !tripId) return;

    try {
      const response = await fetch(`/api/chat/${tripId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_type: currentUser.type,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          content: newMessage.trim()
        })
      });

      const data = await response.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('發送訊息失敗:', error);
    }
  };

  // 取得狀態顏色
  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'open': return 'bg-yellow-500/20 text-yellow-400';
      case 'accepted': return 'bg-blue-500/20 text-blue-400';
      case 'arrived': return 'bg-purple-500/20 text-purple-400';
      case 'picked_up': return 'bg-orange-500/20 text-orange-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // 取得狀態文字
  const getStatusText = (status: TripStatus) => {
    switch (status) {
      case 'open': return '待接單';
      case 'accepted': return '已接單';
      case 'arrived': return '已抵達';
      case 'picked_up': return '已上車';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  // 格式化時間
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
  };

  // 切換用戶角色（測試用）
  const switchRole = (type: 'dispatcher' | 'driver' | 'customer', name: string, id: string) => {
    setCurrentUser({ type, name, id });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center">
        <div className="text-[#a8a29e]">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col">
      {/* 頂部資訊欄 */}
      <div className="bg-[#1c1917] border-b border-[#292524] p-4">
        <div className="max-w-4xl mx-auto">
          {trip && (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-[#fafaf9]">行程聊天室</h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(trip.status)}`}>
                    {getStatusText(trip.status as TripStatus)}
                  </span>
                </div>
                <div className="text-sm text-[#a8a29e]">
                  {trip.service_type === 'dropoff' ? '送機' : '接機'} • {formatDate(trip.service_date)} {trip.service_time.slice(0, 5)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-medium text-[#fafaf9]">
                  {trip.pickup_area} → {trip.dropoff_area}
                </div>
                <div className="text-sm text-[#a8a29e]">
                  ${trip.amount}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 行程詳情卡片 */}
      {trip && (
        <div className="bg-[#1c1917] border-b border-[#292524] p-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[#a8a29e] mb-1">上車地點</div>
              <div className="text-[#fafaf9]">{trip.pickup_address}</div>
            </div>
            <div>
              <div className="text-[#a8a29e] mb-1">目的地點</div>
              <div className="text-[#fafaf9]">{trip.dropoff_address}</div>
            </div>
            <div>
              <div className="text-[#a8a29e] mb-1">航班</div>
              <div className="text-[#fafaf9]">{trip.flight_number || '無'}</div>
            </div>
            <div>
              <div className="text-[#a8a29e] mb-1">人數/行李</div>
              <div className="text-[#fafaf9]">{trip.passenger_count}人 / {trip.luggage_count}件</div>
            </div>
          </div>
        </div>
      )}

      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, index) => {
            const isMe = msg.sender_type === currentUser.type || 
              (msg.sender_type === 'system' ? false : msg.sender_id === currentUser.id);
            const isSystem = msg.sender_type === 'system';
            const isStatusUpdate = msg.message_type === 'status_update';
            
            // 檢查是否需要顯示日期分隔 === 'status_update線
            const showDateDivider = index === 0 || 
              new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();

            return (
              <div key={msg.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <div className="text-xs text-[#57534e] bg-[#1c1917] px-3 py-1 rounded-full">
                      {new Date(msg.created_at).toLocaleDateString('zh-TW', { 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </div>
                  </div>
                )}
                
                {isSystem ? (
                  // 系統訊息
                  <div className="flex justify-center my-4">
                    <div className="bg-[#292524] px-4 py-2 rounded-full text-sm text-[#a8a29e]">
                      {msg.content}
                    </div>
                  </div>
                ) : isStatusUpdate ? (
                  // 狀態更新訊息
                  <div className="flex justify-center my-2">
                    <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 px-4 py-2 rounded-lg text-sm text-[#d4af37]">
                      📌 {msg.sender_name} 將狀態更新為「{msg.content}」
                    </div>
                  </div>
                ) : (
                  // 一般訊息
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                      {!isMe && (
                        <div className="text-xs text-[#a8a29e] mb-1 ml-2">
                          {msg.sender_name}
                        </div>
                      )}
                      <div className={`px-4 py-2 rounded-2xl ${
                        isMe 
                          ? 'bg-[#d4af37] text-[#0c0a09] rounded-br-md' 
                          : 'bg-[#1c1917] text-[#fafaf9] rounded-bl-md'
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`text-xs text-[#57534e] mt-1 ${isMe ? 'text-right mr-2' : 'ml-2'}`}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 訊息輸入區 */}
      <div className="bg-[#1c1917] border-t border-[#292524] p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="輸入訊息..."
              className="flex-1 bg-[#0c0a09] border border-[#292524] rounded-lg px-4 py-3 text-[#fafaf9] placeholder-[#57534e] focus:outline-none focus:border-[#d4af37]"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-[#d4af37] text-[#0c0a09] px-6 py-3 rounded-lg font-medium hover:bg-[#b8962e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              發送
            </button>
          </form>
        </div>
      </div>

      {/* 開發測試區 - 切換用戶 */}
      <div className="fixed bottom-20 right-4 bg-[#1c1917] border border-[#292524] rounded-lg p-3">
        <div className="text-xs text-[#a8a29e] mb-2">測試切換身份</div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => switchRole('dispatcher', '車頭', 'dispatcher-1')}
            className={`px-3 py-1 rounded text-xs ${currentUser.type === 'dispatcher' ? 'bg-[#d4af37] text-[#0c0a09]' : 'bg-[#292524] text-[#a8a29e]'}`}
          >
            車頭
          </button>
          <button
            onClick={() => switchRole('driver', '王小明', 'driver-1')}
            className={`px-3 py-1 rounded text-xs ${currentUser.type === 'driver' ? 'bg-[#d4af37] text-[#0c0a09]' : 'bg-[#292524] text-[#a8a29e]'}`}
          >
            司機
          </button>
          <button
            onClick={() => switchRole('customer', '張小明', 'customer-1')}
            className={`px-3 py-1 rounded text-xs ${currentUser.type === 'customer' ? 'bg-[#d4af37] text-[#0c0a09]' : 'bg-[#292524] text-[#a8a29e]'}`}
          >
            客人
          </button>
        </div>
      </div>
    </div>
  );
}
