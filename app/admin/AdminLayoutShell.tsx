'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/subscriptions', label: 'Subscriptions' },
  { href: '/admin/analytics', label: 'Analytics' },
];

export default function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Admin Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left — Brand + Nav */}
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a6b3c] to-[#22875a] flex items-center justify-center">
                  <span className="text-white font-black text-xs">TB</span>
                </div>
                <span className="text-sm font-black text-slate-900 tracking-tight">
                  TruBill Admin
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive(link.href)
                        ? 'bg-[#1a6b3c]/10 text-[#1a6b3c]'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right — User info + Sign Out */}
            <div className="flex items-center gap-4">
              <span className="hidden lg:block text-[10px] font-semibold text-slate-400 tabular-nums">
                {currentTime}
              </span>
              <div className="h-4 w-px bg-slate-200 hidden lg:block" />
              <span className="text-xs font-bold text-slate-700">
                Praneeth E.
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex gap-1 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                isActive(link.href)
                  ? 'bg-[#1a6b3c]/10 text-[#1a6b3c]'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
