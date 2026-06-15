'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="url(#whatsappGrad)" />
        <path d="M12 16.5L14.5 19L20 13.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 9L23 11M25 14L27 14M24 22L25 24" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="whatsappGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10b981" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'WhatsApp-Native Delivery',
    description: 'Deliver branded PDF invoices directly to customer WhatsApp chats. Skip printing receipts entirely and save on thermal rolls.',
    tag: 'Popular',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    hoverClass: 'hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-50',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4L6 8V16C6 22 10.5 26.5 16 28C21.5 26.5 26 22 26 16V8L16 4Z" fill="url(#shieldGrad)" />
        <circle cx="16" cy="16" r="6" fill="#fcd34d" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="3" fill="#f59e0b" />
        <defs>
          <linearGradient id="shieldGrad" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'Payment Status Tracking',
    description: 'Mark invoices as Paid, Partially Paid, or Unpaid. Prevent revenue leakage with real-time balance tracking on every receipt.',
    tag: 'Essential',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    hoverClass: 'hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="6" width="22" height="20" rx="3" fill="url(#userGrad)" />
        <circle cx="16" cy="13" r="4" fill="white" fillOpacity="0.4" />
        <path d="M10 22C10 19 12.5 18 16 18C19.5 18 22 19 22 22" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="24" r="5" fill="#a78bfa" stroke="white" strokeWidth="1.5" />
        <line x1="27.5" y1="27.5" x2="30" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="userGrad" x1="5" y1="6" x2="27" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'Customer Directory',
    description: 'Save repeating customer profiles automatically. Search and autocomplete contacts by phone numbers instantly.',
    tag: 'Time Saver',
    color: 'bg-purple-50 text-purple-700 border-purple-100',
    hoverClass: 'hover:border-purple-300 hover:shadow-xl hover:shadow-purple-50',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" fill="url(#pdfGrad)" />
        <path d="M18 2V10H26" fill="#fcd34d" fillOpacity="0.5" />
        <rect x="10" y="14" width="12" height="2" rx="1" fill="white" fillOpacity="0.6" />
        <rect x="10" y="19" width="8" height="2" rx="1" fill="white" fillOpacity="0.6" />
        <circle cx="20" cy="22" r="5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
        <path d="M18.5 22.5L19.5 23.5L22 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="pdfGrad" x1="6" y1="2" x2="26" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'GST-Compliant PDFs',
    description: 'Generate clean, itemized tax tables. Easily add your shop logo, GSTIN, discounts, and payment terms in under 20 seconds.',
    tag: 'Tax Ready',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    hoverClass: 'hover:border-amber-300 hover:shadow-xl hover:shadow-amber-50',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="4" width="16" height="24" rx="3" fill="url(#offlineGrad)" />
        <rect x="11" y="7" width="10" height="14" rx="1" fill="white" fillOpacity="0.9" />
        <circle cx="16" cy="24" r="1.5" fill="white" />
        <path d="M24 16C24 12.6863 26.6863 10 30 10" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 16C8 19.3137 5.3137 22 2 22" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="offlineGrad" x1="8" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'Offline-First Billing',
    description: 'Unreliable internet? No problem. Create invoices and manage stock offline; details sync to Supabase once connection returns.',
    tag: 'Reliable',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    hoverClass: 'hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="url(#reminderGrad)" />
        <path d="M16 8C13.2386 8 11 10.2386 11 13V18L9 20V21H23V20L21 18V13C21 10.2386 18.7614 8 16 8Z" fill="white" fillOpacity="0.4" />
        <path d="M14 23C14 24.1 14.9 25 16 25C17.1 25 18 24.1 18 23" fill="white" />
        <circle cx="24" cy="10" r="5" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
        <path d="M22 10.5L23 11.5L25.5 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="reminderGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f43f5e" />
            <stop offset="1" stopColor="#e11d48" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'One-Tap Reminders',
    description: 'Send professional payment reminders pre-filled with the outstanding balance and your UPI ID directly on WhatsApp.',
    tag: 'Cash Flow',
    color: 'bg-rose-50 text-rose-700 border-rose-100',
    hoverClass: 'hover:border-rose-300 hover:shadow-xl hover:shadow-rose-50',
  },
];

const steps = [
  {
    num: '01',
    title: 'Add Items & Customer',
    desc: 'Select saved items from your catalog and type the customer WhatsApp phone number.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Choose Payment Status',
    desc: 'Mark the bill as Paid, Unpaid, or Partially Paid based on offline UPI/Cash collection.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Deliver instantly',
    desc: 'Uploads the branded PDF receipt and redirects to WhatsApp for immediate delivery.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
  },
];

const industries = [
  {
    name: 'Retail Stores',
    desc: 'Perfect for grocery, apparel, and hardware shops looking to move from paper billbooks to digital WhatsApp receipts.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8L6 22C6 24.2091 7.79086 26 10 26H22C24.2091 26 26 24.2091 26 22L28 8H4Z" fill="url(#retailGrad)" />
        <path d="M8 8V6C8 4.89543 8.89543 4 10 4H22C23.1046 4 24 4.89543 24 6V8" stroke="#10b981" strokeWidth="2" />
        <circle cx="16" cy="17" r="3" fill="white" />
        <defs>
          <linearGradient id="retailGrad" x1="4" y1="4" x2="28" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    name: 'Pharmacies & Chemists',
    desc: 'Quickly detail medicines, autocomplete repeat customers, and add standard tax fields with ease.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="16" height="16" rx="3" fill="url(#pharmGrad)" />
        <path d="M16 6V10M16 26V30M6 16H10M22 16H26" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 18H20M16 14V22" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <defs>
          <linearGradient id="pharmGrad" x1="8" y1="10" x2="24" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f87171" />
            <stop offset="1" stopColor="#dc2626" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    name: 'Restaurants & Cafes',
    desc: 'Send instant digital receipts directly to diners, reducing waiting lines and saving printing costs.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 18H26C26 22.4183 22.4183 26 18 26H14C9.58172 26 6 22.4183 6 18Z" fill="url(#restGrad)" />
        <path d="M8 18V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V18" stroke="#f59e0b" strokeWidth="2" />
        <path d="M24 18V6" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="5" r="1.5" fill="#d97706" />
        <defs>
          <linearGradient id="restGrad" x1="6" y1="4" x2="26" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    name: 'Freelancers & Agencies',
    desc: 'Create quotations, outline service deliverables, and track outstanding balances for client projects.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="url(#freeGrad)" />
        <path d="M12 13.5H16.5C17.8807 13.5 19 14.6193 19 16C19 17.3807 17.8807 18.5 16.5 18.5H12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 13.5V11.5M15 20.5V18.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18.5H18" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="freeGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60a5fa" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
];

const faqs = [
  {
    q: 'Do I need to install an app or software?',
    a: 'No. Varavu Invoice is a progressive web app that runs directly in your browser. You can register and start sending invoices from your phone, tablet, or desktop instantly.',
  },
  {
    q: 'Does WhatsApp delivery require complex API setups?',
    a: 'Not at all. Varavu generates a PDF receipt, formats the WhatsApp text, and opens your WhatsApp client pre-loaded. It takes one tap and does not require saving client contacts.',
  },
  {
    q: 'Can I track outstanding payments and balances?',
    a: 'Yes. You can track whether an invoice is Paid, Partially Paid, or Unpaid. Outstanding balances are displayed on the PDF, and you can send one-tap payment reminders with a pre-filled UPI link.',
  },
  {
    q: 'Does it work offline when my store connection is weak?',
    a: 'Yes. Varavu stores drafted invoices and changes locally. As soon as you get internet coverage back, your data syncs securely with your cloud dashboard.',
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-[#1a1d26]">
      {/* ─── Navbar ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#e8eaed]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a6b3c] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="font-bold text-lg text-[#1a1d26] tracking-tight">
              Varavu
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors"
            >
              FAQ
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-bold text-white bg-[#1a6b3c] hover:bg-[#155d33] px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile Hamburguer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-[#4b5563] hover:text-[#1a1d26] rounded-lg hover:bg-[#f3f4f6] transition-all"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ─── Mobile Sidebar Drawer ───────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />

            {/* Sidebar drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[320px] bg-white shadow-2xl flex flex-col"
            >
              {/* Header inside drawer */}
              <div className="p-4 border-b border-[#e8eaed] flex items-center justify-between bg-[#f9fafb]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1a6b3c] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <span className="font-bold text-[#1a1d26] text-base">Varavu</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[#4b5563] hover:text-[#1a1d26] rounded-lg hover:bg-[#f3f4f6] transition-all"
                  aria-label="Close menu"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links with Icons & Subtexts */}
              <div className="flex-1 px-4 py-6 overflow-y-auto space-y-4">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#f3f4f6] transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#1a6b3c]/8 text-[#1a6b3c] flex items-center justify-center group-hover:bg-[#1a6b3c] group-hover:text-white transition-all shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a1d26]">Features</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">Explore invoicing, catalogs & stats</p>
                  </div>
                </a>

                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#f3f4f6] transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#1a6b3c]/8 text-[#1a6b3c] flex items-center justify-center group-hover:bg-[#1a6b3c] group-hover:text-white transition-all shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a1d26]">How It Works</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">See the 30-second workflow</p>
                  </div>
                </a>

                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#f3f4f6] transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#1a6b3c]/8 text-[#1a6b3c] flex items-center justify-center group-hover:bg-[#1a6b3c] group-hover:text-white transition-all shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a1d26]">FAQ</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">Frequently asked questions</p>
                  </div>
                </a>
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-[#e8eaed] bg-[#f9fafb] flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors py-3 border border-[#e8eaed] bg-white rounded-xl"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center text-sm font-bold text-white bg-[#1a6b3c] hover:bg-[#155d33] py-3 rounded-xl transition-colors shadow-sm"
                >
                  Start Free
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Hero Section ─────────────────────────────────────── */}
      <section className="relative bg-white pt-16 sm:pt-24 pb-16 overflow-hidden border-b border-[#e8eaed]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1a1d26] leading-[1.12] tracking-tight">
                Best WhatsApp Billing Software for Small Business
              </h1>

              <p className="text-lg text-[#6b7280] leading-relaxed max-w-xl">
                Easy WhatsApp billing, manage customer payments, track outstanding balances, control inventory, and simplify accounting with Varavu - Tamil Nadu&apos;s best lightweight billing web app. Start billing free today.
              </p>

              {/* Action Buttons */}
              <div className="pt-2">
                <Link
                  href="/signup"
                  className="inline-block bg-[#1a6b3c] hover:bg-[#155d33] text-white font-extrabold text-lg px-12 py-4.5 rounded-xl transition-all shadow-md hover:shadow-lg shadow-[#1a6b3c]/10"
                >
                  Start Invoicing Free!
                </Link>
              </div>
            </div>

            {/* Right Content - Multi-Device Mockup (Desktop + Phone + Invoice) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[480px] h-[300px] sm:h-[350px] mx-auto flex items-center justify-center">
                {/* Desktop Monitor Mockup */}
                <div className="absolute bottom-6 right-8 w-[80%] h-[70%] bg-[#1e293b] rounded-2xl p-2 shadow-2xl border border-[#334155] flex flex-col justify-between overflow-hidden z-10">
                  {/* Top Bar */}
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-700/50">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <span className="text-[9px] text-slate-400 ml-2 font-mono">dashboard.varavu.in</span>
                  </div>
                  {/* Main Screen Content */}
                  <div className="flex-1 p-2 flex flex-col justify-between space-y-2">
                    <div className="flex justify-between items-center bg-slate-800/80 p-2 rounded-lg border border-slate-700/30">
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-wide text-slate-400 font-bold">Total Sales</span>
                        <h5 className="text-xs font-bold text-white">₹48,930.00</h5>
                      </div>
                      <div className="w-10 h-4 bg-emerald-500/20 text-emerald-400 text-[8px] font-bold flex items-center justify-center rounded">
                        +12% wk
                      </div>
                    </div>
                    {/* Mock chart outline */}
                    <div className="flex-1 bg-slate-800/40 rounded-lg p-2 flex items-end justify-between gap-1 border border-slate-700/25">
                      {[40, 65, 35, 78, 52, 90, 60, 85].map((val, i) => (
                        <div
                          key={i}
                          style={{ height: `${val}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            i === 5 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Bottom Bar */}
                  <div className="h-2.5 bg-slate-850 border-t border-slate-800 flex items-center justify-center">
                    <span className="w-12 h-1 bg-slate-700 rounded-full" />
                  </div>
                </div>

                {/* Monitor Stand/Base */}
                <div className="absolute bottom-1 right-[24%] w-[12%] h-6 bg-[#475569] rounded-t-sm z-0" />
                <div className="absolute bottom-0 right-[15%] w-[30%] h-2 bg-[#64748b] rounded-full z-0" />

                {/* Overlapping Phone Mockup */}
                <div className="absolute top-6 left-2 w-[28%] h-[78%] bg-[#090d16] rounded-[24px] p-1 shadow-2xl border border-slate-800 z-30 flex flex-col justify-between overflow-hidden">
                  {/* Ear Piece/Notch */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-[#090d16] rounded-full z-40" />
                  
                  {/* Screen Content */}
                  <div className="flex-1 bg-[#15803d] rounded-[22px] p-2 flex flex-col justify-between text-white overflow-hidden relative">
                    {/* Top Status */}
                    <div className="flex justify-between items-center text-[7px] font-medium pt-1 opacity-90">
                      <span>9:41</span>
                      <div className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        <span className="w-2.5 h-1.5 bg-white rounded-sm" />
                      </div>
                    </div>

                    {/* Chat Bubble */}
                    <div className="flex-1 flex flex-col justify-end space-y-2 pb-2">
                      <div className="bg-emerald-900/40 p-1.5 rounded-lg border border-emerald-800/30 text-[8px] max-w-[90%] self-end">
                        <span className="font-bold block text-emerald-300">Varavu Invoice</span>
                        Here is your PDF receipt for ₹670.00.
                      </div>
                      <div className="bg-white text-slate-800 p-1.5 rounded-lg text-[8px] max-w-[90%] self-start shadow-sm font-medium">
                        Thank you, received!
                      </div>
                    </div>

                    {/* Action Send Button */}
                    <div className="bg-[#16a34a] py-1 text-center rounded-lg text-[9px] font-bold shadow-sm">
                      Delivered ✓
                    </div>
                  </div>
                </div>

                {/* Floating Invoice PDF sheet */}
                <div className="absolute -top-4 right-2 w-[35%] h-[72%] bg-white rounded-lg p-2.5 shadow-xl border border-slate-200 z-20 rotate-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                      <span className="text-[8px] font-extrabold text-[#1a6b3c]">TAX INVOICE</span>
                      <span className="text-[6px] text-slate-400">#INV-2849</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[7px] text-slate-800 font-bold border-b border-slate-50 pb-0.5">
                        <span>Items</span>
                        <span>Amt</span>
                      </div>
                      <div className="flex justify-between text-[6px] text-slate-500">
                        <span>Ponni Rice</span>
                        <span>₹340.00</span>
                      </div>
                      <div className="flex justify-between text-[6px] text-slate-500">
                        <span>Toor Dal</span>
                        <span>₹145.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-1.5 flex justify-between items-center">
                    <span className="text-[7px] font-bold text-slate-800">Total</span>
                    <span className="text-[7px] font-extrabold text-emerald-700">₹485.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Below Qualities (Sub-Hero Bar) ───────────────────── */}
      <section className="bg-white border-b border-[#e8eaed] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center items-start">
            {/* Quality 1 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="text-[#1a6b3c] flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none" stroke="#1a6b3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="16" cy="16" r="13" />
                  <path d="M11 14a2 2 0 0 1 4 0" />
                  <path d="M17 14a2 2 0 0 1 4 0" />
                  <path d="M11 18c0 3 2.5 5 5 5s5-2 5-5H11z" fill="#1a6b3c" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-[#1a1d26]">
                  1.5 Lakh<span className="text-[#1a6b3c]">+</span>
                </h4>
                <p className="text-xs text-[#6b7280] font-semibold mt-0.5">Happy Shop Owners</p>
              </div>
            </div>

            {/* Quality 2 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="text-[#1a6b3c] flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none" stroke="#1a6b3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="4" width="14" height="24" rx="3" />
                  <line x1="9" y1="8" x2="23" y2="8" />
                  <line x1="9" y1="24" x2="23" y2="24" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-[#1a1d26]">Free</h4>
                <p className="text-xs text-[#6b7280] font-semibold mt-0.5">Web &amp; PWA App</p>
              </div>
            </div>

            {/* Quality 3 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="text-[#1a6b3c] flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none" stroke="#1a6b3c" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                  <path d="M8 4L24 16L8 28V4Z" />
                  <path d="M8 4L19 16L8 28" />
                  <path d="M19 16L8 16" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-[#1a1d26]">
                  Rated 4.9<span className="text-[#1a6b3c]">/5</span>
                </h4>
                <p className="text-xs text-[#6b7280] font-semibold mt-0.5">User Satisfaction</p>
              </div>
            </div>

            {/* Quality 4 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="text-[#1a6b3c] flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none" stroke="#1a6b3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="10" y="6" width="18" height="13" rx="2" />
                  <path d="M16 19v4m-3 0h6" />
                  <rect x="4" y="11" width="7" height="12" rx="1" fill="white" />
                  <line x1="4" y1="14" x2="11" y2="14" />
                  <line x1="4" y1="20" x2="11" y2="20" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-[#1a1d26]">
                  Multi-<span className="text-[#1a6b3c]">Device</span>
                </h4>
                <p className="text-xs text-[#6b7280] font-semibold mt-0.5">Use on Mobile/Desktop</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Capabilities Grid Section ────────────────────────── */}
      <section id="features" className="py-20 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#1a6b3c] uppercase tracking-widest mb-3">Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#1a1d26] tracking-tight">
              A lightweight billing system tailored to your daily shop operations
            </h3>
            <p className="text-sm text-[#4b5563] mt-3">
              Varavu replaces heavy, expensive desktop software with an instant billing tool you can use directly from your smartphone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className={`bg-white p-6 rounded-2xl border border-[#e8eaed] transition-all flex flex-col justify-between group ${feat.hoverClass}`}
              >
                <div>
                  <div className={`w-14 h-14 rounded-xl ${feat.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
                    {feat.icon}
                  </div>
                  <h4 className="text-lg font-bold text-[#1a1d26] mb-2 flex items-center gap-2">
                    {feat.title}
                    {feat.tag && (
                      <span className="text-[10px] bg-[#1a6b3c]/8 text-[#1a6b3c] font-semibold px-2 py-0.5 rounded">
                        {feat.tag}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-[#4b5563] leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#e8eaed]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#1a6b3c] uppercase tracking-widest mb-3">Workflow</h2>
            <h3 className="text-3xl font-extrabold text-[#1a1d26] tracking-tight">
              Create and share bills in three simple steps
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="text-center space-y-4 relative">
                {/* Horizontal dotted connector on desktop */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 left-[65%] w-[70%] border-t-2 border-dashed border-[#e2e8f0] -z-0" />
                )}

                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#1a6b3c]/8 text-[#1a6b3c] z-10 shadow-inner">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#1a6b3c] text-white text-xs font-extrabold flex items-center justify-center shadow-md border-2 border-white">
                    {step.num}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#1a1d26] pt-2">{step.title}</h4>
                <p className="text-sm text-[#4b5563] leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Industry Solutions ───────────────────────────────── */}
      <section className="py-20 bg-[#f8fafc] border-b border-[#e8eaed]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#1a6b3c] uppercase tracking-widest mb-3">Sectors</h2>
            <h3 className="text-3xl font-extrabold text-[#1a1d26] tracking-tight">
              Built for businesses across Tamil Nadu
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {industries.map((ind, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-[#e8eaed] flex gap-5 hover:shadow-md hover:border-[#1a6b3c]/20 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#fafafa] flex items-center justify-center shrink-0 shadow-sm border border-neutral-100 group-hover:scale-105 transition-transform">
                  {ind.icon}
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-[#1a1d26] group-hover:text-[#1a6b3c] transition-colors">{ind.name}</h4>
                  <p className="text-sm text-[#4b5563] leading-relaxed">{ind.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ──────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-[#1a6b3c] uppercase tracking-widest mb-3">FAQ</h2>
            <h3 className="text-3xl font-extrabold text-[#1a1d26] tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-[#e8eaed] rounded-xl overflow-hidden bg-[#fafbfc] transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center gap-4 bg-white hover:bg-[#fafbfc]"
                  >
                    <span className="font-bold text-sm text-[#1a1d26]">{faq.q}</span>
                    <svg
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      className={`text-[#4b5563] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-5 pt-2 text-xs text-[#4b5563] leading-relaxed border-t border-[#e8eaed]/65 bg-[#fcfdfe]">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Call to Action (CTA) ─────────────────────────────── */}
      <section className="py-20 bg-[#f8fafc] border-t border-[#e8eaed]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Boost your billing speed and collections today
          </h2>
          <p className="text-base text-[#4b5563] max-w-lg mx-auto">
            Join other shop owners in Tamil Nadu saving time and paperwork with Varavu Invoice. Free setup.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#1a6b3c] hover:bg-[#155d33] text-white font-bold text-base px-10 py-4 rounded-xl transition-all shadow-md hover:shadow-lg shadow-[#1a6b3c]/10"
            >
              Get Started Free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#e8eaed] text-sm text-[#4b5563]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-[#e8eaed]">
            {/* Logo/Info column */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#1a6b3c] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <span className="font-bold text-base text-[#1a1d26]">Varavu Invoice</span>
              </div>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                Simple, lightweight billing software designed for small businesses, supermarkets, and freelancers in Tamil Nadu.
              </p>
            </div>

            {/* Product column */}
            <div className="space-y-3">
              <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-[#1a1d26] transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-[#1a1d26] transition-colors">How it Works</a></li>
                <li><Link href="/login" className="hover:text-[#1a1d26] transition-colors">Sandbox Login</Link></li>
                <li><Link href="/signup" className="hover:text-[#1a1d26] transition-colors">Create Account</Link></li>
              </ul>
            </div>

            {/* Resources column */}
            <div className="space-y-3">
              <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#faq" className="hover:text-[#1a1d26] transition-colors">FAQ</a></li>
                <li><span className="text-[#9ca3af]">A4 PDF Format</span></li>
                <li><span className="text-[#9ca3af]">A5 PDF Format</span></li>
                <li><span className="text-[#9ca3af]">Tax Calculator</span></li>
              </ul>
            </div>

            {/* Address column */}
            <div className="space-y-3">
              <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">HQ Address</h4>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                Varavu Technologies Ltd.<br />
                Varthur Hobli, Bengaluru,<br />
                Karnataka 560103
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-xs text-[#6b7280] gap-4">
            <div>
              © {new Date().getFullYear()} Varavu. All rights reserved.
            </div>
            <div className="flex gap-4">
              <span>Made in India 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
