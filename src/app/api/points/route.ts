import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service Role Key（用於管理員操作）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/points - 取得會員點數餘額
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('member_id');
    const lineId = searchParams.get('line_id');

    if (!memberId && !lineId) {
      return NextResponse.json(
        { error: '缺少會員識別碼' },
        { status: 400 }
      );
    }

    let query = supabase.from('point_accounts').select('*');
    
    if (memberId) {
      query = query.eq('member_id', memberId);
    } else if (lineId) {
      // 先透過 lineId 找到會員
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
      query = query.eq('member_id', member.id);
    }

    const { data: account, error } = await query.single();

    if (error) {
      // 如果沒有帳戶，自動建立一個
      if (error.code === 'PGRST116') {
        // 取得會員 ID
        let targetMemberId = memberId;
        if (!targetMemberId && lineId) {
          const { data: member } = await supabase
            .from('gmo_members')
            .select('id')
            .eq('line_id', lineId)
            .single();
          targetMemberId = member?.id;
        }

        if (targetMemberId) {
          const { data: newAccount, error: createError } = await supabase
            .from('point_accounts')
            .insert({ member_id: targetMemberId, balance: 0 })
            .select()
            .single();

          if (createError) throw createError;
          return NextResponse.json({ account: newAccount });
        }
      }
      throw error;
    }

    return NextResponse.json({ account });
  } catch (error: any) {
    console.error('Points GET error:', error);
    return NextResponse.json(
      { error: error.message || '系統錯誤' },
      { status: 500 }
    );
  }
}
