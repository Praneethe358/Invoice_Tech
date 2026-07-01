/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Shop, Product } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/current-user';
import CatalogClient from './CatalogClient';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const supabase = await createClient();
  const context = await getCurrentUserContext(supabase);

  if (!context) redirect('/login');

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, logo_url, inventory_enabled, business_type, shop_type')
    .eq('id', context.shopId)
    .single();

  if (!shop) redirect('/signup');

  const { data: products } = await supabase
    .from('products')
    .select('id, shop_id, name, price, created_at, hsn_code, gst_rate, stock_qty, low_stock_threshold, track_inventory, is_favorite, category, last_used_at, use_count, wholesale_price, season_tag')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: true })
    .limit(25);

  let initialVariants: any[] = [];
  if (products && products.length > 0) {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, product_id, size, color, sku, stock_qty, low_stock_threshold, barcode, barcode_source, created_at')
      .in('product_id', products.map((p: any) => p.id));
    initialVariants = variants || [];
  }

  return (
    <CatalogClient
      shop={shop as Shop}
      initialProducts={(products ?? []) as Product[]}
      initialVariants={initialVariants}
      userName={context.name}
    />
  );
}
