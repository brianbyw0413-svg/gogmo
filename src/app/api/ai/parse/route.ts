// AI 解析派單訊息 API (優化版)
import { NextRequest, NextResponse } from 'next/server';

// AI 解析系統提示詞 - 優化版
const SYSTEM_PROMPT = `你是一個機場接送派單資訊解析專家。你的任務是從 LINE 群組的派單訊息中，解析出完整的行程資訊。

【重要】你可能會收到多筆訂單，請解析所有行程並以 JSON Array 格式回覆。

必要欄位（每個行程都要有）：
- service_type: "pickup"（接機）或 "dropoff"（送機）
- service_date: 日期格式 YYYY-MM-DD
- service_time: 時間格式 HH:MM:SS
- pickup_address: 上車地址
- dropoff_address: 下車地址
- pickup_area: 上車區域（如：台北市、桃園機場等）
- dropoff_area: 下車區域

可選欄位（如果訊息中沒有，設為 null）：
- flight_number: 航班編號（如 BR872、CI641）
- passenger_count: 乘客人數
- luggage_count: 行李件數
- amount: 總金額
- driver_fee: 司機費用（若無特別標註，預設為金額的 75%）
- payment_mode: "customer_pay"（客人付款）或 "driver_kickback"（司機回扣）
- contact_name: 聯絡人姓名
- contact_phone: 聯絡人電話（09XX-XXX-XXX 格式）
- note: 備註

【嚴格規則 - 必須遵守】：
1. 看到「接機」「機場接到」「接到」設為 pickup
2. 看到「送機」「送到機場」「送至」設為 dropoff
3. 桃園機場請寫「桃園國際機場」，松山機場請寫「松山機場」
4. 地址若包含「第一航廈」「T1」設為第一航廈，以此類推
5. 電話號碼統一轉換為 09XX-XXX-XXX 格式
6. 【關鍵】如果訊息中找不到某個欄位，必須設為 null，不要自己猜測或編造
7. 【關鍵】如果無法确定是送機還是接機，設為 null
8. 【關鍵】金額必須是數字格式，不要加「元」或任何文字

【輸出格式】：
- 如果只有一筆訂單，回傳：[{...}]
- 如果有多筆訂單，回傳陣列，每筆是一個物件
- 請直接回覆 JSON，不要有任何其他文字說明

【範例輸出】：
[{"service_type":"dropoff","service_date":"2026-03-15","service_time":"04:30:00","pickup_address":"新北市板橋區文化路一段","dropoff_address":"桃園國際機場第一航廈","pickup_area":"新北市","dropoff_area":"桃園機場","flight_number":"BR772","passenger_count":3,"luggage_count":4,"amount":1200,"driver_fee":900,"payment_mode":"customer_pay","contact_name":"王先生","contact_phone":"0912345678","note":""}]`;

// MiniMax API 解析
async function parseWithMiniMax(message: string, apiKey: string): Promise<any> {
  const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_pro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.1',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content from MiniMax');
  }

  return JSON.parse(content);
}

// POST /api/ai/parse - AI 解析派單訊息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, useMock } = body;

    if (!message) {
      return NextResponse.json({ error: '缺少訊息內容' }, { status: 400 });
    }

    // 如果是測試模式，回傳 mock 資料
    if (useMock) {
      const mockResult = {
        service_type: 'dropoff',
        pickup_address: '台北市大安區忠孝東路',
        dropoff_address: '桃園國際機場第一航廈',
        pickup_area: '台北市',
        dropoff_area: '桃園機場',
        service_date: '2026-03-10',
        service_time: '06:35:00',
        flight_number: 'IT200',
        passenger_count: 2,
        luggage_count: 3,
        amount: 1200,
        driver_fee: 900,
        payment_mode: 'customer_pay',
        contact_name: '陳先生',
        contact_phone: '0912345678',
        note: ''
      };
      
      return NextResponse.json({
        success: true,
        parsed: mockResult,
        isMock: true
      });
    }

    // 取得 API Key
    const apiKey = process.env.MINIMAX_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: '請設定 MINIMAX_API_KEY 環境變數'
      }, { status: 500 });
    }

    // 呼叫 MiniMax AI 解析
    const parsed = await parseWithMiniMax(message, apiKey);

    return NextResponse.json({
      success: true,
      parsed,
      isMock: false
    });

  } catch (error) {
    console.error('AI 解析錯誤:', error);
    return NextResponse.json({
      error: '解析失敗，請稍後再試'
    }, { status: 500 });
  }
}
