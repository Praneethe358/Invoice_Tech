import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateGSTR1Excel } from '@/lib/gstr1-excel';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, month, year } = body;
    if (!shopId || !month || !year) {
      return NextResponse.json({ error: 'Missing shopId, month, or year' }, { status: 400 });
    }

    // Verify shop ownership
    const { data: shop } = await supabase
      .from('shops')
      .select('id, name')
      .eq('auth_user_id', user.id)
      .single();

    if (!shop || shop.id !== shopId) {
      return NextResponse.json({ error: 'Shop not found or access denied' }, { status: 404 });
    }

    const { buffer, shopName } = await generateGSTR1Excel(supabase, shopId, Number(month), Number(year));

    const monthName = MONTHS[Number(month) - 1];
    const cleanShopName = shopName.replace(/\s+/g, '_');
    const filename = `GSTR1_${cleanShopName}_${monthName}_${year}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('GSTR-1 Excel export failed:', err);
    return NextResponse.json({ error: errorMessage || 'Internal server error' }, { status: 500 });
  }
}
