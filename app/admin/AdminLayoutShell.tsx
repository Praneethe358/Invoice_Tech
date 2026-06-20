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
    <div className="min-h-screen bg-[#070b13] text-slate-100 relative overflow-hidden font-sans select-none">
      {/* Background neon glow spheres for futuristic dashboard depth */}
      <div className="absolute top-[-300px] left-[-300px] w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-300px] right-[-300px] w-[800px] h-[800px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-600/5 blur-[120px] pointer-events-none" />

      {/* Admin Top Navbar */}
      <header className="bg-[#0b132b]/80 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left — Brand + Nav */}
            <div className="flex items-center gap-10">
              <Link href="/admin" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0052d4] via-[#4364f7] to-[#6fb1fc] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-black text-sm tracking-tighter">TB</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white tracking-tight leading-none">
                    TruBill
                  </span>
                  <span className="text-[9px] font-bold text-blue-400 tracking-widest uppercase mt-0.5">
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
                        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/35 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                        : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right — User info + Sign Out */}
            <div className="flex items-center gap-6">
              <span className="hidden lg:block text-[10px] font-bold text-slate-400 tracking-wider tabular-nums uppercase bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                🕒 {currentTime}
              </span>
              <div className="h-4 w-px bg-slate-800 hidden lg:block" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white uppercase shadow-md shadow-indigo-500/10">
                  PE
                </div>
                <span className="text-xs font-black text-slate-200">
                  Praneeth E.
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-slate-900 bg-[#090e1a]/95 px-4 py-2.5 flex gap-1.5 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-300 ${
                isActive(link.href)
                  ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border-blue-500/30'
                  : 'text-slate-400 border-transparent hover:bg-white/5'
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
