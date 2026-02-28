# PickYouUP 派單牆 MVP — Phase 1 Spec

## 技術棧
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + Realtime)
- **Auth**: MVP 階段先用簡單密碼登入（車頭端），之後第二階段再接 LINE LIFF
- **Deploy**: Zeabur
- **Supabase URL**: https://vtvytcrkoqbluvczyepm.supabase.co
- **Brand Colors**: Gold #d4af37, Dark BG #0c0a09

## 頁面結構

### 公開頁面
1. **首頁 `/`** — 動態 Case 卡片展示牆
   - 卡片不停變動（翻頁鐘/滑動效果），製造「很忙」的視覺效果
   - 遊客可見簡略行程（地區 → 地區、時間、金額）
   - 不顯示詳細地址或客人資訊

2. **接單大廳 `/lobby`** — 司機看的 Case 牆
   - MVP 階段先做展示，第二階段再加接單功能
   - 顯示所有未接單的行程卡片

### 車頭端（需登入 `/dashboard`）
3. **快速派單 `/dashboard/dispatch`**
   - 兩種 TAB 模式切換：
     - **客下匯款**：客人付款給車頭，車頭派單給司機（車頭收錢後發單）
     - **司機回金**：司機先收款，事後回金給車頭
   - 派單表單欄位：
     - 服務類型（送機/接機）
     - 上車地址
     - 下車地址
     - 日期
     - 時間
     - 航班編號
     - 乘客人數
     - 行李件數
     - 金額（車頭報價）
     - 司機抽成/回金金額
     - 備註
   - 提交後自動生成行程卡片

4. **行控中心 `/dashboard/control`**
   - 一目瞭然的行程卡片牆
   - 狀態顏色：🟢 綠色=已接單、🔴 紅色=未接單
   - 卡片顯示：
     - 已接單 → 司機姓名、車號、現況（已抵達/客上/客下）
     - 未接單 → 可加價重派、可撤單
   - 已派出的單待司機結束後才消失
   - 篩選/排序功能（依日期、狀態）

5. **帳務中心 `/dashboard/finance`**
   - TAB 切換：客下匯款 / 司機回金
   - 客下匯款統計：
     - 筆數、總金額
     - 各要轉給哪些司機
     - 司機銀行帳號
     - 是否已完成轉帳（可標記）
   - 司機回金統計：
     - 筆數、待確認金額總數
     - 是否已完成（可標記）

## 資料庫 Schema

### trips 表（行程）
- id: uuid PK
- created_at: timestamptz
- service_type: text ('dropoff' | 'pickup')
- payment_mode: text ('customer_pay' | 'driver_kickback')
- pickup_address: text
- dropoff_address: text
- pickup_area: text (簡略地區名，用於公開展示)
- dropoff_area: text
- service_date: date
- service_time: time
- flight_number: text
- passenger_count: int
- luggage_count: int
- amount: int (車頭報價)
- driver_fee: int (司機費用/回金金額)
- note: text
- status: text ('open' | 'accepted' | 'arrived' | 'picked_up' | 'completed' | 'cancelled')
- driver_id: uuid FK nullable
- updated_at: timestamptz

### drivers 表（司機）
- id: uuid PK
- name: text
- phone: text
- car_plate: text
- car_color: text
- car_type: text ('small' | 'large')
- bank_name: text
- bank_account: text
- created_at: timestamptz
- is_active: boolean

### transactions 表（帳務）
- id: uuid PK
- trip_id: uuid FK
- driver_id: uuid FK
- type: text ('customer_pay' | 'driver_kickback')
- amount: int
- status: text ('pending' | 'completed')
- completed_at: timestamptz nullable
- created_at: timestamptz

## UI 設計方向
- 深色主題，延續品牌風格 (Dark BG #0c0a09 + Gold #d4af37)
- 卡片式設計，圓角 + 玻璃質感
- 行控中心要有「指揮中心」的科技感
- 首頁動態效果要讓人覺得平台很活躍
- 響應式設計，車頭端以桌面為主，但也要支援手機

## MVP 優先級
1. 資料庫 Schema + Supabase 設定
2. 快速派單頁（核心功能）
3. 行控中心（狀態追蹤）
4. 帳務中心（收尾）
5. 首頁動態展示（門面）
6. 接單大廳（展示用）
