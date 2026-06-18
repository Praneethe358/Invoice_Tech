import ShopDetailClient from './ShopDetailClient';

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ShopDetailClient shopId={id} />;
}
