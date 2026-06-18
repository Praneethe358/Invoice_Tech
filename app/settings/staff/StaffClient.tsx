'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { Staff } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/permissions';

interface Props {
  staff: Staff[];
  ownerName: string;
  shopName: string;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  admin: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  billing_staff: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  view_only: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

const AVATAR_COLORS: Record<string, string> = {
  admin: 'bg-green-500',
  billing_staff: 'bg-[#0050e8]',
  view_only: 'bg-gray-400',
};

export default function StaffClient({ staff: initialStaff, ownerName, shopName }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'billing_staff' | 'view_only'>('billing_staff');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedName, setGeneratedName] = useState('');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStaff((prev) => [...prev, data.staff]);
      const baseUrl = window.location.origin;
      setGeneratedLink(`${baseUrl}${data.inviteUrl}`);
      setGeneratedName(inviteName.trim());
      setInviteName('');
      setInviteEmail('');
      setInviteRole('billing_staff');
      showToast(`Invite link generated for ${inviteName.trim()}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to invite staff', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditRole = async (staffId: string) => {
    try {
      const res = await fetch(`/api/staff/${staffId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, role: editRole as any } : s)));
      setEditingRoleId(null);
      showToast(`Role updated to ${ROLE_LABELS[editRole as keyof typeof ROLE_LABELS]}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleDeactivate = async (staffId: string) => {
    try {
      const res = await fetch(`/api/staff/${staffId}/deactivate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, status: 'deactivated' } : s)));
      setConfirmDeactivateId(null);
      showToast('Staff member deactivated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate', 'error');
    }
  };

  const handleReactivate = async (staffId: string) => {
    try {
      const res = await fetch(`/api/staff/${staffId}/reactivate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, status: s.auth_user_id ? 'active' : 'invited' } : s)));
      showToast('Staff member reactivated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reactivate', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied! Share this with ${generatedName}`, 'success');
  };

  const daysSince = (dateStr: string | null) => {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-24">
        {/* Desktop Header */}
        <div className="hidden md:flex bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-xs items-center justify-between mb-6 md:sticky md:top-0 md:z-30">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Team Members</h1>
            <p className="text-[10px] text-[#6b7280] font-medium mt-0.5">Add staff who help run your shop</p>
          </div>
          <button
            onClick={() => { setShowInviteForm(!showInviteForm); setGeneratedLink(null); }}
            className="bg-[#0050e8] hover:bg-[#0043c4] text-white px-5 py-2.5 text-xs font-bold rounded-none transition-colors inline-flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Invite Staff
          </button>
        </div>

        {/* Mobile Header */}
        <div className="mb-6 md:hidden flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">Team Members</h1>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Add staff who help run your shop</p>
          </div>
          <button
            onClick={() => { setShowInviteForm(!showInviteForm); setGeneratedLink(null); }}
            className="bg-[#0050e8] text-white p-2.5 rounded-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Invite Form */}
        <AnimatePresence>
          {showInviteForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white border border-[#e5e7eb] p-6 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-gray-900">Invite a New Team Member</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Name</label>
                    <input
                      type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Ravi Kumar"
                      className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2.5 px-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input
                      type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="ravi@example.com"
                      className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2.5 px-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8]"
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-2">Role</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {([
                      { key: 'admin', label: 'Admin', desc: 'Full access except shop owner settings' },
                      { key: 'billing_staff', label: 'Billing Staff', desc: 'Create invoices, record payments, view customers and catalog' },
                      { key: 'view_only', label: 'View Only', desc: 'Read-only access to dashboard and reports' },
                    ] as const).map((r) => (
                      <button
                        key={r.key}
                        onClick={() => setInviteRole(r.key)}
                        className={`text-left p-4 border rounded-none transition-all ${
                          inviteRole === r.key
                            ? 'border-[#0050e8] bg-[#0050e8]/5 ring-1 ring-[#0050e8]'
                            : 'border-[#e5e7eb] hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${inviteRole === r.key ? 'border-[#0050e8]' : 'border-gray-300'}`}>
                            {inviteRole === r.key && <div className="w-2 h-2 rounded-full bg-[#0050e8]" />}
                          </div>
                          <span className="text-xs font-bold text-gray-900">{r.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 ml-6">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleInvite}
                    disabled={inviteLoading}
                    className="bg-[#0050e8] hover:bg-[#0043c4] text-white px-6 py-2.5 text-xs font-bold rounded-none transition-colors disabled:opacity-50"
                  >
                    {inviteLoading ? 'Generating...' : 'Generate Invite Link'}
                  </button>
                  <button
                    onClick={() => { setShowInviteForm(false); setGeneratedLink(null); }}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>

                {/* Generated Link */}
                {generatedLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 p-4 space-y-2"
                  >
                    <p className="text-xs font-bold text-green-800">✅ Invite link generated!</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[10px] font-mono bg-white border border-green-200 px-3 py-2 truncate text-gray-800">
                        {generatedLink}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generatedLink)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-[10px] font-bold rounded-none shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[9px] text-green-600">Share this link with {generatedName} via WhatsApp</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Owner Row */}
        <div className="bg-white border border-[#e5e7eb] p-4 mb-2 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#0050e8] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {ownerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{ownerName} <span className="text-[#0050e8]">(You)</span></p>
            <p className="text-[10px] text-gray-500 font-medium">Shop Owner · Full access</p>
          </div>
          <span className="inline-flex items-center text-[9px] font-bold px-2.5 py-1 rounded-none uppercase bg-[#0050e8]/10 text-[#0050e8] border border-[#0050e8]/20">
            Owner
          </span>
        </div>

        {/* Staff List */}
        {staff.length === 0 ? (
          <EmptyState
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            title="No team members yet"
            description="Invite billing staff to help create invoices."
            actionLabel="Invite Staff"
            onAction={() => setShowInviteForm(true)}
          />
        ) : (
          <div className="space-y-2">
            {staff.map((member) => {
              const colors = ROLE_COLORS[member.role] || ROLE_COLORS.view_only;
              const avatarColor = AVATAR_COLORS[member.role] || 'bg-gray-400';
              const isDeactivated = member.status === 'deactivated';
              const isInvited = member.status === 'invited';

              return (
                <div
                  key={member.id}
                  className={`bg-white border p-4 shadow-xs transition-all ${
                    isDeactivated
                      ? 'border-gray-200 opacity-60'
                      : isInvited
                      ? 'border-dashed border-amber-300'
                      : 'border-[#e5e7eb]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium truncate">{member.email}</p>
                      {isInvited && (
                        <p className="text-[9px] text-amber-600 font-bold mt-0.5">
                          ⏳ Invite Pending · Sent {daysSince(member.invite_sent_at)} day{daysSince(member.invite_sent_at) !== 1 ? 's' : ''} ago
                        </p>
                      )}
                      {member.status === 'active' && member.joined_at && (
                        <p className="text-[9px] text-green-600 font-bold mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Active since {new Date(member.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      {isDeactivated && (
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5">Deactivated</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-none uppercase ${colors.bg} ${colors.text} border border-current/10`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {ROLE_LABELS[member.role]}
                      </span>

                      {member.status === 'active' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setEditingRoleId(member.id); setEditRole(member.role); }}
                            className="text-[10px] font-bold text-[#0050e8] hover:underline"
                          >
                            Edit Role
                          </button>
                          {confirmDeactivateId === member.id ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold">
                              <button onClick={() => handleDeactivate(member.id)} className="text-red-600 hover:underline">Yes</button>
                              <span className="text-gray-300">|</span>
                              <button onClick={() => setConfirmDeactivateId(null)} className="text-gray-500">No</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeactivateId(member.id)}
                              className="text-[10px] font-bold text-red-500 hover:underline"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      )}

                      {isDeactivated && (
                        <button
                          onClick={() => handleReactivate(member.id)}
                          className="text-[10px] font-bold text-[#0050e8] hover:underline"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Edit Role */}
                  <AnimatePresence>
                    {editingRoleId === member.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-dashed border-gray-200"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          {(['admin', 'billing_staff', 'view_only'] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => setEditRole(r)}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-none border transition-all ${
                                editRole === r
                                  ? 'border-[#0050e8] bg-[#0050e8]/10 text-[#0050e8]'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {ROLE_LABELS[r]}
                            </button>
                          ))}
                          <button
                            onClick={() => handleEditRole(member.id)}
                            className="bg-[#0050e8] text-white px-4 py-1.5 text-[10px] font-bold rounded-none"
                          >
                            Save Role
                          </button>
                          <button
                            onClick={() => setEditingRoleId(null)}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </PageTransition>
    </div>
  );
}
