import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { hasPermission } from '@/lib/permissions';
import AuditClient from './AuditClient';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const supabase = await createClient();
  const ctx = await getCurrentUserContext(supabase);

  if (!ctx) redirect('/login');
  if (!hasPermission(ctx.role, 'audit.view')) redirect('/dashboard');

  return <AuditClient />;
}
