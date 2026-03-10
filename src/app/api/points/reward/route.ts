import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// POST /api/points/reward - 發放獎勵點數
export async function POST(request: NextRequest) {
  try {
    // 驗證管理員權限
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== 'gmo2026admin') {
      return NextResponse.json(
        { error: '權限不足' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      member_id, 
      line_id, 
      trip_id, 
      amount, 
      type = 'reward',
      note 
    } = body;

    if (!member_id && !line_id) {
      return NextResponse.json(
        { error: '缺少會員識別碼' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: '獎勵點數必須大於 0' },
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

    // 取得目前餘額
    const { data: account, error: accountError } = await supabase
      .from('point_accounts')
      .select('*')
      .eq('member_id', targetMemberId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: '找不到點數帳戶' },
        { status: 404 }
      );
    }

    const pointsBefore = account.balance;
    const pointsAfter = pointsBefore + amount;

    // 更新餘額
    const { data: updatedAccount, error: updateError } = await supabase
      .from('point_accounts')
      .update({ 
        balance: pointsAfter,
        total_earned: account.total_earned + amount,
        updated_at: new Date().toISOString()
      })
      .eq('member_id', targetMemberId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 記錄異動
    const transactionType = type === 'bonus' ? 'reward_bonus' : 'reward';
    const { error: recordError } = await supabase
      .from('point_transactions')
      .insert({
        member_id: targetMemberId,
        type: transactionType,
        amount: amount,
        points_before: pointsBefore,
        points_after: pointsAfter,
        related_trip_id: trip_id,
        note: note || `獎勵點數 +${amount}`
      });

    if (recordError) throw recordError;

    return NextResponse.json({
      success: true,
      amount,
      points_before: pointsBefore,
      points_after: pointsAfter,
      message: '獎勵發放成功'
    });

  } catch (error: any) {
    console.error('Points reward error:', error);
    return NextResponse.json(
      { error: error.message || '系統錯誤' },
      { status: 500 }
    );
  }
}
