// Dashboard 首頁 - 重新導向到派單頁

import { redirect } from 'next/navigation';

export default function DashboardIndex() {
  redirect('/dashboard/dispatch');
}
