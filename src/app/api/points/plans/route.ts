import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/points/plans - 取得儲值方案
export async function GET() {
  try {
    const { data: plans, error } = await supabase
      .from('topup_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // 計算實際可獲得的點數
    const plansWithBonus = plans?.map(plan => ({
      ...plan,
      final_points: plan.amount + plan.bonus_points,
      discount_label: plan.bonus_points > 0 
        ? `加贈 ${plan.bonus_points} 點` 
        : '無折扣'
    })) || [];

    return NextResponse.json({ plans: plansWithBonus });
  } catch (error: any) {
    console.error('Points plans error:', error);
    return NextResponse.json(
      { error: error.message || '系統錯誤' },
      { status: 500 }
    );
  }
}
