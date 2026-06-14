'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: 'Professional GST Invoices',
    description: 'Auto-generate branded PDF invoices with your shop name, GSTIN, itemized table, and totals.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    title: 'WhatsApp Delivery',
    description: 'Send invoices directly to your customer\'s WhatsApp. No printing needed.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'Product Catalog',
    description: 'Save items once. Tap to add to any invoice — fast, consistent, zero errors.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
    title: 'Business Analytics',
    description: 'Track total sales, daily invoices, and revenue at a glance from your dashboard.',
    color: 'bg-amber-50 text-amber-600',
  },
];

const stats = [
  { value: 'TN', label: 'Built for Tamil Nadu shops' },
  { value: '📱', label: 'WhatsApp-native invoicing' },
  { value: '< 30s', label: 'Per invoice' },
  { value: '₹0', label: 'To start using' },
];

const steps = [
  {
    num: '01',
    title: 'Add your items',
    desc: 'Tap from your saved catalog or add custom items with prices.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Enter WhatsApp number',
    desc: 'Type your customer\'s 10-digit number. We\'ll handle the rest.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Send & done',
    desc: 'PDF generated, uploaded, and delivered to WhatsApp instantly.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
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
              Vynkrova
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#6b7280] hover:text-[#1a1d26] transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-[#1a6b3c] hover:bg-[#155d33] px-5 py-2.5 rounded-xl transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="gradient-hero gradient-hero-mesh relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-8 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
                Invoice your{' '}
                <span className="relative">
                  <span className="relative z-10">customers</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-emerald-400/30 rounded-sm -z-0" />
                </span>
                <br />on WhatsApp
              </h1>

              <p className="text-lg text-[#e6f4ea] mb-8 max-w-md leading-relaxed">
                Create professional invoices, generate branded PDFs, and deliver them instantly via WhatsApp. Built for small shops in India.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#1a6b3c] font-bold text-base px-8 py-4 rounded-2xl hover:bg-emerald-50 transition-all shadow-lg shadow-black/10 min-h-[52px]"
                >
                  Get Started — It&apos;s Free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold text-base px-8 py-4 rounded-2xl hover:bg-white/20 transition-all border border-white/15 backdrop-blur-sm min-h-[52px]"
                >
                  Log In
                </Link>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
              className="relative hidden sm:block"
            >
              <div className="relative mx-auto max-w-sm">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/20 to-transparent rounded-3xl blur-2xl transform scale-110" />
                <Image
                  src="/hero-mockup.png"
                  alt="Vynkrova Invoice Dashboard"
                  width={400}
                  height={600}
                  className="relative rounded-3xl shadow-2xl shadow-black/30"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L60 35C120 30 240 20 360 25C480 30 600 50 720 55C840 60 960 50 1080 40C1200 30 1320 20 1380 15L1440 10V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0V40Z" fill="#f5f6fa" />
          </svg>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4 mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="glass-card-light rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#1a6b3c] tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs text-[#6b7280] font-medium mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── Features Grid ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-[#1a6b3c] uppercase tracking-widest mb-2">
            Everything you need
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1d26] tracking-tight">
            Powerful invoicing, made simple
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="glass-card-light rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-[#1a1d26] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#6b7280] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────── */}
      <section className="bg-[#fafbfc] border-y border-[#e8eaed]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#1a6b3c] uppercase tracking-widest mb-2">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1d26] tracking-tight">
              Create an invoice in 30 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.1 }}
                className="relative text-center"
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden sm:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-[#d1d5db]" />
                )}

                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a6b3c]/8 text-[#1a6b3c] mb-5">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1a6b3c] text-white text-xs font-bold flex items-center justify-center">
                    {step.num.replace('0', '')}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1a1d26] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#6b7280] leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="gradient-hero rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
        >
          <div className="gradient-hero-mesh absolute inset-0 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
              Ready to go paperless?
            </h2>
            <p className="text-lg text-[#e6f4ea] mb-8 max-w-md mx-auto">
              Join 50,000+ shop owners who send invoices on WhatsApp with Vynkrova.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#1a6b3c] font-bold text-base px-10 py-4 rounded-2xl hover:bg-emerald-50 transition-all shadow-lg min-h-[52px]"
            >
              Create Free Account
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-[#e8eaed] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1a6b3c] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="font-bold text-[#1a1d26]">Vynkrova Invoice</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#6b7280]">
              <span>© {new Date().getFullYear()} Vynkrova</span>
              <span>·</span>
              <span>Made in India 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
