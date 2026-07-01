import ShopClient from './ShopClient';
import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getShopData(id: string) {
  if (!id) return null;

  const supabaseAdmin = createAdminClient() as any;

  const { data: shop } = await supabaseAdmin
    .from('shops')
    .select('*')
    .eq('id', id)
    .single();

  if (!shop) return null;

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, category, price, stock_qty, track_inventory')
    .eq('shop_id', id)
    .order('name', { ascending: true });

  return {
    shop,
    products: products || []
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getShopData(id);

  if (!data) {
    return {
      title: 'Shop Not Found — TruBill',
    };
  }

  return {
    title: `${data.shop.name} Catalog — TruBill`,
    description: `View the public product catalog for ${data.shop.name}.`,
  };
}

export default async function PublicShopPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getShopData(id);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Shop Not Found</h1>
        <p className="text-xs text-gray-500 max-w-xs">
          The shop profile you are trying to view does not exist or has been disabled.
        </p>
      </div>
    );
  }

  return <ShopClient shop={data.shop} products={data.products} />;
}
