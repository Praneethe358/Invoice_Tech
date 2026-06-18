import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { hasPermission } from '@/lib/permissions';
import StaffClient from './StaffClient';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const supabase = await createClient();
  const ctx = await getCurrentUserContext(supabase);

  if (!ctx) redirect('/login');
  if (!hasPermission(ctx.role, 'staff.invite')) redirect('/dashboard');

  // Fetch staff
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('shop_id', ctx.shopId)
    .order('created_at', { ascending: true });

  // Fetch shop info
  const { data: shop } = await supabase
    .from('shops')
    .select('name')
    .eq('id', ctx.shopId)
    .single();

  return (
    <StaffClient
      staff={staff ?? []}
      ownerName={ctx.name}
      shopName={shop?.name || ''}
    />
  );
}
