import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// 計算扣點金額
function calculateDeduction(amount: number, type: 'accept' | 'cancel'): { deduction: number; total: number } {
  const acceptDeduction = Math.floor(amount * 0.05); // 5% 無條件捨去
  
  if (type === 'cancel') {
    // 取消加扣 10%（原 5% 不退回，所以等於扣 15%）
    const cancelDeduction = Math.floor(amount * 0.10); // 額外 10%
    return {
      deduction: acceptDeduction + cancelDeduction, // 總共扣 15%
      total: acceptDeduction + cancelDeduction
    };
  }
  
  return { deduction: acceptDeduction, total: acceptDeduction };
}

// POST /api/points/deduct - 扣點（接單/取消）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      member_id, 
      line_id, 
      trip_id, 
      order_id, 
      trip_amount, 
      type = 'accept', // 'accept' 或 'cancel'
      note 
    } = body;

    if (!member_id && !line_id) {
      return NextResponse.json(
        { error: '缺少會員識別碼' },
        { status: 400 }
      );
    }

    if (!trip_amount || trip_amount <= 0) {
      return NextResponse.json(
        { error: '缺少行程金額' },
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

    // 取得目前點數餘額
    const { data: account, error: accountError } = await supabase
      .from('point_accounts')
      .select('balance')
      .eq('member_id', targetMemberId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: '找不到點數帳戶' },
        { status: 404 }
      );
    }

    // 計算扣點
    const { deduction, total } = calculateDeduction(trip_amount, type);

    // 檢查餘額是否足夠
    if (account.balance < total) {
      return NextResponse.json(
        { 
          error: '點數不足', 
          current_balance: account.balance,
          required: total,
          shortage: total - account.balance
        },
        { status: 400 }
      );
    }

    const pointsBefore = account.balance;
    const pointsAfter = pointsBefore - total;

    // 執行扣點（使用 transaction 確保原子性）
    const { data: updatedAccount, error: updateError } = await supabase
      .from('point_accounts')
      .update({ 
        balance: pointsAfter,
        total_spent: account.total_spent + total,
        updated_at: new Date().toISOString()
      })
      .eq('member_id', targetMemberId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 記錄異動
    const transactionType = type === 'cancel' ? 'deduct_cancel' : 'deduct_accept';
    const transactionNote = type === 'cancel' 
      ? `取消行程扣點：原${Math.floor(trip_amount * 0.05)}點 + 取消手續費${Math.floor(trip_amount * 0.10)}點`
      : `接單扣點（訂單金額 $${trip_amount}）`;

    const { error: recordError } = await supabase
      .from('point_transactions')
      .insert({
        member_id: targetMemberId,
        type: transactionType,
        amount: -total, // 負數表示扣點
        points_before: pointsBefore,
        points_after: pointsAfter,
        related_trip_id: trip_id,
        related_order_id: order_id,
        note: note || transactionNote
      });

    if (recordError) throw recordError;

    return NextResponse.json({
      success: true,
      deduction: total,
      breakdown: {
        accept_fee: Math.floor(trip_amount * 0.05),
        cancel_fee: type === 'cancel' ? Math.floor(trip_amount * 0.10) : 0
      },
      points_before: pointsBefore,
      points_after: pointsAfter,
      message: type === 'cancel' ? '取消扣點成功' : '接單扣點成功'
    });

  } catch (error: any) {
    console.error('Points deduct error:', error);
    return NextResponse.json(
      { error: error.message || '系統錯誤' },
      { status: 500 }
    );
  }
}
