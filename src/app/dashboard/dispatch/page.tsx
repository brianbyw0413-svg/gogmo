// 快速派單頁面 (v2 — AI 解析對話窗口 + 手動派單)

'use client';

import { useState, useRef, useEffect } from 'react';
import DispatchForm from '@/components/DispatchForm';
import { createTrip } from '@/lib/data';
import { Trip } from '@/types';

interface ParsedTrip {
  service_type: 'pickup' | 'dropoff';
  pickup_address: string;
  dropoff_address: string;
  pickup_area: string;
  dropoff_area: string;
  service_date: string;
  service_time: string;
  flight_number: string;
  passenger_count: number;
  luggage_count: number;
  amount: number;
  driver_fee: number;
  note: string;
  payment_mode: 'customer_pay' | 'driver_kickback';
  contact_name: string;
  contact_phone: string;
}

// 簡易 AI 解析器 — 從文字訊息中提取訂單資訊
function parseDispatchText(text: string): Partial<ParsedTrip> {
  const result: Partial<ParsedTrip> = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text;

  // 接機/送機判斷
  if (/接機|接/.test(fullText) && !/送機|送/.test(fullText)) {
    result.service_type = 'pickup';
  } else if (/送機|送/.test(fullText)) {
    result.service_type = 'dropoff';
  }

  // 航班編號 (e.g. BR872, CI835, IT200, JX890)
  const flightMatch = fullText.match(/([A-Z]{2})\s*(\d{2,4})/i);
  if (flightMatch) {
    result.flight_number = `${flightMatch[1].toUpperCase()}${flightMatch[2]}`;
  }

  // 日期 (e.g. 3/5, 3月5日, 2026-03-05, 03/05)
  const dateMatch = fullText.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/) ||
                    fullText.match(/(\d{1,2})[/月](\d{1,2})[日號]?/);
  if (dateMatch) {
    if (dateMatch[0].includes('202')) {
      // full date
      result.service_date = `${dateMatch[1]}-${String(dateMatch[2]).padStart(2,'0')}-${String(dateMatch[3]).padStart(2,'0')}`;
    } else {
      // month/day only
      const year = new Date().getFullYear();
      const month = String(dateMatch[1]).padStart(2, '0');
      const day = String(dateMatch[2]).padStart(2, '0');
      result.service_date = `${year}-${month}-${day}`;
    }
  }

  // 時間 (e.g. 06:35, 6:35, 下午3點, 15:00)
  const timeMatch = fullText.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    result.service_time = `${String(timeMatch[1]).padStart(2,'0')}:${timeMatch[2]}:00`;
  }

  // 人數
  const passengerMatch = fullText.match(/(\d+)\s*[人位名個]/) || fullText.match(/人數[：:]\s*(\d+)/);
  if (passengerMatch) {
    result.passenger_count = parseInt(passengerMatch[1]);
  }

  // 行李
  const luggageMatch = fullText.match(/(\d+)\s*[件個]\s*行李/) || fullText.match(/行李[：:]\s*(\d+)/);
  if (luggageMatch) {
    result.luggage_count = parseInt(luggageMatch[1]);
  }

  // 金額
  const amountMatch = fullText.match(/\$?\s*(\d{3,5})\s*元/) || fullText.match(/金額[：:]\s*\$?(\d+)/) || fullText.match(/報價[：:]\s*\$?(\d+)/) || fullText.match(/車資[：:]\s*\$?(\d+)/);
  if (amountMatch) {
    result.amount = parseInt(amountMatch[1]);
    result.driver_fee = Math.round(parseInt(amountMatch[1]) * 0.75);
  }

  // 地址 — 嘗試從關鍵字提取
  const pickupMatch = fullText.match(/上車[地址點：:]*[：:\s]*(.+?)(?=\n|下車|$)/);
  const dropoffMatch = fullText.match(/下車[地址點：:]*[：:\s]*(.+?)(?=\n|上車|$)/);
  if (pickupMatch) result.pickup_address = pickupMatch[1].trim();
  if (dropoffMatch) result.dropoff_address = dropoffMatch[1].trim();

  // 機場關鍵字
  if (/桃園機場|桃機|TPE/.test(fullText)) {
    const termMatch = fullText.match(/第?([一二12])航廈/);
    const terminal = termMatch ? (termMatch[1] === '二' || termMatch[1] === '2' ? '第二航廈' : '第一航廈') : '';
    const airportStr = `桃園國際機場${terminal}`;
    if (result.service_type === 'pickup' && !result.pickup_address) {
      result.pickup_address = airportStr;
      result.pickup_area = '桃園機場';
    } else if (result.service_type === 'dropoff' && !result.dropoff_address) {
      result.dropoff_address = airportStr;
      result.dropoff_area = '桃園機場';
    }
  }

  if (/松山機場|松機|TSA/.test(fullText)) {
    if (result.service_type === 'pickup' && !result.pickup_address) {
      result.pickup_address = '松山機場';
      result.pickup_area = '松山機場';
    } else if (result.service_type === 'dropoff' && !result.dropoff_address) {
      result.dropoff_address = '松山機場';
      result.dropoff_area = '松山機場';
    }
  }

  // 地區自動提取
  const areaPatterns = ['台北市','新北市','桃園市','新竹市','新竹縣','基隆市','宜蘭縣','苗栗縣','台中市','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','台南市','高雄市','屏東縣'];
  for (const area of areaPatterns) {
    if (result.pickup_address?.includes(area) && !result.pickup_area) result.pickup_area = area;
    if (result.dropoff_address?.includes(area) && !result.dropoff_area) result.dropoff_area = area;
  }

  // 聯絡人
  const nameMatch = fullText.match(/姓名[：:]\s*(.+?)(?=\n|電話|$)/) || fullText.match(/([陳林黃張李王吳劉蔡楊許鄭謝郭洪邱曾廖賴徐周葉蘇莊呂江何蕭羅高潘簡朱鍾彭游詹胡施沈余盧梁趙顏柯翁魏孫馬][先小太][生姐姐])/);
  if (nameMatch) result.contact_name = nameMatch[1].trim();

  // 電話
  const phoneMatch = fullText.match(/(09\d{2}[-\s]?\d{3}[-\s]?\d{3})/) || fullText.match(/電話[：:]\s*([\d\-\s]+)/);
  if (phoneMatch) result.contact_phone = phoneMatch[1].replace(/[-\s]/g, '');

  // 備註
  const noteMatch = fullText.match(/備註[：:]\s*(.+?)(?=\n|$)/);
  if (noteMatch) result.note = noteMatch[1].trim();

  return result;
}

interface ChatMessage {
  role: 'user' | 'system';
  content: string;
  parsed?: Partial<ParsedTrip>;
  timestamp: Date;
}

export default function DispatchPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'batch'>('ai');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [pendingTrip, setPendingTrip] = useState<Partial<ParsedTrip> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // 批次匯入相關
  const [batchInput, setBatchInput] = useState('');
  const [parsedBatchTrips, setParsedBatchTrips] = useState<Partial<ParsedTrip>[]>([]);
  const [selectedBatchTrips, setSelectedBatchTrips] = useState<Set<number>>(new Set());
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 批次解析多筆訊息
  const handleBatchParse = () => {
    if (!batchInput.trim()) return;
    
    // 用空行或數字開頭分割訊息
    const rawMessages = batchInput.split(/(?:^\d+[.)：:]\s*|\n\s*\n)/).filter(m => m.trim());
    const parsed: Partial<ParsedTrip>[] = [];
    
    rawMessages.forEach(msg => {
      const result = parseDispatchText(msg.trim());
      if (result.service_type || result.service_date || result.pickup_address || result.amount) {
        parsed.push(result);
      }
    });
    
    setParsedBatchTrips(parsed);
    // 預設全部選中
    setSelectedBatchTrips(new Set(parsed.map((_, i) => i)));
  };

  // 切換批次選擇
  const toggleBatchTrip = (index: number) => {
    const newSet = new Set(selectedBatchTrips);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedBatchTrips(newSet);
  };

  // 批次建立行程
  const handleBatchCreate = async () => {
    if (selectedBatchTrips.size === 0) return;
    setIsCreating(true);
    
    let successCount = 0;
    for (const index of selectedBatchTrips) {
      const trip = parsedBatchTrips[index];
      if (trip && trip.service_type && trip.service_date && trip.amount) {
        try {
          const tripData = {
            service_type: trip.service_type,
            payment_mode: trip.payment_mode || 'customer_pay',
            pickup_address: trip.pickup_address || '',
            dropoff_address: trip.dropoff_address || '',
            pickup_area: trip.pickup_area || '',
            dropoff_area: trip.dropoff_area || '',
            service_date: trip.service_date || '',
            service_time: trip.service_time || '',
            flight_number: trip.flight_number || '',
            passenger_count: trip.passenger_count || 1,
            luggage_count: trip.luggage_count || 0,
            amount: trip.amount || 0,
            driver_fee: trip.driver_fee || Math.round((trip.amount || 0) * 0.75),
            note: trip.note || '',
            contact_name: trip.contact_name || '',
            contact_phone: trip.contact_phone || '',
          };
          await createTrip(tripData);
          successCount++;
        } catch (e) {
          console.error('建立行程失敗', e);
        }
      }
    }
    
    setSuccessMsg(`成功建立 ${successCount} 筆行程！`);
    setParsedBatchTrips([]);
    setSelectedBatchTrips(new Set());
    setBatchInput('');
    setTimeout(() => setSuccessMsg(''), 3000);
    setIsCreating(false);
  };

  // AI 解析並回應
  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date() };
    const parsed = parseDispatchText(text);

    // 產生系統回應
    const missing: string[] = [];
    if (!parsed.service_type) missing.push('接機/送機');
    if (!parsed.service_date) missing.push('日期');
    if (!parsed.service_time) missing.push('時間');
    if (!parsed.pickup_address) missing.push('上車地址');
    if (!parsed.dropoff_address) missing.push('下車地址');
    if (!parsed.amount) missing.push('金額');

    let sysContent = '';
    const foundItems: string[] = [];
    if (parsed.service_type) foundItems.push(`類型：${parsed.service_type === 'pickup' ? '接機' : '送機'}`);
    if (parsed.flight_number) foundItems.push(`航班：${parsed.flight_number}`);
    if (parsed.service_date) foundItems.push(`日期：${parsed.service_date}`);
    if (parsed.service_time) foundItems.push(`時間：${parsed.service_time}`);
    if (parsed.pickup_address) foundItems.push(`上車：${parsed.pickup_address}`);
    if (parsed.dropoff_address) foundItems.push(`下車：${parsed.dropoff_address}`);
    if (parsed.passenger_count) foundItems.push(`人數：${parsed.passenger_count}人`);
    if (parsed.luggage_count) foundItems.push(`行李：${parsed.luggage_count}件`);
    if (parsed.amount) foundItems.push(`金額：$${parsed.amount}`);
    if (parsed.contact_name) foundItems.push(`聯絡人：${parsed.contact_name}`);
    if (parsed.contact_phone) foundItems.push(`電話：${parsed.contact_phone}`);
    if (parsed.note) foundItems.push(`備註：${parsed.note}`);

    if (foundItems.length > 0) {
      sysContent += `已解析到以下資訊：\n${foundItems.map(i => `  ${i}`).join('\n')}`;
    }

    if (missing.length > 0 && missing.length <= 3) {
      sysContent += `\n\n還缺少：${missing.join('、')}`;
      sysContent += '\n請補充以上資訊，或直接確認發單。';
    } else if (missing.length > 3) {
      sysContent += '\n\n缺少較多資訊，請補充更多細節。';
    }

    if (foundItems.length === 0) {
      sysContent = '無法辨識訂單資訊，請嘗試貼上完整的派單訊息，包含：日期、時間、航班、地址、金額等。';
    }

    if (missing.length === 0) {
      sysContent += '\n\n所有必要資訊齊全！可以點擊下方「確認發單」。';
    }

    // 合併前一次的 parsed 資料
    const merged = { ...(pendingTrip || {}), ...parsed };
    setPendingTrip(merged);

    const sysMsg: ChatMessage = { role: 'system', content: sysContent, parsed: merged, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg, sysMsg]);
    setInputText('');
  };

  // 確認發單
  const handleConfirmCreate = async () => {
    if (!pendingTrip) return;
    setIsCreating(true);

    try {
      const tripData = {
        service_type: pendingTrip.service_type || 'dropoff',
        payment_mode: pendingTrip.payment_mode || 'customer_pay',
        pickup_address: pendingTrip.pickup_address || '',
        dropoff_address: pendingTrip.dropoff_address || '',
        pickup_area: pendingTrip.pickup_area || '',
        dropoff_area: pendingTrip.dropoff_area || '',
        service_date: pendingTrip.service_date || '',
        service_time: pendingTrip.service_time || '',
        flight_number: pendingTrip.flight_number || '',
        passenger_count: pendingTrip.passenger_count || 1,
        luggage_count: pendingTrip.luggage_count || 0,
        amount: pendingTrip.amount || 0,
        driver_fee: pendingTrip.driver_fee || 0,
        note: pendingTrip.note || '',
        contact_name: pendingTrip.contact_name || '',
        contact_phone: pendingTrip.contact_phone || '',
      };

      const result = await createTrip(tripData);
      if (result) {
        setSuccessMsg('行程卡片已生成！可至行控中心查看。');
        setPendingTrip(null);
        setMessages(prev => [...prev, { role: 'system', content: '行程卡片已成功生成！請至行控中心查看。', timestamp: new Date() }]);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'system', content: '發單失敗，請稍後再試。', timestamp: new Date() }]);
    } finally {
      setIsCreating(false);
    }
  };

  // 清除對話
  const handleClear = () => {
    setMessages([]);
    setPendingTrip(null);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#fafaf9] mb-1">快速派單</h1>
        <p className="text-[#a8a29e] text-sm">貼上派單資訊，AI 自動解析並生成行程卡片</p>
      </div>

      {/* TAB 切換：AI 解析 / 手動派單 */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'ai' ? 'bg-[#d4af37] text-[#0c0a09] font-bold' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'}`}>
          AI 解析發單
        </button>
        <button onClick={() => setActiveTab('batch')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'batch' ? 'bg-[#d4af37] text-[#0c0a09] font-bold' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'}`}>
          批次匯入
        </button>
        <button onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'manual' ? 'bg-[#d4af37] text-[#0c0a09] font-bold' : 'bg-[#1c1917] text-[#a8a29e] border border-[#292524]'}`}>
          手動派單
        </button>
      </div>

      {activeTab === 'batch' && (
        <div className="glass-card p-4">
          <h3 className="text-lg font-bold text-[#fafaf9] mb-3">批次匯入多筆訂單</h3>
          <p className="text-[#a8a29e] text-sm mb-3">
            將 LINE 群組的多筆派單訊息貼上（每筆用空行分隔），AI 會自動解析並可一次建立多筆行程。
          </p>
          <textarea
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            placeholder={`請貼上多筆派單訊息，例如：

1. 送機 3/5 06:35 IT200
上車：台北市大安區忠孝東路
桃園機場第一航廈
2人 3件行李 $1200
陳先生 0912345678

2. 接機 3/6 14:20 CI641
桃園機場第二航廈
新竹市光復路
3人 $2500
李小明 0988765432`}
            className="w-full h-48 bg-[#0c0a09] border border-[#292524] rounded-lg p-3 text-[#fafaf9] text-sm font-mono"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleBatchParse}
              className="px-4 py-2 bg-[#d4af37] text-[#0c0a09] rounded-lg font-bold"
            >
              解析訊息
            </button>
            <button
              onClick={() => { setBatchInput(''); setParsedBatchTrips([]); setSelectedBatchTrips(new Set()); }}
              className="px-4 py-2 bg-[#292524] text-[#a8a29e] rounded-lg"
            >
              清除
            </button>
          </div>

          {/* 解析結果 */}
          {parsedBatchTrips.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#a8a29e]">解析到 {parsedBatchTrips.length} 筆行程，已選取 {selectedBatchTrips.size} 筆</span>
                <button
                  onClick={handleBatchCreate}
                  disabled={selectedBatchTrips.size === 0 || isCreating}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    selectedBatchTrips.size === 0 || isCreating
                      ? 'bg-[#3a3735] text-[#6a6560] cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isCreating ? '建立中...' : `建立 ${selectedBatchTrips.size} 筆行程`}
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {parsedBatchTrips.map((trip, i) => (
                  <div
                    key={i}
                    onClick={() => toggleBatchTrip(i)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedBatchTrips.has(i)
                        ? 'border-[#d4af37] bg-[#d4af37]/10'
                        : 'border-[#292524] bg-[#1a1918]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedBatchTrips.has(i)}
                        onChange={() => {}}
                        className="w-4 h-4 accent-[#d4af37]"
                      />
                      <span className="text-[#d4af37] font-bold">#{i + 1}</span>
                      <span className="text-[#fafaf9]">
                        {trip.service_type === 'pickup' ? '接機' : '送機'} |
                        {trip.service_date} {trip.service_time?.slice(0, 5)} |
                        {trip.flight_number}
                      </span>
                    </div>
                    <div className="text-[#a8a29e] text-sm ml-6 mt-1">
                      {trip.pickup_address} → {trip.dropoff_address}
                    </div>
                    <div className="text-[#a8a29e] text-sm ml-6">
                      {trip.passenger_count}人 | {trip.luggage_count}件 | ${trip.amount} | {trip.contact_name} {trip.contact_phone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mt-3 p-3 bg-green-600/20 border border-green-600 rounded-lg text-green-400 text-center">
              {successMsg}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' ? (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
          {/* 對話區域 */}
          <div className="flex-1 glass-card p-4 overflow-y-auto mb-3" style={{ minHeight: 0 }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-[#5a5550] text-lg mb-2">貼上派單資訊</p>
                <p className="text-[#3a3735] text-sm max-w-md">
                  將 LINE 群組裡的派單訊息直接貼上，AI 會自動解析日期、時間、航班、地址、金額等資訊，並生成行程卡片。
                </p>
                <div className="mt-4 p-3 rounded-lg border border-dashed border-[#3a3735] text-left text-xs text-[#5a5550] max-w-sm">
                  <p className="font-bold text-[#8a8580] mb-1">範例：</p>
                  <p>送機 3/5 06:35 IT200</p>
                  <p>上車：台北市大安區忠孝東路</p>
                  <p>下車：桃園機場第一航廈</p>
                  <p>2人 3件行李 $1200元</p>
                  <p>陳先生 0912345678</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[#d4af37]/20 text-[#e8e6e3] border border-[#d4af37]/30'
                        : 'bg-[#2a2725] text-[#c8c0b8] border border-[#3a3735]'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* 成功提示 */}
          {successMsg && (
            <div className="mb-3 p-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium text-center">
              {successMsg}
            </div>
          )}

          {/* 確認發單按鈕 */}
          {pendingTrip && (pendingTrip.service_date || pendingTrip.flight_number || pendingTrip.amount) && (
            <div className="flex gap-2 mb-3">
              <button onClick={handleConfirmCreate} disabled={isCreating}
                className="flex-1 py-2.5 bg-[#d4af37] text-[#0c0a09] rounded-lg font-bold text-sm hover:bg-[#e8c44a] disabled:opacity-50 transition-colors">
                {isCreating ? '生成中...' : '確認發單'}
              </button>
              <button onClick={handleClear}
                className="px-4 py-2.5 bg-[#2a2725] text-[#8a8580] rounded-lg border border-[#3a3735] text-sm hover:text-[#fafaf9] transition-colors">
                清除
              </button>
            </div>
          )}

          {/* 輸入區 */}
          <div className="glass-card p-3 flex gap-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="貼上派單訊息... (Enter 發送，Shift+Enter 換行)"
              className="flex-1 bg-[#1e1c1a] border border-[#3a3735] rounded-lg px-3 py-2 text-[#e8e6e3] placeholder-[#5a5550] focus:border-[#d4af37]/50 focus:outline-none resize-none text-sm"
              rows={3}
            />
            <button onClick={handleSendMessage}
              className="self-end px-4 py-2 bg-[#d4af37] text-[#0c0a09] rounded-lg font-bold text-sm hover:bg-[#e8c44a] transition-colors">
              解析
            </button>
          </div>
        </div>
      ) : (
        /* 手動派單表單 */
        <div className="glass-card p-6">
          <DispatchForm />
        </div>
      )}

      {/* 提示說明 */}
      <div className="mt-4 p-3 glass-card border-l-4 border-l-[#d4af37]">
        <h3 className="text-sm font-medium text-[#fafaf9] mb-1">派單說明</h3>
        <ul className="text-xs text-[#a8a29e] space-y-0.5">
          <li>AI 解析：直接貼上 LINE 群組的派單訊息，自動辨識並生成行程卡片</li>
          <li>手動派單：逐欄填寫訂單資訊後派單</li>
          <li>派單後可至行控中心查看即時狀態</li>
        </ul>
      </div>
    </div>
  );
}
