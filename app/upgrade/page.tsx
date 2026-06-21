import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UpgradeClient from './UpgradeClient';

export const dynamic = 'force-dynamic';

export default async function UpgradePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch shop
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!shop) {
    // Check if staff
    const { data: staff } = await supabase
      .from('staff')
      .select('shop_id')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .single();

    if (staff) {
      const { data: staffShop } = await supabase
        .from('shops')
        .select('*')
        .eq('id', staff.shop_id)
        .single();
      
      if (staffShop) {
        redirect('/dashboard'); // Staff members are redirected to dashboard since only owners should manage billing
      }
    }
    
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
