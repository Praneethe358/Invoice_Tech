import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import UpgradeClient from './UpgradeClient';

export const dynamic = 'force-dynamic';

export default async function UpgradePage() {
  const supabase = await createClient();
  const context = await getCurrentUserContext(supabase);

  if (!context) redirect('/login');

  // Staff members are redirected to dashboard since only owners should manage billing
  if (context.role !== 'owner') {
    redirect('/dashboard');
  }

  // Fetch shop
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', context.shopId)
    .single();

  if (!shop) {
    redirect('/signup');
  }

  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '919080689844';

  return (
    <UpgradeClient
      shop={shop as any}
      supportPhone={supportPhone}
    />
  );
}
