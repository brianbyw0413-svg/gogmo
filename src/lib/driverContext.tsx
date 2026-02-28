// 司機端狀態管理 Context
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Driver, Trip, TripMatch } from '@/types';
import { mockDrivers, mockTrips } from '@/lib/mockData';

interface DriverContextType {
  driver: Driver | null;
  login: (name: string, licensePlate: string) => boolean;
  logout: () => void;
  isLoggedIn: boolean;
  // 行程操作
  myTrips: Trip[];
  acceptTrip: (tripId: string) => boolean;
  openTrips: Trip[];
  completedTrips: Trip[];
  getSmartMatches: () => TripMatch[];
  getMatchesForTrip: (trip: Trip) => TripMatch[];
  addSelfCustomerTrip: (tripData: Partial<Trip>) => Trip;
  allTrips: Trip[];
  refreshTrips: () => void;
}

const DriverContext = createContext<DriverContextType | null>(null);

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDriver must be used within DriverProvider');
  return ctx;
}

// 地區相關性判斷 (判斷是否順路/成套)
function getAreaGroup(area?: string): string {
  if (!area) return 'unknown';
  if (area.includes('桃園機場')) return '桃園機場';
  if (area.includes('高雄機場')) return '高雄機場';
  if (area.includes('台北') || area.includes('新北')) return '大台北';
  if (area.includes('桃園')) return '桃園';
  if (area.includes('新竹')) return '新竹';
  if (area.includes('台中')) return '台中';
  if (area.includes('台南')) return '台南';
  if (area.includes('高雄')) return '高雄';
  if (area.includes('宜蘭')) return '宜蘭';
  if (area.includes('屏東')) return '屏東';
  return 'other';
}

function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

export function DriverProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([...mockTrips]);

  // 從 localStorage 還原登入
  useEffect(() => {
    const saved = localStorage.getItem('gmo_driver');
    if (saved) {
      try {
        setDriver(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const refreshTrips = () => {
    setTrips([...mockTrips]);
  };

  const login = (name: string, licensePlate: string): boolean => {
    // 先查已有的 driver
    const existing = mockDrivers.find(
      d => d.car_plate?.toLowerCase() === licensePlate.toLowerCase()
    );
    if (existing) {
      const d = { ...existing, name };
      setDriver(d);
      localStorage.setItem('gmo_driver', JSON.stringify(d));
      return true;
    }
    // 新建 mock driver
    const newDriver: Driver = {
      id: `driver-${Date.now()}`,
      name,
      car_plate: licensePlate,
      car_type: 'small',
      created_at: new Date().toISOString(),
      is_active: true,
    };
    mockDrivers.push(newDriver);
    setDriver(newDriver);
    localStorage.setItem('gmo_driver', JSON.stringify(newDriver));
    return true;
  };

  const logout = () => {
    setDriver(null);
    localStorage.removeItem('gmo_driver');
  };

  // 我的行程（已接單、進行中、已完成）
  const myTrips = trips.filter(t => t.driver_id === driver?.id);

  // 可接行程
  const openTrips = trips.filter(t => t.status === 'open');

  // 已完成行程
  const completedTrips = myTrips.filter(t => t.status === 'completed');

  // 接單
  const acceptTrip = (tripId: string): boolean => {
    if (!driver) return false;
    const tripIndex = mockTrips.findIndex(t => t.id === tripId);
    if (tripIndex === -1) return false;
    const trip = mockTrips[tripIndex];
    if (trip.status !== 'open') return false;

    trip.status = 'accepted';
    trip.driver_id = driver.id;
    trip.driver = driver;
    trip.updated_at = new Date().toISOString();
    refreshTrips();
    return true;
  };

  // 智慧配對：根據司機已接行程推薦順路/成套的 open 行程
  const getSmartMatches = (): TripMatch[] => {
    if (!driver) return [];
    const myAccepted = trips.filter(
      t => t.driver_id === driver.id && ['accepted', 'arrived', 'picked_up'].includes(t.status)
    );
    if (myAccepted.length === 0) return [];

    const matches: TripMatch[] = [];
    const seen = new Set<string>();

    for (const myTrip of myAccepted) {
      for (const candidate of openTrips) {
        if (seen.has(candidate.id)) continue;

        const myDropoffGroup = getAreaGroup(myTrip.dropoff_area);
        const myPickupGroup = getAreaGroup(myTrip.pickup_area);
        const candPickupGroup = getAreaGroup(candidate.pickup_area);
        const candDropoffGroup = getAreaGroup(candidate.dropoff_area);
        const sameDay = isSameDay(myTrip.service_date, candidate.service_date);

        // 順路配對：我送到 A，有人從 A 需要接
        if (myDropoffGroup === candPickupGroup && sameDay) {
          const formatDate = (d: string) => {
            const date = new Date(d);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          };
          const serviceLabel = myTrip.service_type === 'dropoff' ? '送機' : '接機';
          matches.push({
            trip: candidate,
            matchType: 'route',
            matchScore: 95,
            reason: `與您 ${formatDate(myTrip.service_date)} 的${myTrip.dropoff_area || ''}${serviceLabel}順路`,
          });
          seen.add(candidate.id);
          continue;
        }

        // 成套配對：同天 同地區 反向（送機+接機）
        if (sameDay && myTrip.service_type !== candidate.service_type) {
          if (myDropoffGroup === candPickupGroup || myPickupGroup === candDropoffGroup) {
            matches.push({
              trip: candidate,
              matchType: 'bundle',
              matchScore: 85,
              reason: `可與您的行程成套（同天反向）`,
            });
            seen.add(candidate.id);
            continue;
          }
        }

        // 時間配對：同天同地區
        if (sameDay && (myPickupGroup === candPickupGroup || myDropoffGroup === candDropoffGroup)) {
          matches.push({
            trip: candidate,
            matchType: 'time',
            matchScore: 60,
            reason: `同天同地區，可安排連續接送`,
          });
          seen.add(candidate.id);
        }
      }
    }

    // 按分數排序
    matches.sort((a, b) => b.matchScore - a.matchScore);
    return matches;
  };

  // 針對特定行程取得配對
  const getMatchesForTrip = (trip: Trip): TripMatch[] => {
    const matches: TripMatch[] = [];
    const tripDropoffGroup = getAreaGroup(trip.dropoff_area);
    const tripPickupGroup = getAreaGroup(trip.pickup_area);

    for (const candidate of openTrips) {
      if (candidate.id === trip.id) continue;
      const candPickupGroup = getAreaGroup(candidate.pickup_area);
      const candDropoffGroup = getAreaGroup(candidate.dropoff_area);
      const sameDay = isSameDay(trip.service_date, candidate.service_date);

      if (tripDropoffGroup === candPickupGroup && sameDay) {
        matches.push({
          trip: candidate,
          matchType: 'route',
          matchScore: 95,
          reason: `順路：可從${trip.dropoff_area}繼續接單`,
        });
      } else if (sameDay && trip.service_type !== candidate.service_type &&
                 (tripDropoffGroup === candPickupGroup || tripPickupGroup === candDropoffGroup)) {
        matches.push({
          trip: candidate,
          matchType: 'bundle',
          matchScore: 85,
          reason: `成套：同天反向行程`,
        });
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);
    return matches;
  };

  // 新增自客行程
  const addSelfCustomerTrip = (tripData: Partial<Trip>): Trip => {
    const newTrip: Trip = {
      id: `trip-self-${Date.now()}`,
      created_at: new Date().toISOString(),
      service_type: tripData.service_type || 'dropoff',
      payment_mode: 'customer_pay',
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
      driver_fee: tripData.driver_fee || tripData.amount || 0,
      note: tripData.note || '',
      status: 'accepted',
      driver_id: driver?.id,
      driver: driver || undefined,
      updated_at: new Date().toISOString(),
    };
    mockTrips.push(newTrip);
    refreshTrips();
    return newTrip;
  };

  return (
    <DriverContext.Provider value={{
      driver,
      login,
      logout,
      isLoggedIn: !!driver,
      myTrips,
      acceptTrip,
      openTrips,
      completedTrips,
      getSmartMatches,
      getMatchesForTrip,
      addSelfCustomerTrip,
      allTrips: trips,
      refreshTrips,
    }}>
      {children}
    </DriverContext.Provider>
  );
}
