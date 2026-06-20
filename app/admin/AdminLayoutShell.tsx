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
      <header className="bg-white/80 border-b border-slate-200/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left — Brand + Nav */}
            <div className="flex items-center gap-10">
              <Link href="/admin" className="flex items-center gap-3 group">
                <img
                  src="/trubill-logo.png"
                  alt="TruBill logo"
                  className="w-9 h-9 object-contain shrink-0 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 tracking-tight leading-none">
                    TruBill
                  </span>
                  <span className="text-[9px] font-bold text-blue-600 tracking-widest uppercase mt-0.5">
                    Admin Panel
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                      isActive(link.href)
                        ? 'bg-blue-50/80 text-blue-600 border border-blue-200/60 shadow-xs'
                        : 'text-slate-600 border border-transparent hover:text-slate-900 hover:bg-slate-100/60'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right — User info + Sign Out */}
            <div className="flex items-center gap-6">
              <span className="hidden lg:block text-[10px] font-bold text-slate-500 tracking-wider tabular-nums uppercase bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
                🕒 {currentTime}
              </span>
              <div className="h-4 w-px bg-slate-200 hidden lg:block" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white uppercase shadow-md shadow-indigo-500/10">
                  PE
                </div>
                <span className="text-xs font-black text-slate-800">
                  Praneeth E.
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-slate-100 bg-white/95 px-4 py-2.5 flex gap-1.5 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-300 ${
                isActive(link.href)
                  ? 'bg-blue-50/80 text-blue-600 border-blue-200/60'
                  : 'text-slate-600 border-transparent hover:bg-slate-50'
              }`}
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
