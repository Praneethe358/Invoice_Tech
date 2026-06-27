import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const cashier = searchParams.get('cashier') || '';
  const type = searchParams.get('type') || 'all'; // 'all', 'authorized', 'silent'
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const admin = createAdminClient();

  // First, retrieve all override logs to do robust filtering & pagination
  const { data: allLogs, error: fetchError } = await admin
    .from('audit_logs')
    .select('*, shops(name)')
    .eq('action', 'MSP_OVERRIDE')
    .order('created_at', { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let filtered = allLogs || [];

  // Filter by search (shop name or product name)
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(log => {
      const shopName = log.shops?.name?.toLowerCase() || '';
      const productName = log.details?.product_name?.toLowerCase() || '';
      return shopName.includes(q) || productName.includes(q);
    });
  }

  // Filter by cashier
  if (cashier.trim()) {
    const q = cashier.trim().toLowerCase();
    filtered = filtered.filter(log => {
      const cashierName = log.details?.cashier_name?.toLowerCase() || '';
      return cashierName.includes(q);
    });
  }

  // Filter by type (authorized vs silent)
  if (type === 'authorized') {
    filtered = filtered.filter(log => {
      const authBy = log.details?.authorized_by;
      return authBy !== null && authBy !== undefined && String(authBy).trim() !== '';
    });
  } else if (type === 'silent') {
    filtered = filtered.filter(log => {
      const authBy = log.details?.authorized_by;
      return authBy === null || authBy === undefined || String(authBy).trim() === '';
    });
  }

  // Paginate
  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginatedLogs = filtered.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    logs: paginatedLogs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
