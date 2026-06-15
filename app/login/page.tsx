'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/Input';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        showToast(
          error.message === 'Invalid login credentials'
            ? 'Wrong email or password. Please try again.'
            : error.message,
          'error'
        );
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Login failed',
        'error'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Left — Branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero gradient-hero-mesh relative items-center justify-center p-12 overflow-hidden">
        {/* Back Link */}
        <Link 
          href="/" 
          className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white font-semibold text-sm transition-colors group z-20"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Home
        </Link>

        {/* Ambient background blur circles */}
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-md w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="font-heading font-black text-xl text-white">Varavu</span>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Invoice <span className="bg-gradient-to-r from-emerald-400 to-[#10b981] bg-clip-text text-transparent">smarter</span>,<br />not harder.
          </h2>
          <p className="text-[#e6f4ea]/80 text-base leading-relaxed">
            Professional WhatsApp invoicing built for supermarkets, retail shops, and freelancers.
          </p>

          {/* Floating Glassmorphic WhatsApp Card */}
          <motion.div
            initial={{ y: 20, opacity: 0, rotate: -2 }}
            animate={{ y: [0, -10, 0], opacity: 1, rotate: [-2, -1, -2] }}
            transition={{ 
              opacity: { duration: 0.6 },
              y: { repeat: Infinity, duration: 5, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 8, ease: "easeInOut" }
            }}
            className="mt-10 p-5 rounded-2xl glass-card border border-white/10 shadow-2xl relative max-w-sm mx-auto lg:mx-0"
          >
            {/* WhatsApp Header style */}
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">V</div>
              <div>
                <p className="text-[11px] font-bold text-white leading-none">Varavu Store</p>
                <p className="text-[8px] text-emerald-400 font-semibold uppercase tracking-wider mt-0.5">invoicing bot</p>
              </div>
            </div>
            {/* Message Bubble */}
            <div className="bg-[#dcf8c6] text-slate-800 p-3.5 rounded-xl text-[11px] space-y-2 relative border border-emerald-200/20 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-emerald-100/50 pb-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Invoice_Ramesh.pdf</span>
              </div>
              <p className="leading-relaxed">
                Dear Ramesh, here is your tax invoice of <strong>₹4,042.50</strong> from Varavu Store. Pay instantly: <em>upi.varavu.in/pay</em>
              </p>
              <div className="text-right text-[8px] text-slate-400">11:42 AM ✓✓</div>
            </div>
          </motion.div>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { val: '< 30s', label: 'Per invoice' },
              { val: '4.8★', label: 'User rating' },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-4 text-center border border-white/5">
                <p className="text-2xl font-extrabold text-white">{s.val}</p>
                <p className="text-xs text-emerald-250/60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 bg-[#f8fafc] relative">
        {/* Subtle mesh background on mobile too */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none lg:hidden" />
        
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-[#1a6b3c] flex items-center justify-center shadow-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="font-heading font-black text-xl text-[#1a1d26] tracking-tight">Varavu</span>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] rounded-3xl p-8 sm:p-10">
            <h1 className="text-2xl font-black text-[#1a1d26] tracking-tight mb-1.5">
              Welcome back
            </h1>
            <p className="text-sm text-[#6b7280] mb-8">
              Sign in to your Varavu account
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={!email || !password || loading}
                className="w-full bg-[#1a6b3c] hover:bg-[#155d33] text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-800/10 active:scale-[0.99]"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#6b7280] mt-8">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#1a6b3c] font-bold hover:underline">
                Create one free
              </Link>
            </p>
          </div>

          {/* Bottom Security Badges */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-8 font-semibold uppercase tracking-wider">
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span>Secured by Varavu • SSL Encrypted</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
