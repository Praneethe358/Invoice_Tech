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
            <stop stopColor="#0060f0" />
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
    highlights: ['Instant PDF Sharing', 'Custom GST Billing', 'Offline Bill Drafts'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8L6 22C6 24.2091 7.79086 26 10 26H22C24.2091 26 26 24.2091 26 22L28 8H4Z" fill="url(#retailGrad)" />
        <path d="M8 8V6C8 4.89543 8.89543 4 10 4H22C23.1046 4 24 4.89543 24 6V8" stroke="#0060f0" strokeWidth="2" />
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
    highlights: ['Expiry Tracking', 'Quick Search', 'Tax Code Presets'],
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
    highlights: ['Table-wise Billing', 'KOT Printing', 'Zero Paper Cost'],
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
    highlights: ['Quotations & Estimates', 'One-click Reminders', 'UPI Pre-fill'],
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
    a: 'No. TruBill Invoice is a progressive web app that runs directly in your browser. You can register and start sending invoices from your phone, tablet, or desktop instantly.',
  },
  {
    q: 'Does WhatsApp delivery require complex API setups?',
    a: 'Not at all. TruBill generates a PDF receipt, formats the WhatsApp text, and opens your WhatsApp client pre-loaded. It takes one tap and does not require saving client contacts.',
  },
  {
    q: 'Can I track outstanding payments and balances?',
    a: 'Yes. You can track whether an invoice is Paid, Partially Paid, or Unpaid. Outstanding balances are displayed on the PDF, and you can send one-tap payment reminders with a pre-filled UPI link.',
  },
  {
    q: 'Does it work offline when my store connection is weak?',
    a: 'Yes. TruBill stores drafted invoices and changes locally. As soon as you get internet coverage back, your data syncs securely with your cloud dashboard.',
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [simulatorStep, setSimulatorStep] = useState(0);
  const [activeSector, setActiveSector] = useState(0);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatorStep((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSector((prev) => (prev + 1) % 4);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-page min-h-screen bg-[#f5f6fa] text-[#1a1d26]">
      {/* ─── Navbar ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 w-full">
        {/* Dark Top Strip (Navy Blue matching logo) */}
        <div className="bg-[#001048] h-1 w-full" />
        
        <nav className="bg-white/95 backdrop-blur-xl border-b border-[#e8eaed]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 md:h-24 flex items-center justify-between">
            
            {/* Desktop Left: Logo */}
            <Link href="/" className="hidden md:flex items-center gap-3">
              <img src="/trubill-logo.png" alt="TruBill Logo" className="w-14 h-14 object-contain shrink-0" />
              <span className="font-heading font-black text-2xl tracking-tight">
                <span className="text-[#001048]">Tru</span>
                <span className="text-[#0050e8]">Bill</span>
              </span>
            </Link>

            {/* Mobile Left: Hamburger + Logo (aligned left) */}
            <div className="flex md:hidden items-center gap-3">
              {/* Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#4b5563] hover:text-[#1a1d26] rounded-lg hover:bg-[#f3f4f6] transition-all"
                aria-label="Toggle menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {mobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>

              {/* Logo next to Hamburger */}
              <Link href="/" className="flex items-center gap-2">
                <img src="/trubill-logo.png" alt="TruBill Logo" className="w-12 h-12 object-contain shrink-0" />
                <span className="font-heading font-black text-xl tracking-tight">
                  <span className="text-[#001048]">Tru</span>
                  <span className="text-[#0050e8]">Bill</span>
                </span>
              </Link>
            </div>

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
              className="text-sm font-bold text-white bg-[#0050e8] hover:bg-[#0043c4] px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile Right: Login */}
          <div className="flex md:hidden items-center">
            <Link
              href="/login"
              className="text-xs font-bold text-[#0050e8] border border-[#0050e8]/20 bg-emerald-50/50 hover:bg-emerald-50 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>
    </div>

      {/* ─── Mobile Dropdown Overlay (Vyapar Style) ────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay below header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-14 md:top-16 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />

            {/* Dropdown container */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-14 md:top-16 left-0 right-0 z-50 w-full bg-white border-b border-[#e8eaed] shadow-2xl flex flex-col md:hidden overflow-y-auto max-h-[calc(100vh-56px)] md:max-h-[calc(100vh-64px)]"
            >
              {/* Vertical Links */}
              <div className="flex flex-col space-y-3 px-5 pt-4">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  FAQ
                </a>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  Login
                </Link>
              </div>

              {/* Description Text */}
              <div className="px-5 pt-4">
                <p className="text-[11px] text-[#6b7280] leading-relaxed">
                  Easy WhatsApp billing, manage customer payments, track outstanding balances, control inventory, and simplify accounting with TruBill - Tamil Nadu&apos;s best lightweight billing software. Start billing free today.
                </p>
              </div>

              {/* Download / Start Free Action Button */}
              <div className="px-5 py-4 pb-6">
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full bg-[#0050e8] hover:bg-[#0043c4] text-white text-center font-extrabold text-sm py-3 px-4 rounded-xl transition-colors shadow-sm"
                >
                  Start Billing Free Now!
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Hero Section ─────────────────────────────────────── */}
      <section className="relative bg-[#fafbfe] pt-8 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 lg:pb-20 overflow-hidden border-b border-[#e8eaed]">
        {/* Modern radial mesh gradient backgrounds for depth */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[5%] w-[45%] aspect-square rounded-full bg-emerald-100/30 blur-[120px]" />
          <div className="absolute bottom-[20%] right-[5%] w-[40%] aspect-square rounded-full bg-[#0050e8]/5 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-center">
            {/* Left Content (Centered on mobile, left-aligned on desktop) */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5 sm:space-y-6">

              {/* MOBILE MOCKUP: Small, premium smartphone frame + switcher above the heading (visible only on mobile) */}
              <div className="block lg:hidden w-full flex flex-col items-center mb-2">
                {/* Smaller interactive smartphone frame */}
                <div className="relative w-full max-w-[150px] aspect-[9/18.3] mx-auto select-none mb-4">
                  {/* Background glow behind phone mockup */}
                  <div className="absolute inset-[-10px] bg-emerald-500/10 blur-xl rounded-[36px] -z-10" />
                  
                  {/* Internal Smartphone frame */}
                  <div className="w-full h-full bg-[#0b0f19] rounded-[36px] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.25)] border-[2.5px] border-slate-800 relative overflow-hidden flex flex-col">
                    {/* Smartphone Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-[#0b0f19] rounded-b-xl z-20 flex items-center justify-center">
                      <div className="w-5 h-0.5 bg-slate-800 rounded-full mb-0.5" />
                    </div>
                    
                    {/* Internal Screen Content */}
                    <div className="bg-[#f8fafc] h-full rounded-[26px] overflow-hidden flex flex-col border border-slate-950/5 relative">
                      {/* App Header */}
                      <div className="bg-[#0050e8] text-white p-2 pt-4 pb-2 flex justify-between items-center shadow-xs shrink-0">
                        <div className="flex items-center gap-1">
                          <div className="w-3.5 h-3.5 rounded bg-white/15 flex items-center justify-center">
                            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            </svg>
                          </div>
                          <span className="font-extrabold text-[9px] tracking-tight">TruBill</span>
                        </div>
                        <span className="text-[5.5px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">TN</span>
                      </div>

                      {/* Simulated Screen Body Content */}
                      <div className="flex-1 px-2 pb-2 flex flex-col overflow-hidden pt-1.5">
                        <AnimatePresence mode="wait">
                          {simulatorStep === 0 && (
                            <motion.div
                              key="mob_step0"
                              initial={{ opacity: 0, x: 5 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -5 }}
                              transition={{ duration: 0.2 }}
                              className="flex-1 flex flex-col justify-between overflow-hidden"
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                                  <span className="text-[7px] font-bold text-slate-850 uppercase">New Invoice</span>
                                  <span className="text-[5px] text-slate-400 font-semibold">1 of 3</span>
                                </div>

                                <div className="space-y-0.5">
                                  <label className="text-[5.5px] text-slate-400 font-extrabold uppercase">Bill To</label>
                                  <div className="bg-white p-1.5 rounded-md border border-slate-200/75 shadow-3xs text-[7px] font-extrabold text-slate-850">
                                    Ramesh Kumar
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[5.5px] text-slate-400 font-extrabold uppercase">Items</label>
                                  <div className="bg-white p-1.5 rounded-md border border-slate-200/75 shadow-3xs flex justify-between items-center text-[6.5px]">
                                    <div>
                                      <h6 className="font-extrabold text-slate-850">Ponni Rice</h6>
                                      <p className="text-[5px] text-slate-450">Qty: 2</p>
                                    </div>
                                    <span className="font-extrabold text-slate-850">₹2,400</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => setSimulatorStep(1)}
                                className="w-full bg-[#0050e8] text-white py-1 rounded-md text-[7px] font-extrabold shadow-sm mt-1.5 flex items-center justify-center"
                              >
                                Preview →
                              </button>
                            </motion.div>
                          )}

                          {simulatorStep === 1 && (
                            <motion.div
                              key="mob_step1"
                              initial={{ opacity: 0, x: 5 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -5 }}
                              transition={{ duration: 0.2 }}
                              className="flex-1 flex flex-col justify-between overflow-hidden"
                            >
                              <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex justify-between items-center pb-1 border-b border-slate-100 shrink-0">
                                  <span className="text-[7px] font-bold text-slate-850 uppercase">Tax Invoice</span>
                                  <span className="text-[5px] text-slate-400 font-semibold">2 of 3</span>
                                </div>

                                <div className="flex-1 bg-white border border-slate-200/70 rounded-lg p-1.5 shadow-3xs mt-1 overflow-y-auto space-y-1 text-[5px] text-slate-650">
                                  <div className="flex justify-between items-start border-b border-slate-100 pb-1">
                                    <div>
                                      <h5 className="font-extrabold text-[#0050e8] text-[6.5px]">TRUBILL STORE</h5>
                                      <p className="text-[4px] text-slate-400">GSTIN: 33AAAAA0000A1Z1</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-extrabold text-slate-850">TAX INVOICE</p>
                                    </div>
                                  </div>
                                  <div className="flex justify-between font-bold text-slate-850">
                                    <span>Ramesh Kumar</span>
                                    <span>₹4,042.50</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => setSimulatorStep(2)}
                                className="w-full bg-[#16a34a] text-white py-1 rounded-md text-[7px] font-extrabold shadow-sm mt-1.5 flex items-center justify-center"
                              >
                                Send via WhatsApp 💬
                              </button>
                            </motion.div>
                          )}

                          {simulatorStep === 2 && (
                            <motion.div
                              key="mob_step2"
                              initial={{ opacity: 0, x: 5 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -5 }}
                              transition={{ duration: 0.2 }}
                              className="flex-1 flex flex-col justify-between overflow-hidden"
                            >
                              <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex items-center gap-1 pb-1 border-b border-slate-100 shrink-0">
                                  <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-[6px] text-white font-bold">RK</div>
                                  <h6 className="text-[6.5px] font-bold text-slate-850">Ramesh Kumar</h6>
                                </div>

                                <div className="flex-1 py-1 space-y-1.5 overflow-y-auto flex flex-col justify-end text-[5.5px]">
                                  <div className="bg-[#dcf8c6] p-1.5 rounded-md max-w-[95%] self-end border border-emerald-200/50 shadow-3xs">
                                    <p className="font-bold text-slate-850 text-[6px] mb-0.5">INV_Ramesh.pdf</p>
                                    <p className="text-slate-700 leading-tight">Invoice of **₹4,042.50** from TruBill Store.</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-emerald-50 border border-emerald-150 p-1 rounded-md text-center shrink-0 flex items-center justify-center gap-1 mt-1">
                                <span className="text-[7px] text-[#0050e8] font-extrabold">Invoice Sent &amp; Paid! ✓</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Premium Pill Switcher */}
                <div className="flex gap-1 p-0.5 bg-slate-200/60 backdrop-blur-md rounded-lg w-full max-w-[210px] text-[9.5px] font-extrabold shadow-2xs border border-slate-200/60">
                  <button
                    onClick={() => setSimulatorStep(0)}
                    className={`flex-1 py-1.5 rounded-md transition-all text-center flex items-center justify-center gap-0.5 ${
                      simulatorStep === 0 
                        ? 'bg-[#0050e8] text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>1. Entry</span>
                  </button>
                  <button
                    onClick={() => setSimulatorStep(1)}
                    className={`flex-1 py-1.5 rounded-md transition-all text-center flex items-center justify-center gap-0.5 ${
                      simulatorStep === 1 
                        ? 'bg-[#0050e8] text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>2. Preview</span>
                  </button>
                  <button
                    onClick={() => setSimulatorStep(2)}
                    className={`flex-1 py-1.5 rounded-md transition-all text-center flex items-center justify-center gap-0.5 ${
                      simulatorStep === 2 
                        ? 'bg-[#0050e8] text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>3. Send</span>
                  </button>
                </div>
              </div>

              <h1 className="text-[1.8rem] sm:text-[2.25rem] md:text-5xl lg:text-6xl font-black text-[#1a1d26] tracking-tight leading-[1.2] max-w-2xl lg:max-w-none">
                Best <span className="bg-gradient-to-r from-[#001048] to-[#0050e8] bg-clip-text text-transparent">WhatsApp Billing</span> Software for Small Business
              </h1>

              <p className="text-[13px] sm:text-base md:text-lg text-[#525f7a] leading-relaxed max-w-xl">
                Easy WhatsApp billing, manage customer payments, track outstanding balances, control inventory, and simplify accounting with <strong className="text-slate-800">TruBill</strong> - Tamil Nadu&apos;s best lightweight billing web app. Start billing free today.
              </p>

              {/* Action Buttons & Trust Badges */}
              <div className="pt-2 w-full sm:w-auto flex flex-col items-center lg:items-start gap-3">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto text-center bg-[#0050e8] hover:bg-[#0043c4] text-white font-extrabold text-base sm:text-lg px-10 py-4 rounded-xl transition-all shadow-md hover:shadow-lg shadow-[#0050e8]/15 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                >
                  <span>Start Invoicing Free</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">
                  <span className="text-emerald-700 font-bold">✓ Free Forever</span>
                  <span>•</span>
                  <span>No Setup Required</span>
                  <span>•</span>
                  <span>UPI Ready</span>
                </div>
              </div>
            </div>

            {/* Right Content - Responsive Mockup (Desktop only) */}
            <div className="hidden lg:flex lg:col-span-5 flex-col items-center justify-center w-full">
              
              {/* Premium Pill Switcher */}
              <div className="flex gap-1.5 p-1 bg-slate-200/60 backdrop-blur-md rounded-xl w-full max-w-[280px] sm:max-w-[300px] text-[10.5px] font-extrabold mb-5 sm:mb-6 shadow-2xs border border-slate-200/60">
                <button
                  onClick={() => setSimulatorStep(0)}
                  className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    simulatorStep === 0 
                      ? 'bg-[#0050e8] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] ${simulatorStep === 0 ? 'bg-white/25 text-white' : 'bg-slate-300/80 text-slate-700'}`}>1</span>
                  <span>Entry</span>
                </button>
                <button
                  onClick={() => setSimulatorStep(1)}
                  className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    simulatorStep === 1 
                      ? 'bg-[#0050e8] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] ${simulatorStep === 1 ? 'bg-white/25 text-white' : 'bg-slate-300/80 text-slate-700'}`}>2</span>
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setSimulatorStep(2)}
                  className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    simulatorStep === 2 
                      ? 'bg-[#0050e8] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] ${simulatorStep === 2 ? 'bg-white/25 text-white' : 'bg-slate-300/80 text-slate-700'}`}>3</span>
                  <span>Send</span>
                </button>
              </div>

              {/* DESKTOP MOCKUP: 3D laptop on white background (visible only on desktop) */}
              <div className="hidden lg:block w-full max-w-[480px] xl:max-w-[520px] select-none">
                <div className="hero-laptop-scene relative pt-2 pb-12">
                  {/* Soft floor shadow */}
                  <div
                    aria-hidden
                    className="hero-laptop-shadow pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 w-[82%] h-10"
                  />

                  <div className="hero-laptop-3d relative">
                    {/* Floating invoice card — depth layer like reference */}
                    <AnimatePresence mode="wait">
                      {(simulatorStep === 1 || simulatorStep === 2) && (
                        <motion.div
                          key="float-invoice"
                          initial={{ opacity: 0, x: 20, y: 10, rotateY: -8 }}
                          animate={{ opacity: 1, x: 0, y: 0, rotateY: -8 }}
                          exit={{ opacity: 0, x: 20, y: 10 }}
                          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                          className="hero-laptop-float absolute -right-6 xl:-right-10 top-[18%] z-30 w-[118px] bg-white rounded-lg border border-slate-200/80 p-2.5 pointer-events-none"
                          style={{ transform: 'translateZ(48px) rotateY(-12deg) rotateX(4deg)' }}
                        >
                          <p className="text-[9px] font-extrabold text-[#0050e8] tracking-wide">INVOICE</p>
                          <div className="mt-1.5 space-y-1 text-[5.5px] text-slate-500">
                            <div className="flex justify-between font-bold text-slate-700 border-b border-slate-100 pb-0.5">
                              <span>Item</span>
                              <span>Amt</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Ponni Rice</span>
                              <span>₹2,400</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Toor Dal</span>
                              <span>₹1,450</span>
                            </div>
                            <div className="flex justify-between font-extrabold text-[#0050e8] border-t border-slate-100 pt-0.5 text-[6px]">
                              <span>Total</span>
                              <span>₹4,042</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Screen lid */}
                    <div className="hero-laptop-lid w-full bg-[#1e293b] rounded-t-2xl p-2.5 border-x-2 border-t-2 border-slate-600/80 relative aspect-[16/10.5] overflow-hidden flex flex-col">
                  {/* Camera lens */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-900 z-30" />
                  
                  {/* Screen Content Wrapper */}
                  <div className="flex-1 bg-[#f8fafc] rounded-lg overflow-hidden flex flex-col border border-slate-800">
                    {/* App Web Interface Header */}
                    <div className="bg-[#0050e8] text-white px-3.5 py-2 flex justify-between items-center shadow-xs shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          </svg>
                        </div>
                        <span className="font-extrabold text-[12px] tracking-tight">TruBill Invoicing</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[8px] font-bold text-emerald-100 bg-[#0043c4] px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Store Dashboard
                      </div>
                    </div>

                    {/* App Internal Body: Sidebar + Content */}
                    <div className="flex-1 flex overflow-hidden">
                      {/* Sidebar */}
                      <aside className="w-24 bg-[#111827] text-slate-400 p-2 text-[8px] font-bold space-y-1 shrink-0 flex flex-col justify-between border-r border-slate-800">
                        <div className="space-y-1">
                          <div className="p-1.5 rounded bg-slate-800 text-white flex items-center gap-1 cursor-pointer">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Invoices</span>
                          </div>
                          {["Customers", "Inventory", "Reports", "Settings"].map((lbl, idx) => (
                            <div key={idx} className="p-1.5 rounded hover:bg-slate-900 flex items-center gap-1 cursor-pointer">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                              <span>{lbl}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-1 bg-[#0050e8]/20 text-[#22c55e] text-center rounded text-[6.5px]">
                          Tamil Nadu
                        </div>
                      </aside>

                      {/* Main Dynamic View Content */}
                      <main className="flex-1 p-3 bg-slate-50 overflow-hidden flex flex-col justify-between">
                        {simulatorStep === 0 && (
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                                <h4 className="text-[10px] font-extrabold text-slate-800">Create Tax Invoice</h4>
                                <span className="text-[7px] text-[#0050e8] font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Quick Entry</span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[7.5px]">
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 font-bold block uppercase tracking-wide">Customer (WhatsApp Number)</span>
                                  <div className="bg-white p-2 rounded-lg border border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                                    <span>Ramesh Kumar</span>
                                    <span className="text-slate-400 font-normal">+91 98765 43210</span>
                                  </div>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 font-bold block uppercase tracking-wide">Tax Mode</span>
                                  <div className="bg-white p-2 rounded-lg border border-slate-200 font-bold text-slate-800">
                                    <span>GST Enabled (5% SGST/CGST)</span>
                                  </div>
                                </div>
                              </div>

                              {/* Items Table */}
                              <div className="space-y-1">
                                <span className="text-[7.5px] text-slate-400 font-bold block uppercase tracking-wide">Selected Items</span>
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden text-[7px]">
                                  <div className="bg-slate-50 p-1.5 flex justify-between font-bold text-slate-700 border-b border-slate-200">
                                    <span className="w-1/2">Product Description</span>
                                    <span className="w-1/6 text-center">Qty</span>
                                    <span className="w-1/6 text-right">Price</span>
                                    <span className="w-1/6 text-right">Total</span>
                                  </div>
                                  <div className="p-1.5 flex justify-between text-slate-600 border-b border-slate-100">
                                    <span className="w-1/2 font-bold text-slate-850">Ponni Rice (25kg Bag)</span>
                                    <span className="w-1/6 text-center">2</span>
                                    <span className="w-1/6 text-right">₹1,200.00</span>
                                    <span className="w-1/6 text-right font-bold">₹2,400.00</span>
                                  </div>
                                  <div className="p-1.5 flex justify-between text-slate-600">
                                    <span className="w-1/2 font-bold text-slate-850">Toor Dal (10kg Bag)</span>
                                    <span className="w-1/6 text-center">1</span>
                                    <span className="w-1/6 text-right">₹1,450.00</span>
                                    <span className="w-1/6 text-right font-bold">₹1,450.00</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => setSimulatorStep(1)}
                              className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white py-1.5 rounded-lg text-[8.5px] font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all mt-2"
                            >
                              Generate Tax Invoice &amp; Preview Details →
                            </button>
                          </div>
                        )}

                        {simulatorStep === 1 && (
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="flex-1 grid grid-cols-12 gap-3 overflow-hidden">
                              {/* Left actions */}
                              <div className="col-span-4 space-y-2">
                                <h4 className="text-[9px] font-bold text-slate-800">Invoice Actions</h4>
                                <div className="space-y-1.5">
                                  <div className="p-1.5 bg-emerald-50 text-[#0050e8] border border-emerald-250 rounded-lg text-[7.5px] font-extrabold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>GST Calculated</span>
                                  </div>
                                  <div className="p-1.5 bg-slate-100 rounded-lg text-[6.5px] text-slate-500 font-bold">
                                    PDF Size: 42 KB
                                  </div>
                                </div>
                              </div>

                              {/* Right A4 Preview */}
                              <div className="col-span-8 bg-white border border-slate-200 rounded-lg p-2.5 shadow-xs flex flex-col justify-between overflow-y-auto text-[6px] text-slate-600">
                                <div className="flex justify-between items-start border-b border-slate-100 pb-1.5">
                                  <div>
                                    <h5 className="font-extrabold text-[#0050e8] text-[7.5px]">TRUBILL STORE</h5>
                                    <p className="text-[5px]">GSTIN: 33AAAAA0000A1Z1</p>
                                    <p className="text-[5px]">Chennai, Tamil Nadu</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-extrabold text-slate-850">TAX INVOICE</p>
                                    <p className="font-bold">#INV-2026-08</p>
                                    <p>Date: 15-06-2026</p>
                                  </div>
                                </div>
                                <div className="py-1">
                                  <p className="font-bold text-slate-850">Bill To:</p>
                                  <p className="font-extrabold text-[#0050e8]">Ramesh Kumar</p>
                                  <p>Contact: +91 98765 43210</p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between font-bold border-b border-slate-250 pb-0.5 text-slate-700">
                                    <span>Description</span>
                                    <span>Amount</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Ponni Rice &times; 2</span>
                                    <span>₹2,400.00</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Toor Dal &times; 1</span>
                                    <span>₹1,450.00</span>
                                  </div>
                                </div>
                                <div className="border-t border-slate-100 pt-1.5 space-y-0.5 text-right font-semibold">
                                  <div className="flex justify-between text-[5.5px]">
                                    <span>Subtotal:</span>
                                    <span>₹3,850.00</span>
                                  </div>
                                  <div className="flex justify-between text-[5.5px]">
                                    <span>GST (5%):</span>
                                    <span>₹192.50</span>
                                  </div>
                                  <div className="flex justify-between font-extrabold border-t border-slate-100 pt-0.5 text-[7px] text-[#0050e8]">
                                    <span>Total:</span>
                                    <span>₹4,042.50</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => setSimulatorStep(2)}
                              className="w-full bg-[#16a34a] hover:bg-emerald-600 text-white py-1.5 rounded-lg text-[8.5px] font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all mt-2"
                            >
                              Send Branded Invoice PDF via WhatsApp 💬
                            </button>
                          </div>
                        )}

                        {simulatorStep === 2 && (
                          <div className="flex-1 flex flex-col justify-between">
                            {/* WhatsApp Web desktop interface simulation */}
                            <div className="flex-1 bg-[#efeae2] border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                              {/* WhatsApp Header bar */}
                              <div className="bg-[#f0f2f5] p-2 flex justify-between items-center border-b border-slate-200 shrink-0 text-[8px]">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[7px] text-white font-bold">RK</div>
                                  <div className="leading-tight">
                                    <h6 className="font-extrabold text-slate-800">Ramesh Kumar</h6>
                                    <p className="text-[5px] text-emerald-600 font-medium">online</p>
                                  </div>
                                </div>
                              </div>

                              {/* Chat conversation area */}
                              <div className="flex-1 p-2 space-y-2 flex flex-col justify-end text-[7px]">
                                {/* Customer Question */}
                                <div className="bg-white p-2 rounded-lg max-w-[75%] self-start shadow-2xs">
                                  Please share today&apos;s invoice.
                                </div>

                                {/* PDF message bubble */}
                                <div className="bg-[#dcf8c6] p-2 rounded-lg max-w-[75%] self-end shadow-2xs space-y-1">
                                  <div className="flex items-center gap-1.5 bg-[#128c7e]/10 p-1.5 rounded">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.5">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    <div>
                                      <p className="font-bold text-slate-800">INV_Ramesh.pdf</p>
                                      <p className="text-[5.5px] text-slate-400">42 KB • PDF Receipt</p>
                                    </div>
                                  </div>
                                  <p className="text-[6.5px]">
                                    Dear Ramesh Kumar, your invoice of **₹4,042.50** from TruBill Store is ready. Pay online: *upi.trubill.in/pay*
                                  </p>
                                  <div className="text-right text-[5px] text-slate-400">
                                    10:16 AM <span className="text-blue-500">✓✓</span>
                                  </div>
                                </div>

                                {/* Customer Confirmation */}
                                <div className="bg-white p-2 rounded-lg max-w-[75%] self-start shadow-2xs">
                                  Perfect! Paid ₹4,042.50 via UPI GPay.
                                </div>
                              </div>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100/60 p-2.5 rounded-xl text-center shrink-0 flex items-center justify-center gap-1.5 mt-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[6px] font-bold">✓</span>
                              <span className="text-[9px] text-[#0050e8] font-extrabold">Paid successfully via UPI!</span>
                            </div>
                          </div>
                        )}
                      </main>
                    </div>
                  </div>
                </div>
                  </div>

                {/* Laptop Keyboard dock base */}
                <div className="w-[108%] h-3 bg-slate-800 rounded-b-xl relative -bottom-1 -left-[4%] border-t border-slate-700 shadow-md">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-950 rounded-b-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ─── Below Qualities (Sub-Hero Bar) ───────────────────── */}
      <section className="bg-white border-b border-[#e8eaed] py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 md:gap-8 text-center items-start">
            {/* Quality 1 */}
            <div className="flex flex-col items-center space-y-2 md:space-y-4">
              <div className="text-[#0050e8] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#0050e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-10 md:h-10">
                  <circle cx="16" cy="16" r="13" />
                  <path d="M11 14a2 2 0 0 1 4 0" />
                  <path d="M17 14a2 2 0 0 1 4 0" />
                  <path d="M11 18c0 3 2.5 5 5 5s5-2 5-5H11z" fill="#0050e8" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <h4 className="text-base md:text-xl font-extrabold text-[#1a1d26]">
                  1.5 Lakh<span className="text-[#0050e8]">+</span>
                </h4>
                <p className="text-[11px] md:text-xs text-[#6b7280] font-semibold">Happy Shop Owners</p>
              </div>
            </div>

            {/* Quality 2 */}
            <div className="flex flex-col items-center space-y-2 md:space-y-4">
              <div className="text-[#0050e8] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#0050e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-10 md:h-10">
                  <rect x="9" y="4" width="14" height="24" rx="3" />
                  <line x1="9" y1="8" x2="23" y2="8" />
                  <line x1="9" y1="24" x2="23" y2="24" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <h4 className="text-base md:text-xl font-extrabold text-[#1a1d26]">Free</h4>
                <p className="text-[11px] md:text-xs text-[#6b7280] font-semibold">Web &amp; PWA App</p>
              </div>
            </div>

            {/* Quality 3 */}
            <div className="flex flex-col items-center space-y-2 md:space-y-4">
              <div className="text-[#0050e8] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#0050e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-10 md:h-10">
                  <path d="M8 4L24 16L8 28V4Z" />
                  <path d="M8 4L19 16L8 28" />
                  <path d="M19 16L8 16" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <h4 className="text-base md:text-xl font-extrabold text-[#1a1d26]">
                  Rated 4.9<span className="text-[#0050e8]">/5</span>
                </h4>
                <p className="text-[11px] md:text-xs text-[#6b7280] font-semibold">User Satisfaction</p>
              </div>
            </div>

            {/* Quality 4 */}
            <div className="flex flex-col items-center space-y-2 md:space-y-4">
              <div className="text-[#0050e8] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#0050e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-10 md:h-10">
                  <rect x="10" y="6" width="18" height="13" rx="2" />
                  <path d="M16 19v4m-3 0h6" />
                  <rect x="4" y="11" width="7" height="12" rx="1" fill="white" />
                  <line x1="4" y1="14" x2="11" y2="14" />
                  <line x1="4" y1="20" x2="11" y2="20" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <h4 className="text-base md:text-xl font-extrabold text-[#1a1d26]">
                  Multi-<span className="text-[#0050e8]">Device</span>
                </h4>
                <p className="text-[11px] md:text-xs text-[#6b7280] font-semibold">Use on Mobile/Desktop</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Capabilities alternating Section ──────────────────── */}
      <section id="features" className="py-12 md:py-20 bg-white border-b border-[#e8eaed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 md:space-y-12 lg:space-y-16">

          {/* Feature 1: GST Billing & WhatsApp Sharing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Left Graphic */}
            <div className="lg:col-span-6 relative flex justify-center py-6 sm:py-10">
              {/* Vyapar-style circular backdrop and floating elements */}
              <div className="absolute inset-0 -z-10 select-none pointer-events-none flex items-center justify-center">
                {/* Large offset soft-colored circle */}
                <div className="w-[260px] h-[260px] sm:w-[350px] sm:h-[350px] rounded-full bg-[#fce7f3] opacity-80 translate-x-2 translate-y-2" />
                
                {/* Floating WhatsApp Logo (top-left) */}
                <motion.div 
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-[8%] left-[12%] sm:left-[15%] w-10 h-10 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center border border-slate-100"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#22c55e">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97-1.862-1.868-4.339-2.898-6.977-2.899-5.437 0-9.862 4.37-9.866 9.8.001 2.028.531 4.008 1.547 5.753l-.979 3.578 3.676-.965zm10.741-6.733c-.292-.146-1.727-.852-1.992-.949-.264-.096-.456-.146-.649.146-.193.291-.747.949-.916 1.144-.168.193-.336.218-.629.072-1.879-.942-3.137-1.624-4.385-3.76-.328-.562.328-.521.939-1.74.101-.203.051-.38-.025-.527-.076-.146-.649-1.564-.89-2.144-.233-.563-.473-.487-.649-.496-.168-.008-.36-.01-.553-.01-.193 0-.507.073-.772.361-.264.292-1.011.99-1.011 2.414s1.036 2.796 1.18 2.99c.145.195 2.036 3.111 4.934 4.364.689.299 1.228.479 1.648.613.693.22 1.324.19 1.822.115.556-.083 1.727-.706 1.97-.1.388 2.443.264 4.542.074 5.097-.091.264-.265.457-.557.603z" />
                  </svg>
                </motion.div>

                {/* Floating Violet Paper Plane (top-right) */}
                <motion.div 
                  animate={{ y: [0, 8, 0], x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="absolute top-[5%] right-[10%] sm:right-[15%]"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" className="rotate-[15deg]">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </motion.div>

                {/* Floating Green Paper Plane (bottom-left) */}
                <motion.div 
                  animate={{ y: [0, -8, 0], x: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-[10%] left-[8%] sm:left-[12%]"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" className="rotate-[-25deg]">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </motion.div>

                {/* Floating Yellow Mail/Envelope (bottom-right) */}
                <motion.div 
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-[10%] right-[10%] sm:right-[15%] w-9 h-9 rounded-lg bg-amber-400 shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center text-white border border-amber-300"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </motion.div>

                {/* Dotted curve paths */}
                <svg className="absolute w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] fill-none opacity-40">
                  <path d="M 60,60 Q 140,20 220,40" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                  <path d="M 40,220 Q 120,280 240,200" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                </svg>
              </div>

              <img
                src="/billing_whatsapp.png"
                alt="GST billing and WhatsApp sharing"
                className="w-full max-w-[280px] sm:max-w-[380px] md:max-w-[420px] h-auto object-contain drop-shadow-2xl relative z-10"
                loading="lazy"
              />
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 space-y-3 sm:space-y-4 md:space-y-6">
              <span className="inline-block text-[9px] sm:text-[10px] bg-emerald-50 text-[#0050e8] font-extrabold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-wider border border-emerald-100/50">
                WhatsApp-Native Delivery
              </span>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1a1d26] tracking-tight leading-snug">
                Create GST Bills online and share them with customers
              </h3>
              <p className="text-[13px] sm:text-sm md:text-base text-[#4b5563] leading-relaxed font-medium">
                <strong>What it does:</strong> TruBill&apos;s GST billing software lets you generate fully GST-compliant tax invoices in under 20 seconds. Instead of wasting money on thermal printers and paper rolls, deliver branded PDF receipts directly to your customer&apos;s WhatsApp instantly.
              </p>
              <ul className="space-y-2 sm:space-y-2.5 pt-1 sm:pt-2">
                {[
                  "Generate compliant tax invoices with custom SGST/CGST rates",
                  "Send PDFs instantly on WhatsApp without saving contacts",
                  "Completely offline billing - syncs automatically when online"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 sm:gap-3 text-[13px] sm:text-sm text-[#4b5563] font-semibold">
                    <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-emerald-50 text-[#0050e8] flex items-center justify-center shrink-0 border border-emerald-100/30 mt-0.5">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2: Payment Tracking & UPI Reminders (Alternating) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Left Content (order-2 on mobile, order-1 on desktop) */}
            <div className="lg:col-span-6 lg:order-1 space-y-3 sm:space-y-4 md:space-y-6">
              <span className="inline-block text-[9px] sm:text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-wider border border-blue-100/50">
                Payment Status &amp; UPI
              </span>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1a1d26] tracking-tight leading-snug">
                Track Outstanding Balances &amp; Collect via UPI
              </h3>
              <p className="text-[13px] sm:text-sm md:text-base text-[#4b5563] leading-relaxed font-medium">
                <strong>What it does:</strong> Say goodbye to manually checking notebook ledgers. Monitor paid, partially paid, and unpaid statuses directly from your dashboard. Send polite payment reminders with a pre-filled UPI payment link on WhatsApp.
              </p>
              <ul className="space-y-2 sm:space-y-2.5 pt-1 sm:pt-2">
                {[
                  "Detailed customer directory showing total outstanding balance",
                  "One-tap payments reminders with pre-filled WhatsApp texts",
                  "Direct UPI link integration for frictionless customer payments"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 sm:gap-3 text-[13px] sm:text-sm text-[#4b5563] font-semibold">
                    <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100/30 mt-0.5">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Graphic (order-1 on mobile, order-2 on desktop) */}
            <div className="lg:col-span-6 lg:order-2 relative flex justify-center py-6 sm:py-10">
              {/* Vyapar-style circular backdrop and floating elements */}
              <div className="absolute inset-0 -z-10 select-none pointer-events-none flex items-center justify-center">
                {/* Large offset soft-colored circle */}
                <div className="w-[260px] h-[260px] sm:w-[350px] sm:h-[350px] rounded-full bg-[#dcfce7] opacity-80 -translate-x-2 translate-y-2" />
                
                {/* Floating Checkmark Badge */}
                <motion.div 
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-[10%] right-[12%] sm:right-[15%] w-10 h-10 rounded-full bg-emerald-500 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center text-white border border-emerald-400"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>

                {/* Floating Credit Card Badge */}
                <motion.div 
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-[12%] left-[10%] sm:left-[15%] w-11 h-8 rounded-lg bg-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center text-white border border-indigo-500"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </motion.div>

                {/* Floating Bank/UPI Badge */}
                <motion.div 
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
                  className="absolute top-[8%] left-[12%] sm:left-[18%] w-9 h-9 rounded-lg bg-sky-500 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center text-white border border-sky-400"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="10" width="18" height="11" rx="2" />
                    <path d="M12 2L2 7h20L12 2z" />
                  </svg>
                </motion.div>
              </div>

              <img
                src="/payments_reminders.png"
                alt="UPI payment status and reminders"
                className="w-full max-w-[260px] sm:max-w-[340px] md:max-w-[380px] h-auto object-contain drop-shadow-2xl relative z-10"
                loading="lazy"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-12 md:py-20 bg-white border-y border-[#e8eaed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8 md:mb-16 space-y-2 sm:space-y-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase bg-emerald-50 text-[#0050e8] border border-emerald-100/80">
              Workflow
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Create and share bills in <span className="bg-gradient-to-r from-[#0050e8] to-[#2e9354] bg-clip-text text-transparent">three simple steps</span>
            </h3>
          </div>

          {/* Mobile Connected Stepper (Visible only on mobile) */}
          <div className="block md:hidden relative pl-3 pr-1 space-y-7">
            {/* Vertical timeline line */}
            <div className="absolute left-[30px] top-5 bottom-5 w-0.5 border-l-2 border-dashed border-[#0050e8]/25" />
            
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex gap-4 items-start">
                {/* Step Circle with Icon */}
                <div className="relative z-10 shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-white to-slate-50 text-[#0050e8] flex items-center justify-center border border-slate-200/80 shadow-md [&>svg]:w-5 [&>svg]:h-5">
                  {step.icon}
                  {/* Step Number Badge */}
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#0050e8] to-[#0058e8] text-white text-[9px] font-extrabold flex items-center justify-center shadow-md border-2 border-white">
                    {step.num}
                  </span>
                </div>
                {/* Step Content */}
                <div className="space-y-1 pt-0.5">
                  <h4 className="text-[13px] font-extrabold text-slate-800 tracking-tight">{step.title}</h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed font-medium">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Stepper (Hidden on mobile) */}
          <div className="hidden md:grid md:grid-cols-3 gap-12 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="text-center space-y-4 relative">
                {/* Horizontal dotted connector on desktop */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 left-[65%] w-[70%] border-t-2 border-dashed border-[#e2e8f0] -z-0" />
                )}

                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0050e8]/8 text-[#0050e8] z-10 shadow-inner">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#0050e8] text-white text-xs font-extrabold flex items-center justify-center shadow-md border-2 border-white">
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
      <section className="py-12 md:py-20 bg-[#f8fafc] border-b border-[#e8eaed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8 md:mb-16 space-y-2 sm:space-y-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase bg-emerald-50 text-[#0050e8] border border-emerald-100/80">
              Sectors
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Tailored for businesses across <span className="bg-gradient-to-r from-[#0050e8] to-[#2e9354] bg-clip-text text-transparent">Tamil Nadu</span>
            </h3>
          </div>

          {/* Mobile Sectors Selector (Visible only on mobile) */}
          <div className="block md:hidden space-y-4">
            {/* Scrollable Tab bar */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
              {industries.map((ind, idx) => {
                const isActive = activeSector === idx;
                const tabLabel = ind.name.split(' & ')[0];
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveSector(idx)}
                    className={`snap-center shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold transition-all border flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0050e8] to-[#0058e8] text-white border-[#0050e8] shadow-md shadow-[#0050e8]/15'
                        : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-4 h-4 scale-[0.7] -mr-1 -ml-1 shrink-0 flex items-center justify-center">
                      {ind.icon}
                    </div>
                    {tabLabel}
                  </button>
                );
              })}
            </div>

            {/* Display Card for Active Sector */}
            <div className="bg-white p-5 pt-6 rounded-2xl border border-slate-200/85 shadow-lg shadow-slate-100/50 relative overflow-hidden transition-all duration-300">
              {/* Green gradient top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0050e8] to-[#0058e8]" />

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center shrink-0 shadow-xs border border-slate-100 [&>svg]:w-6 [&>svg]:h-6">
                  {industries[activeSector].icon}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-extrabold text-[#1a1d26]">
                    {industries[activeSector].name}
                  </h4>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold text-[#0050e8] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0050e8] animate-pulse" />
                    Custom Solution
                  </span>
                </div>
              </div>

              <p className="text-[12px] text-slate-500 leading-relaxed font-medium mt-3">
                {industries[activeSector].desc}
              </p>

              {/* Highlights Checklist */}
              <div className="mt-4 pt-4 border-t border-slate-100/80 space-y-2.5">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Key Benefits:</p>
                <div className="grid grid-cols-1 gap-2">
                  {industries[activeSector].highlights?.map((hl, hlIdx) => (
                    <div key={hlIdx} className="flex items-center gap-2.5 bg-slate-50/60 border border-slate-100 p-2.5 rounded-xl transition-all hover:bg-emerald-50/20 hover:border-emerald-100/50">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-[#0050e8] flex items-center justify-center shrink-0 border border-emerald-100/30">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="font-semibold text-[12px] text-slate-700">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Link */}
              <div className="mt-4">
                <Link
                  href="/signup"
                  className="block w-full text-center bg-gradient-to-r from-[#0050e8] to-[#0058e8] hover:from-[#0043c4] hover:to-[#0050e8] text-white py-3 rounded-xl text-[11px] font-extrabold transition-all shadow-md shadow-[#0050e8]/15 hover:shadow-lg hover:shadow-[#0050e8]/20"
                >
                  Start {industries[activeSector].name} Billing Free →
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop Sectors Grid (Hidden on mobile) */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-8">
            {industries.map((ind, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-[#e8eaed] flex gap-5 hover:shadow-md hover:border-[#0050e8]/20 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#fafafa] flex items-center justify-center shrink-0 shadow-sm border border-neutral-100 group-hover:scale-105 transition-transform">
                  {ind.icon}
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-[#1a1d26] group-hover:text-[#0050e8] transition-colors">{ind.name}</h4>
                  <p className="text-sm text-[#4b5563] leading-relaxed">{ind.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ──────────────────────────────────────── */}
      <section id="faq" className="py-12 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-[10px] sm:text-xs font-bold text-[#0050e8] uppercase tracking-widest mb-2 sm:mb-3">FAQ</h2>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1a1d26] tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-[#e8eaed] rounded-xl overflow-hidden bg-[#fafbfc] transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-4 sm:px-6 py-3.5 sm:py-4 text-left flex justify-between items-center gap-3 bg-white hover:bg-[#fafbfc]"
                  >
                    <span className="font-bold text-[13px] sm:text-sm text-[#1a1d26]">{faq.q}</span>
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
                        <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-1.5 sm:pt-2 text-[12px] sm:text-xs text-[#4b5563] leading-relaxed border-t border-[#e8eaed]/65 bg-[#fcfdfe]">
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
      <section className="py-12 md:py-20 bg-[#f8fafc] border-t border-[#e8eaed]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Boost your billing speed and collections today
          </h2>
          <p className="text-sm sm:text-base text-[#4b5563] max-w-lg mx-auto">
            Join other shop owners in Tamil Nadu saving time and paperwork with TruBill Invoice. Free setup.
          </p>
          <div className="pt-1">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold text-sm sm:text-base px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl transition-all shadow-md hover:shadow-lg shadow-[#0050e8]/10"
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

      <footer className="bg-white border-t border-[#e8eaed] text-sm text-[#4b5563]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pb-8 md:pb-12 border-b border-[#e8eaed]">
            {/* Logo/Info column */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#0050e8] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <span className="font-heading font-black text-base text-[#1a1d26]">TruBill Invoice</span>
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
                TruBill Technologies Ltd.<br />
                Anna Salai, Chennai,<br />
                Tamil Nadu 600002
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 md:pt-8 text-[11px] sm:text-xs text-[#6b7280] gap-3">
            <div>
              © {new Date().getFullYear()} TruBill. All rights reserved.
            </div>
            <div className="flex gap-4">
              <span>Made for Shopkeepers in Tamil Nadu 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
