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
