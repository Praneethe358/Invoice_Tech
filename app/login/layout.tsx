// Force all auth pages to be dynamically rendered
// (they require Supabase env vars which aren't available at build time)
export const dynamic = 'force-dynamic';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
