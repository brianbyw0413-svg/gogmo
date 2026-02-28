// Dashboard Layout - 車頭端 Layout（含側邊欄）

import DashboardLayout from '@/components/DashboardLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
