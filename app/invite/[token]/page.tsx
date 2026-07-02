'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ROLE_LABELS } from '@/lib/permissions';
import type { UserRole } from '@/lib/permissions';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{
    staff: { id: string; name: string; email: string; role: string };
    shop: { name: string };
    ownerName: string;
  } | null>(null);

  const [mode, setMode] = useState<'choice' | 'create' | 'signin'>('choice');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    params.then(async (p) => {
      setToken(p.token);
      try {
        const res = await fetch(`/api/invite/${p.token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
        } else {
          setInviteData(data);
          setName(data.staff.name);
          setEmail(data.staff.email);
        }
      } catch {
        setError('Failed to validate invite');
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  const handleCreateAccount = async () => {
    setSubmitError(null);
    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error);
        return;
      }

      // Sign in with the new credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: inviteData!.staff.email,
        password,
      });

      if (signInError) {
        setSubmitError('Account created but sign-in failed. Try logging in manually.');
        return;
      }

      router.push('/dashboard');
    } catch {
      setSubmitError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    setSubmitError(null);
    if (!email || !signinPassword) {
      setSubmitError('Email and password are required');
      return;
    }

    setSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: signinPassword,
      });

      if (signInError) {
        setSubmitError(signInError.message);
        return;
      }

      // Link the auth user to the staff record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubmitError('Authentication failed');
        return;
      }

      // Accept invite via API
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password: signinPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || 'Failed to accept invite');
        return;
      }

      router.push('/dashboard');
    } catch {
      setSubmitError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <p className="text-sm font-bold text-gray-500">Validating invite link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-4">
        <div className="bg-white border border-[#e5e7eb] p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-xs text-gray-500 mb-6">{error}</p>
          <a href="/login" className="bg-[#0050e8] text-white px-6 py-2.5 text-xs font-bold rounded-none">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (!inviteData) return null;

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-[#e5e7eb] max-w-md w-full shadow-xs">
        {/* Header */}
        <div className="bg-[#0050e8] p-6 text-white text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 className="text-lg font-bold">You&apos;re Invited!</h1>
          <p className="text-xs text-blue-200 mt-1">
            <span className="font-bold text-white">{inviteData.shop.name}</span> has invited you to join TruBill
          </p>
        </div>

        <div className="p-6">
          {/* Invite Details */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] p-4 mb-6 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Role</span>
              <span className="font-bold text-gray-900">{ROLE_LABELS[inviteData.staff.role as UserRole]}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Email</span>
              <span className="font-bold text-gray-900">{inviteData.staff.email}</span>
            </div>
          </div>

          {mode === 'choice' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white py-3 text-sm font-bold rounded-none transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={() => setMode('signin')}
                className="w-full bg-white border border-[#e5e7eb] hover:bg-gray-50 text-gray-900 py-3 text-sm font-bold rounded-none transition-colors"
              >
                Sign In with Existing Account
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2.5 px-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8]" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2.5 pl-3 pr-10 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2.5 pl-3 pr-10 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8]" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {submitError && <p className="text-xs text-red-600 font-bold">{submitError}</p>}

              <button
                onClick={handleCreateAccount}
                disabled={submitting}
                className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white py-3 text-sm font-bold rounded-none transition-colors disabled:opacity-50"
              >
                {submitting ? 'Creating Account...' : 'Join Team'}
              </button>
              <button onClick={() => setMode('choice')} className="w-full text-xs font-bold text-gray-500 hover:text-gray-700 py-2">
                Back
              </button>
            </div>
          )}

          {mode === 'signin' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2.5 px-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8]" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Password</label>
                <div className="relative">
                  <input type={showSigninPassword ? 'text' : 'password'} value={signinPassword} onChange={(e) => setSigninPassword(e.target.value)}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2.5 pl-3 pr-10 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8]" />
                  <button
                    type="button"
                    onClick={() => setShowSigninPassword(!showSigninPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSigninPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {submitError && <p className="text-xs text-red-600 font-bold">{submitError}</p>}

              <button
                onClick={handleSignIn}
                disabled={submitting}
                className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white py-3 text-sm font-bold rounded-none transition-colors disabled:opacity-50"
              >
                {submitting ? 'Signing In...' : 'Sign In & Join Team'}
              </button>
              <button onClick={() => setMode('choice')} className="w-full text-xs font-bold text-gray-500 hover:text-gray-700 py-2">
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
