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
  const [showPassword, setShowPassword] = useState(false);
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
      {/* DESKTOP LAYOUT (lg:flex) */}
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
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 rounded-full bg-blue-500/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-md w-full">
          <div className="flex items-center gap-3 mb-8">
            <img src="/trubill-logo.png" alt="TruBill Logo" className="w-10 h-10 object-contain brightness-0 invert" />
            <span className="font-heading font-black text-xl">
              <span className="text-white">Tru</span>
              <span style={{ color: '#93c5fd' }}>Bill</span>
            </span>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Invoice <span className="bg-gradient-to-r from-blue-200 to-blue-400 bg-clip-text text-transparent">smarter</span>,<br />not harder.
          </h2>
          <p className="text-[#e6efff]/80 text-base leading-relaxed">
            Professional WhatsApp invoicing built for supermarkets, retail shops, and freelancers.
          </p>
        </div>
      </div>

      {/* Right — Login form (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-4 py-8 bg-[#f8fafc] bg-[radial-gradient(circle_at_top_right,rgba(0,80,232,0.06),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(0,80,232,0.04),transparent_45%)] relative overflow-hidden">
        {/* Glow backdrop for glassmorphism */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-[#0050e8]/15 to-blue-500/10 blur-[70px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[430px] relative z-10"
        >
          <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] rounded-[30px] p-6 sm:p-10">
            {/* Logo inside login section */}
            <div className="flex items-center gap-2.5 mb-6">
              <img src="/trubill-logo.png" alt="TruBill Logo" className="w-8 h-8 object-contain shrink-0" />
              <span className="font-heading font-black text-xl tracking-tight">
                <span className="text-[#001048]">Tru</span>
                <span className="text-[#0050e8]">Bill</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1d26] tracking-tight mb-1.5">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-[#6b7280] mb-6 sm:mb-8 font-medium">
              Sign in to your TruBill account
            </p>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#1a1d26] mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#0050e8] focus:ring-2 focus:ring-[#0050e8]/15"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#1a1d26] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#0050e8] focus:ring-2 focus:ring-[#0050e8]/15"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0050e8] to-[#3b82f6] hover:from-[#0043c4] hover:to-[#2563eb] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.99] mt-2 text-xs sm:text-sm"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs sm:text-sm text-[#6b7280] mt-6 sm:mt-8 font-medium">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#0050e8] font-bold hover:underline">
                Create one free
              </Link>
            </p>
          </div>

          {/* Bottom Security Badges */}
          <div className="flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-[#8a99ad] mt-6 font-bold uppercase tracking-wider">
            <svg className="w-3.5 h-3.5 text-[#aebecf]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Secured by TruBill • SSL Encrypted</span>
          </div>
        </motion.div>
      </div>

      {/* MOBILE LAYOUT (lg:hidden) */}
      <div className="lg:hidden w-full min-h-screen flex flex-col bg-[#0050e8]">
        {/* Top Header Section */}
        <div className="pt-12 pb-8 px-6 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-3">
            <img src="/trubill-logo.png" alt="TruBill Logo" className="w-7 h-7 object-contain brightness-0 invert" />
            <span className="font-heading font-black text-2xl tracking-tight text-white">
              TruBill
            </span>
          </div>
          {/* Slogan */}
          <p className="text-[#e6efff] text-xs font-semibold max-w-[280px] leading-relaxed">
            GST Invoicing made simple for Tamil Nadu retail.
          </p>
        </div>

        {/* Card Section */}
        <div className="flex-1 bg-white rounded-t-[32px] px-6 pt-7 pb-10 flex flex-col justify-between shadow-[0_-12px_24px_rgba(0,0,0,0.08)]">
          <div className="w-full max-w-[430px] mx-auto space-y-5">
            {/* Back Home Link */}
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-[#0050e8] font-bold text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Home
            </Link>

            {/* Title / Subtitle */}
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-[#1a1d26]">
                Welcome back
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Sign in to your account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-250 bg-slate-50/50 pr-10 pl-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#0050e8] focus:bg-white focus:ring-4 focus:ring-[#0050e8]/5"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-250 bg-slate-50/50 pl-10 pr-10 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#0050e8] focus:bg-white focus:ring-4 focus:ring-[#0050e8]/5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.99] mt-2 text-sm"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Secure Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom text */}
            <p className="text-center text-xs text-slate-500 font-medium">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#0050e8] font-bold hover:underline">
                Create one free.
              </Link>
            </p>
          </div>

          {/* Footer Security logo */}
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 mt-8 font-bold uppercase tracking-wider">
            <svg className="w-3.5 h-3.5 text-slate-450" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span>Secured by TruBill • SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

