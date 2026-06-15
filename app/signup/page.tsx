'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/Input';
import { useToast } from '@/components/Toast';
import { validateSignup } from '@/lib/validators';

export default function SignupPage() {
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateSignup({ email, password, shop_name: shopName });
    if (validationError) { showToast(validationError, 'error'); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(), password,
      });
      if (authError) { showToast(authError.message, 'error'); setLoading(false); return; }
      if (!authData.user) { showToast('Signup failed.', 'error'); setLoading(false); return; }

      const { error: shopError } = await supabase.from('shops').insert({
        auth_user_id: authData.user.id,
        name: shopName.trim(),
        address: address.trim() || null,
      });
      if (shopError) {
        showToast('Account created but shop setup failed.', 'error');
        setLoading(false); return;
      }

      showToast('Account created!', 'success');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Signup failed', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Left panel */}
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
            Start invoicing<br />in <span className="bg-gradient-to-r from-emerald-400 to-[#10b981] bg-clip-text text-transparent">2 minutes</span>.
          </h2>
          <p className="text-[#e6f4ea]/80 text-base leading-relaxed">
            No credit card required. No setup fee. Just create an account and start sending bills on WhatsApp.
          </p>

          {/* Floating Glassmorphic Verification Card */}
          <motion.div
            initial={{ y: 20, opacity: 0, rotate: 2 }}
            animate={{ y: [0, 10, 0], opacity: 1, rotate: [2, 1, 2] }}
            transition={{ 
              opacity: { duration: 0.6 },
              y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 9, ease: "easeInOut" }
            }}
            className="mt-10 p-5 rounded-2xl glass-card border border-white/10 shadow-2xl relative max-w-sm mx-auto lg:mx-0 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-[11.5px] font-bold text-white leading-none">Shop Registered!</p>
              <p className="text-[9.5px] text-emerald-350 font-semibold mt-1">Free plan activated instantly</p>
            </div>
          </motion.div>

          <div className="mt-10 flex gap-6 text-emerald-250/60 text-xs font-semibold">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              No card needed
            </span>
          </div>
        </div>
      </div>

      {/* Right — Form */}
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
            <h1 className="text-2xl font-black text-[#1a1d26] tracking-tight mb-1.5">Create your account</h1>
            <p className="text-sm text-[#6b7280] mb-6">Start sending invoices on WhatsApp</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Shop Name"
                placeholder="e.g. Sri Lakshmi Stores"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
              />
              <Input
                label="Shop Address"
                placeholder="e.g. 12, Anna Nagar, Chennai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="submit"
                disabled={!shopName || !email || !password || loading}
                className="w-full bg-[#1a6b3c] hover:bg-[#155d33] text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-800/10 active:scale-[0.99] mt-2"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-emerald-250" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#6b7280] mt-8">
              Already have an account?{' '}
              <Link href="/login" className="text-[#1a6b3c] font-bold hover:underline">
                Sign in
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
