'use client';

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export default function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);

  const solutions = [
    {
      name: "Restaurants",
      href: "/solutions/restaurants",
      description: "Dine-in, parcel & automatic SAC 996331",
      icon: (
        <div className="p-2 rounded-lg bg-blue-50 text-[#0050e8]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4h1v7h2v-7h1a4 4 0 004-4V3M7 3v4M10 3v4M21 3v18h-3V11h-2V3a4 4 0 015 0z" />
          </svg>
        </div>
      )
    },
    {
      name: "Footwear Shops",
      href: "/solutions/footwear",
      description: "Variant inventory grid & barcode billing",
      icon: (
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
      )
    },
    {
      name: "Textile Shops",
      href: "/solutions/textile",
      description: "Fabric inventory & HSN auto-fill",
      icon: (
        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 4L8.12 15.88M14.8 12.8L20 18" />
          </svg>
        </div>
      )
    },
    {
      name: "Juice Shops",
      href: "/solutions/juice-shops",
      description: "Fast 3-second counter sales & stock logs",
      icon: (
        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8H7l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12zM15 2l-3 6M9 8h6" />
          </svg>
        </div>
      )
    },
  ];

  return (
    <div className="sticky top-0 z-50 w-full">
      {/* Dark Top Strip (Navy Blue matching logo) */}
      <div className="bg-[#001048] h-1 w-full" />

      <nav className="bg-white/95 backdrop-blur-xl border-b border-[#e8eaed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 md:h-24 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/trubill-logo.png" alt="TruBill Logo" className="w-12 h-12 md:w-14 md:h-14 object-contain shrink-0" />
            <span className="font-heading font-black text-xl md:text-2xl tracking-tight">
              <span className="text-[#001048]">Tru</span>
              <span className="text-[#0050e8]">Bill</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {/* Solutions Dropdown Trigger */}
            <div className="relative">
              <button
                onMouseEnter={() => setSolutionsDropdownOpen(true)}
                onMouseLeave={() => setSolutionsDropdownOpen(false)}
                onClick={() => setSolutionsDropdownOpen(!solutionsDropdownOpen)}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors py-2"
              >
                Solutions
                <svg className={`w-4 h-4 transition-transform duration-200 ${solutionsDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Solutions Dropdown Menu */}
              <AnimatePresence>
                {solutionsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onMouseEnter={() => setSolutionsDropdownOpen(true)}
                    onMouseLeave={() => setSolutionsDropdownOpen(false)}
                    className="absolute left-0 mt-1 w-[350px] bg-white rounded-2xl shadow-xl border border-[#e8eaed] p-3 flex flex-col gap-2.5 z-50"
                  >
                    {solutions.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-start gap-4 p-2.5 text-sm rounded-xl hover:bg-slate-50 transition-all group"
                      >
                        <div className="shrink-0 transition-transform group-hover:scale-105">
                          {item.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 group-hover:text-[#0050e8] transition-colors">
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-400 font-medium mt-0.5 leading-normal">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/#features" className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors">
              How It Works
            </Link>
            <Link href="/#faq" className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors">
              FAQ
            </Link>
            <Link href="/pricing" className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors">
              Contact
            </Link>
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

          {/* Mobile Right: Actions */}
          <div className="flex md:hidden items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-[#0050e8] border border-[#0050e8]/20 bg-emerald-50/50 hover:bg-emerald-50 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Log in
            </Link>
            {/* Hamburger Button */}
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
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-20 bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-20 left-0 right-0 bg-white border-b border-[#e8eaed] p-6 shadow-xl flex flex-col gap-4 md:hidden"
            >
              <div className="flex flex-col gap-3 font-semibold text-slate-800">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Solutions</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                  {solutions.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm py-2 flex items-center gap-3 hover:text-[#0050e8] group text-slate-700 font-semibold"
                    >
                      <div className="shrink-0 scale-90 group-hover:scale-95 transition-transform">
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
                <hr className="my-2 border-slate-100" />
                <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#0050e8]">
                  Features
                </Link>
                <Link href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#0050e8]">
                  How It Works
                </Link>
                <Link href="/#faq" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#0050e8]">
                  FAQ
                </Link>
                <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#0050e8]">
                  Pricing
                </Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#0050e8]">
                  About
                </Link>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[#0050e8]">
                  Contact
                </Link>
              </div>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold py-3 rounded-xl transition-all shadow-sm"
              >
                Get Started Free
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
