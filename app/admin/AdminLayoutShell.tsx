'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { getSystemStatus } from '@/lib/adminSystemStatus';

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
    window.location.href = '/login';
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 relative overflow-x-clip font-sans select-none">
      {/* Soft elegant background glow shapes for premium light depth */}
      <div className="absolute top-[-300px] left-[-300px] w-[800px] h-[800px] rounded-full bg-blue-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full bg-indigo-100/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-100/20 blur-[100px] pointer-events-none" />

      {/* Admin Top Navbar */}
      <header className="bg-[#1E3A8A] sticky top-0 z-50 shadow-md">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left — Brand + Nav */}
            <div className="flex items-center gap-10">
              <Link href="/admin" className="flex items-center gap-3 group">
                <img
                  src="/trubill-logo.png"
                  alt="TruBill logo"
                  className="w-9 h-9 object-contain shrink-0 group-hover:scale-105 transition-transform duration-300 brightness-0 invert"
                  loading="lazy"
                />
                <div className="flex flex-col">
                  <span className="text-white font-bold">
                    TruBill
                  </span>
                  <span className="text-blue-200 text-xs">
                    Admin Console
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      isActive(link.href)
                        ? 'text-white font-medium border-b-2 border-white pb-1 text-xs'
                        : 'text-blue-200 hover:text-white transition-colors duration-150 text-xs'
                    }
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right — User info + Sign Out */}
            <div className="flex items-center gap-6">
              <span className="hidden lg:block text-[10px] font-bold text-blue-200 tracking-wider uppercase bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                🕒 {currentTime}
              </span>
              <div className="h-4 w-px bg-white/20 hidden lg:block" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black text-white uppercase">
                  PE
                </div>
                <span className="text-xs font-bold text-white">
                  Praneeth E.
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-blue-200 hover:text-white transition-colors duration-150"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-white/10 bg-[#1B357D] px-4 py-2.5 flex gap-4 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(link.href)
                  ? 'text-white font-medium border-b-2 border-white pb-1 text-xs whitespace-nowrap'
                  : 'text-blue-200 hover:text-white transition-colors duration-150 text-xs whitespace-nowrap'
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
