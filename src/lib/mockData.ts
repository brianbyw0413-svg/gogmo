// Mock Data - 100 筆模擬行程（含完整行政區）
// 當 Supabase 連線失敗時的備用資料

import { Trip, Driver, Transaction } from '@/types';

// 動態日期
const today = new Date().toISOString().split('T')[0];
const d = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().split('T')[0];

// 模擬司機資料 (10 位)
export const mockDrivers: Driver[] = [
  { id:'d1', name:'王小明', phone:'0912-345-678', car_plate:'ABC-1234', car_color:'黑色', car_type:'small', bank_name:'玉山銀行', bank_account:'1234567890', created_at:'2026-01-01T00:00:00Z', is_active:true },
  { id:'d2', name:'李小華', phone:'0988-888-888', car_plate:'DEF-5678', car_color:'白色', car_type:'small', bank_name:'中國信託', bank_account:'9876543210', created_at:'2026-01-01T00:00:00Z', is_active:true },
  { id:'d3', name:'張志強', phone:'0933-333-333', car_plate:'GHI-9012', car_color:'銀色', car_type:'large', bank_name:'台新銀行', bank_account:'5555666677', created_at:'2026-01-01T00:00:00Z', is_active:true },
  { id:'d4', name:'林俊傑', phone:'0977-777-777', car_plate:'JKL-3456', car_color:'深灰色', car_type:'small', bank_name:'富邦銀行', bank_account:'1111222233', created_at:'2026-01-01T00:00:00Z', is_active:true },
  { id:'d5', name:'陳大文', phone:'0955-123-456', car_plate:'MNO-7890', car_color:'黑色', car_type:'large', bank_name:'國泰世華', bank_account:'2222333344', created_at:'2026-01-15T00:00:00Z', is_active:true },
  { id:'d6', name:'黃美玲', phone:'0966-654-321', car_plate:'PQR-2468', car_color:'白色', car_type:'small', bank_name:'台北富邦', bank_account:'6666777788', created_at:'2026-02-01T00:00:00Z', is_active:true },
  { id:'d7', name:'吳建宏', phone:'0922-111-222', car_plate:'STU-1357', car_color:'鐵灰色', car_type:'small', bank_name:'永豐銀行', bank_account:'3333444455', created_at:'2026-02-10T00:00:00Z', is_active:true },
  { id:'d8', name:'蔡佳琪', phone:'0911-222-333', car_plate:'VWX-2468', car_color:'珍珠白', car_type:'large', bank_name:'合庫銀行', bank_account:'4444555566', created_at:'2026-02-15T00:00:00Z', is_active:true },
  { id:'d9', name:'鄭文龍', phone:'0933-444-555', car_plate:'YZA-3579', car_color:'黑色', car_type:'small', bank_name:'第一銀行', bank_account:'5555666677', created_at:'2026-02-20T00:00:00Z', is_active:true },
  { id:'d10', name:'劉雅婷', phone:'0955-666-777', car_plate:'BCD-4680', car_color:'香檳金', car_type:'small', bank_name:'華南銀行', bank_account:'7777888899', created_at:'2026-02-25T00:00:00Z', is_active:true },
];

// 地址資料庫 — 完整行政區
const addresses = [
  { addr:'台北市大安區忠孝東路四段', area:'台北市大安區' },
  { addr:'台北市信義區松仁路', area:'台北市信義區' },
  { addr:'台北市中山區南京東路三段', area:'台北市中山區' },
  { addr:'台北市松山區八德路四段', area:'台北市松山區' },
  { addr:'台北市內湖區成功路四段', area:'台北市內湖區' },
  { addr:'台北市士林區中山北路六段', area:'台北市士林區' },
  { addr:'台北市北投區石牌路二段', area:'台北市北投區' },
  { addr:'台北市萬華區西園路一段', area:'台北市萬華區' },
  { addr:'台北市文山區木柵路三段', area:'台北市文山區' },
  { addr:'台北市中正區重慶南路一段', area:'台北市中正區' },
  { addr:'新北市板橋區文化路一段', area:'新北市板橋區' },
  { addr:'新北市中和區中和路', area:'新北市中和區' },
  { addr:'新北市永和區永和路二段', area:'新北市永和區' },
  { addr:'新北市新莊區中正路', area:'新北市新莊區' },
  { addr:'新北市三重區重新路三段', area:'新北市三重區' },
  { addr:'新北市蘆洲區中正路', area:'新北市蘆洲區' },
  { addr:'新北市新店區北新路三段', area:'新北市新店區' },
  { addr:'新北市土城區金城路二段', area:'新北市土城區' },
  { addr:'新北市汐止區新台五路一段', area:'新北市汐止區' },
  { addr:'新北市淡水區中正路', area:'新北市淡水區' },
  { addr:'新北市林口區文化二路', area:'新北市林口區' },
  { addr:'桃園市桃園區中正路', area:'桃園市桃園區' },
  { addr:'桃園市中壢區中央西路', area:'桃園市中壢區' },
  { addr:'桃園市龜山區萬壽路', area:'桃園市龜山區' },
  { addr:'桃園市大溪區中正路', area:'桃園市大溪區' },
  { addr:'新竹市東區光復路二段', area:'新竹市東區' },
  { addr:'新竹縣竹北市光明六路', area:'新竹縣竹北市' },
  { addr:'基隆市仁愛區愛一路', area:'基隆市仁愛區' },
  { addr:'基隆市中正區中正路', area:'基隆市中正區' },
  { addr:'宜蘭縣宜蘭市中山路', area:'宜蘭縣宜蘭市' },
  { addr:'宜蘭縣頭城鎮青雲路', area:'宜蘭縣頭城鎮' },
  { addr:'台中市西屯區市政北二路', area:'台中市西屯區' },
  { addr:'台中市北屯區文心路四段', area:'台中市北屯區' },
  { addr:'台中市南屯區文心南路', area:'台中市南屯區' },
  { addr:'彰化縣彰化市中正路', area:'彰化縣彰化市' },
  { addr:'南投縣南投市中山路', area:'南投縣南投市' },
  { addr:'台南市中西區民生路', area:'台南市中西區' },
  { addr:'台南市安平區安平路', area:'台南市安平區' },
  { addr:'高雄市前鎮區中山路', area:'高雄市前鎮區' },
  { addr:'高雄市左營區高鐵路', area:'高雄市左營區' },
  { addr:'屏東縣屏東市自由路', area:'屏東縣屏東市' },
  { addr:'苗栗縣頭份市中正路', area:'苗栗縣頭份市' },
  { addr:'雲林縣斗六市大學路', area:'雲林縣斗六市' },
  { addr:'嘉義市西區中山路', area:'嘉義市西區' },
];

const airports = [
  { addr:'桃園國際機場第一航廈', area:'桃園機場T1' },
  { addr:'桃園國際機場第二航廈', area:'桃園機場T2' },
  { addr:'松山機場', area:'松山機場' },
];

const flights = [
  'BR872','CI835','IT200','JX890','AE992','BR712','CI201','IT795',
  'AE181','MU2046','BR001','CI123','IT302','AE269','BR716','CI987',
  'MM028','TW101','JX801','B7156','AE805','CI838','BR852','IT506',
  'CI031','BR891','AE172','IT288','JX923','CI666','BR375','AE441',
  'CI502','BR163','IT700','AE339','CI824','BR445','MM786','TW203',
];

const names = [
  '陳先生','林小姐','王太太','張先生','李小姐','黃先生','吳小姐',
  '劉太太','蔡先生','楊小姐','許先生','鄭小姐','謝先生','郭太太',
  '洪先生','邱小姐','曾先生','廖太太','賴先生','徐小姐',
  '周先生','葉小姐','蘇先生','莊太太','呂先生','江小姐',
  '何先生','蕭小姐','羅先生','高太太','潘先生','簡小姐',
];

const notes = [
  '','','','','','', // 很多空白（大多沒備註）
  '趕班機','行李較多','帶小孩','商務客','有嬰兒推車','需要安全座椅',
  '有胖胖箱','高爾夫球具','早班機','紅眼班機','需收據','輪椅乘客',
  '兩個大行李箱','寵物同行','VIP客戶','接送同一人','深夜加成',
];

const times = [
  '05:00:00','05:30:00','06:00:00','06:35:00','07:00:00','07:30:00',
  '08:00:00','08:45:00','09:20:00','10:00:00','10:30:00','11:15:00',
  '12:00:00','13:20:00','14:00:00','14:45:00','15:30:00','16:00:00',
  '17:00:00','18:00:00','19:00:00','20:00:00','21:00:00','21:30:00',
  '22:00:00','22:30:00','23:00:00','23:30:00','23:45:00',
];

const statuses: Trip['status'][] = ['open','open','open','open','open','open','open', // 70% open
  'accepted','accepted','accepted',
  'arrived','arrived',
  'picked_up',
  'completed','completed','completed',
];

const payModes: Trip['payment_mode'][] = ['driver_kickback','driver_kickback','driver_kickback','customer_pay'];

function rng(arr: any[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function rngInt(min: number, max: number) { return min + Math.floor(Math.random() * (max - min + 1)); }
function phone() { return `09${rngInt(10,99)}-${rngInt(100,999)}-${rngInt(100,999)}`; }

// 生成 100 筆行程
function generateTrips(): Trip[] {
  const trips: Trip[] = [];
  
  for (let i = 1; i <= 100; i++) {
    const isPickup = Math.random() > 0.5;
    const status = rng(statuses) as Trip['status'];
    const hasDriver = status !== 'open';
    const driver = hasDriver ? rng(mockDrivers) : undefined;
    const dayOffset = rngInt(-2, 5); // -2天前 到 +5天後
    const serviceDate = d(dayOffset);
    const apt = rng(airports);
    const loc = rng(addresses);
    const baseAmount = rngInt(8, 65) * 100; // 800-6500
    const boost = Math.random() < 0.15 ? rngInt(1, 5) * 100 : 0; // 15% 有加價
    
    const trip: Trip = {
      id: `trip-${String(i).padStart(3, '0')}`,
      created_at: new Date(Date.now() - rngInt(0, 7) * 86400000).toISOString(),
      service_type: isPickup ? 'pickup' : 'dropoff',
      payment_mode: rng(payModes),
      pickup_address: isPickup ? apt.addr : loc.addr,
      dropoff_address: isPickup ? loc.addr : apt.addr,
      pickup_area: isPickup ? apt.area : loc.area,
      dropoff_area: isPickup ? loc.area : apt.area,
      service_date: serviceDate,
      service_time: rng(times),
      flight_number: rng(flights),
      passenger_count: rngInt(1, 6),
      luggage_count: rngInt(0, 6),
      amount: baseAmount,
      driver_fee: Math.round(baseAmount * 0.75),
      note: rng(notes),
      status,
      driver_id: driver?.id,
      updated_at: new Date().toISOString(),
      contact_name: rng(names),
      contact_phone: phone(),
      price_boost: boost > 0 ? boost : undefined,
      driver: hasDriver ? { ...driver! } : undefined,
    };
    
    trips.push(trip);
  }
  
  return trips;
}

export const mockTrips: Trip[] = generateTrips();

// 模擬帳務資料
export const mockTransactions: Transaction[] = [];
