import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// POST /api/points/topup - 儲值確認
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      member_id, 
      line_id, 
      plan_id,   // 儲值方案 ID
      amount,    // 儲值金額（可選，若有 plan_id 可略過）
      bonus_points, // 贈送點數
      transfer_last3, // 轉帳帳號末3碼
      note 
    } = body;

    if (!member_id && !line_id) {
      return NextResponse.json(
        { error: '缺少會員識別碼' },
        { status: 400 }
      );
    }

    // 取得會員 ID
    let targetMemberId = member_id;
    if (!targetMemberId && line_id) {
      const { data: member } = await supabase
        .from('gmo_members')
        .select('id')
        .eq('line_id', line_id)
        .single();
      
      if (!member) {
        return NextResponse.json(
          { error: '找不到會員資料' },
          { status: 404 }
        );
      }
      targetMemberId = member.id;
    }

    // 取得方案資訊
    let finalAmount = amount || 0;
    let finalBonus = bonus_points || 0;
    let planName = '自行儲值';

    if (plan_id) {
      const { data: plan, error: planError } = await supabase
        .from('topup_plans')
        .select('*')
        .eq('id', plan_id)
        .single();

      if (planError || !plan) {
        return NextResponse.json(
          { error: '找不到儲值方案' },
          { status: 404 }
        );
      }

      finalAmount = plan.amount;
      finalBonus = plan.bonus_points;
      planName = plan.name;
    }

    // 產生訂單編號
    const orderId = `TOP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 取得目前餘額
    const { data: account, error: accountError } = await supabase
      .from('point_accounts')
      .select('*')
      .eq('member_id', targetMemberId)
      .single();

    // 如果沒有帳戶，先建立
    if (accountError || !account) {
      const { data: newAccount } = await supabase
        .from('point_accounts')
        .insert({ member_id: targetMemberId, balance: 0 })
        .select()
        .single();
      
      if (!newAccount) throw new Error('無法建立點數帳戶');
      
      var pointsBefore = 0;
      var pointsAfter = finalAmount + finalBonus;
      var updatedAccount = newAccount;
    } else {
      pointsBefore = account.balance;
      pointsAfter = pointsBefore + finalAmount + finalBonus;
      var { data: updatedAccount, error: updateError } = await supabase
        .from('point_accounts')
        .update({ 
          balance: pointsAfter,
          total_topup: account.total_topup + finalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('member_id', targetMemberId)
        .select()
        .single();

      if (updateError) throw updateError;
    }

    // 記錄儲值（主金額）
    const { error: recordError1 } = await supabase
      .from('point_transactions')
      .insert({
        member_id: targetMemberId,
        type: 'topup',
        amount: finalAmount,
        points_before: pointsBefore,
        points_after: pointsBefore + finalAmount,
        related_order_id: orderId,
        note: `儲值：${planName} $${finalAmount}`
      });

    if (recordError1) throw recordError1;

    // 記錄儲值加贈（如果有）
    if (finalBonus > 0) {
      const { error: recordError2 } = await supabase
        .from('point_transactions')
        .insert({
          member_id: targetMemberId,
          type: 'topup_bonus',
          amount: finalBonus,
          points_before: pointsBefore + finalAmount,
          points_after: pointsAfter,
          related_order_id: orderId,
          note: `儲值加贈：${planName} +${finalBonus} 點`
        });

      if (recordError2) throw recordError2;
    }

    // 更新會員等級
    const newTier = getTier(finalAmount);
    if (newTier !== account?.tier) {
      await supabase
        .from('point_accounts')
        .update({ tier: newTier })
        .eq('member_id', targetMemberId);
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      amount: finalAmount,
      bonus_points: finalBonus,
      total_points: finalAmount + finalBonus,
      points_before: pointsBefore,
      points_after: pointsAfter,
      tier: newTier,
      message: '儲值成功！點數已入帳'
    });

  } catch (error: any) {
    console.error('Points topup error:', error);
    return NextResponse.json(
      { error: error.message || '系統錯誤' },
      { status: 500 }
    );
  }
}

// 根據累計儲值金額判斷等級
function getTier(totalTopup: number): string {
  if (totalTopup >= 20000) return 'diamond';
  if (totalTopup >= 10000) return 'platinum';
  if (totalTopup >= 5000) return 'gold';
  if (totalTopup >= 2000) return 'silver';
  if (totalTopup >= 500) return 'bronze';
  return 'none';
}
