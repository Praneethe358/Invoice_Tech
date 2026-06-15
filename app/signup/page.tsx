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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero gradient-hero-mesh relative items-center justify-center p-12">
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="font-heading font-black text-xl text-white">Varavu</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Start invoicing<br />in 2 minutes.
          </h2>
          <p className="text-[#e6f4ea] text-lg leading-relaxed">
            No credit card. No setup fee. Just create an account and start sending invoices on WhatsApp.
          </p>
          <div className="mt-12 flex gap-6 text-emerald-200/60 text-sm">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              No card needed
            </span>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 bg-[#f5f6fa]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[400px]"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-[#1a6b3c] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="font-heading font-black text-lg text-[#1a1d26]">Varavu</span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#1a1d26] mb-1">Create your account</h1>
          <p className="text-sm text-[#6b7280] mb-8">Start sending invoices on WhatsApp</p>

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
              className="w-full bg-[#1a6b3c] text-white font-semibold py-3.5 rounded-xl hover:bg-[#155d33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#6b7280] mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1a6b3c] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
