import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/points/history - 取得交易紀錄
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('member_id');
    const lineId = searchParams.get('line_id');
    const type = searchParams.get('type'); // 篩選類型
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!memberId && !lineId) {
      return NextResponse.json(
        { error: '缺少會員識別碼' },
        { status: 400 }
      );
    }

    let targetMemberId = memberId;

    if (!targetMemberId && lineId) {
      const { data: member } = await supabase
        .from('gmo_members')
        .select('id')
        .eq('line_id', lineId)
        .single();
      
      if (!member) {
        return NextResponse.json(
          { error: '找不到會員資料' },
          { status: 404 }
        );
      }
      targetMemberId = member.id;
    }

    let query = supabase
      .from('point_transactions')
      .select('*')
      .eq('member_id', targetMemberId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    // 取得總數
    const { count } = await supabase
      .from('point_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', targetMemberId);

    return NextResponse.json({
      transactions,
      total: count || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Points history error:', error);
    return NextResponse.json(
      { error: error.message || '系統錯誤' },
      { status: 500 }
    );
  }
}
