'use client';

// Suppress Next.js React-19/Turbopack performance measurement timing crash
if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
  const originalMeasure = window.performance.measure;
  window.performance.measure = function (measureName: any, startMark: any, endMark: any) {
    try {
      return originalMeasure.call(window.performance, measureName, startMark, endMark);
    } catch (e) {
      return null as any;
    }
  };
}

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/customers',
    label: 'Customers',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/invoice/new',
    label: 'Invoice',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    isMain: true,
  },
  {
    href: '/catalog',
    label: 'Catalog',
    desktopOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: '/payments',
    label: 'Payments',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="3" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Navbar() {
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [shopInfo, setShopInfo] = useState<{ id: string; name: string; shop_type: string; gst_registered: boolean; inventory_enabled: boolean; logo_url?: string | null } | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  const purchasesItem = {
    href: '/purchases',
    label: 'Purchases',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  };

  const suppliersItem = {
    href: '/suppliers',
    label: 'Suppliers',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  };

  const gstItem = {
    href: '/gst',
    label: 'GST',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  };

  const reportsItem = {
    href: '/reports',
    label: 'Reports',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  };

  const activeNavItems = (() => {
    const items = [...navItems];
    const idx = items.findIndex((i) => i.href === '/settings');
    if (shopInfo?.gst_registered) {
      if (idx !== -1) {
        items.splice(idx, 0, purchasesItem, suppliersItem, reportsItem, gstItem);
      } else {
        items.push(purchasesItem, suppliersItem, reportsItem, gstItem);
      }
    } else {
      if (idx !== -1) {
        items.splice(idx, 0, reportsItem);
      } else {
        items.push(reportsItem);
      }
    }
    return items;
  })();


  useEffect(() => {
    // Hydrate state from localStorage immediately on mount (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const storedShop = localStorage.getItem('trubill_navbar_shop_info');
        if (storedShop) {
          setShopInfo(JSON.parse(storedShop));
        }
        const storedLowStock = localStorage.getItem('trubill_navbar_low_stock');
        if (storedLowStock) {
          setLowStockCount(parseInt(storedLowStock, 10) || 0);
        }
      } catch {}
    }

    const fetchNavbarData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: shop } = await supabase
          .from('shops')
          .select('id, name, shop_type, gst_registered, inventory_enabled, logo_url')
          .eq('auth_user_id', user.id)
          .single();

        if (shop) {
          setShopInfo(shop);
          if (typeof window !== 'undefined') {
            localStorage.setItem('trubill_navbar_shop_info', JSON.stringify(shop));
          }
          
          if (shop.inventory_enabled) {
            const { data: products } = await supabase
              .from('products')
              .select('stock_qty, low_stock_threshold, track_inventory')
              .eq('shop_id', shop.id);

            if (products) {
              const typedProducts = products as Array<{ stock_qty: number | null; low_stock_threshold: number | null; track_inventory: boolean }>;
              const low = typedProducts.filter(p => p.track_inventory && (p.stock_qty || 0) <= (p.low_stock_threshold || 5)).length;
              setLowStockCount(low);
              if (typeof window !== 'undefined') {
                localStorage.setItem('trubill_navbar_low_stock', low.toString());
              }
            }
          }
        }
      } catch { /* ignore */ }
    };

    fetchNavbarData();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('trubill_navbar_shop_info');
        localStorage.removeItem('trubill_navbar_low_stock');
      }
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    router.push('/login');
  };

  return (
    <>
      {/* Global CSS Injector to offset pages on desktop view */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 768px) {
          body {
            padding-left: 16rem !important;
          }
        }
      `}} />

      {/* ─── DESKTOP LEFT SIDEBAR (>= 768px) ─── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#e8eaed] fixed left-0 top-0 bottom-0 z-40 p-6 shadow-sm">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#e8eaed] overflow-hidden shadow-sm flex items-center justify-center">
            <img src="/trubill-logo.png" alt="TruBill logo" className="w-full h-full object-contain" loading="lazy" />
          </div>
          <div>
            <span className="font-heading font-black text-[#1a1d26] text-base leading-none block">TruBill</span>
            <span className="text-[10px] font-bold text-[#1a6b3c] uppercase tracking-wider mt-0.5 block">Invoice</span>
          </div>
        </div>

        {/* Quick Action: New Invoice */}
        <Link href="/invoice/new" className="mb-6 block">
          <button className="w-full bg-[#1a6b3c] hover:bg-[#155630] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Invoice
          </button>
        </Link>

        <nav className="flex-1 space-y-1.5">
          {activeNavItems
            .filter((item) => !item.isMain)
            .map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const isCatalog = item.href === '/catalog';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative ${
                    isActive
                      ? 'bg-[#1a6b3c]/10 text-[#1a6b3c]'
                      : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#1a1d26]'
                  }`}
                >
                  <span className={isActive ? 'text-[#1a6b3c]' : 'text-[#9ca3af]'}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isCatalog && lowStockCount > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                      {lowStockCount}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Sidebar Footer with Logout */}
        <div className="border-t border-[#e8eaed] pt-4 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#1a6b3c]/10 flex items-center justify-center text-[#1a6b3c] shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-[#1a1d26] truncate">{shopInfo?.name || 'Active Shop'}</p>
              <p className="text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wider truncate">
                {shopInfo?.shop_type ? shopInfo.shop_type.replace('_', ' ') : 'Tamil Nadu, IN'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MOBILE HEADER (Visible only on < 768px) ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#e8eaed] md:hidden">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#4b5563] hover:text-[#1a1d26] rounded-xl hover:bg-[#f3f4f6] transition-all cursor-pointer"
              aria-label="Toggle navigation menu"
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

            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#e8eaed] overflow-hidden shadow-sm shrink-0">
                <img src="/trubill-logo.png" alt="TruBill logo" className="w-full h-full object-contain" loading="lazy" />
              </div>
              <span className="font-heading font-black text-[#1a1d26] text-sm">TruBill</span>
            </Link>
          </div>

          <div className="text-[11px] font-bold text-gray-500 bg-[#f3f4f6] px-2.5 py-1.5 rounded-lg max-w-[150px] truncate">
            {shopInfo?.name || 'Active Shop'}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
            />

            {/* Slide-out Sidebar Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col p-6 border-r border-[#e8eaed] md:hidden"
            >
              {/* Brand / Active Shop Header */}
              <div className="flex items-center justify-between mb-6 border-b border-[#f3f4f6] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1a6b3c]/10 flex items-center justify-center overflow-hidden border border-[#e8eaed] shrink-0">
                    {shopInfo?.logo_url ? (
                      <img src={shopInfo.logo_url} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-sm font-bold text-[#1a6b3c]">
                        {(shopInfo?.name || 'TB').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-heading font-extrabold text-[#1a1d26] text-xs leading-none block truncate uppercase">
                      {shopInfo?.name || 'TruBill'}
                    </span>
                    <span className="text-[9px] font-bold text-[#1a6b3c] uppercase tracking-wider mt-0.5 block truncate">
                      {shopInfo?.shop_type ? shopInfo.shop_type.replace('_', ' ') : 'Invoice'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-gray-450 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Quick Action: New Invoice */}
              <Link href="/invoice/new" className="mb-6 block" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[#1a6b3c] hover:bg-[#155630] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Invoice
                </button>
              </Link>

              {/* Sidebar Navigation Items */}
              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {activeNavItems
                  .map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const isCatalog = item.href === '/catalog';
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative ${
                          isActive
                            ? 'bg-[#1a6b3c]/10 text-[#1a6b3c]'
                            : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#1a1d26]'
                        }`}
                      >
                        <span className={isActive ? 'text-[#1a6b3c]' : 'text-[#9ca3af]'}>
                          {item.icon}
                        </span>
                        {item.label}
                        {isCatalog && lowStockCount > 0 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                            {lowStockCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
              </nav>

              {/* Sidebar Footer with Logout */}
              <div className="border-t border-[#e8eaed] pt-4 mt-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-[#1a6b3c]/10 flex items-center justify-center text-[#1a6b3c] shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-xs font-bold text-[#1a1d26] truncate">{shopInfo?.name || 'Active Shop'}</p>
                    <p className="text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wider truncate">
                      {shopInfo?.shop_type ? shopInfo.shop_type.replace('_', ' ') : 'Tamil Nadu, IN'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── MOBILE BOTTOM NAVIGATION (Visible only on < 768px) ─── */}
      {pathname !== '/invoice/new' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e8eaed] safe-area-inset-bottom md:hidden">
          <div className="max-w-lg mx-auto flex items-center justify-around h-16">
            {activeNavItems
              .filter((item) => ['/dashboard', '/customers', '/invoice/new'].includes(item.href))
              .map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                if (item.isMain) {
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 -mt-5 rounded-2xl bg-[#1a6b3c] text-white shadow-lg shadow-[#1a6b3c]/25 flex items-center justify-center cursor-pointer"
                    >
                      {item.icon}
                    </motion.div>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 min-w-[64px] py-2 transition-colors relative ${
                    isActive
                      ? 'text-[#1a6b3c] bottom-nav-active'
                      : 'text-[#9ca3af]'
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
