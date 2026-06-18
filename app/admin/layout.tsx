import { redirect } from 'next/navigation';
import { verifyAdmin } from '@/lib/admin';
import AdminLayoutShell from './AdminLayoutShell';

export const metadata = {
  title: 'TruBill Admin — Dashboard',
  description: 'Internal admin control panel for TruBill Invoice platform.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Level 2 — Server Component admin check
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
