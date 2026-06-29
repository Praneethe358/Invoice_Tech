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
import { UserRole } from '@/lib/permissions';
import { Shop } from '@/lib/types';
import SubscriptionBanner from './SubscriptionBanner';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/invoices',
    label: 'Sales Invoices',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: '/credit-debit-notes',
    label: 'Credit/Debit Notes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    ),
  },
  {
    href: '/customers',
    label: 'Customer Ledger',
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
    label: 'New Invoice',
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
    label: 'Product Catalog',
    desktopOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: '/payments',
    label: 'Collections & Payments',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Business Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="3" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const ALLOWED_NAV_BY_ROLE: Record<UserRole, string[]> = {
  owner: ['/dashboard', '/invoices', '/credit-debit-notes', '/customers', '/catalog', '/payments', '/purchases', '/suppliers', '/reports', '/gst', '/settings', '/invoice/new'],
  admin: ['/dashboard', '/invoices', '/credit-debit-notes', '/customers', '/catalog', '/payments', '/purchases', '/suppliers', '/reports', '/gst', '/settings', '/invoice/new'],
  billing_staff: ['/dashboard', '/invoices', '/credit-debit-notes', '/customers', '/catalog', '/payments', '/purchases', '/invoice/new'],
  view_only: ['/dashboard', '/invoices', '/credit-debit-notes', '/customers', '/catalog'],
};

interface NavbarProps {
  initialShop?: Shop | null;
  initialRole?: UserRole;
}

export default function Navbar({ initialShop, initialRole }: NavbarProps = {}) {
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // If initialShop is passed in from the server, use it immediately
  const [shopInfo, setShopInfo] = useState<Shop | null>(initialShop ?? null);
  const [shopLoaded, setShopLoaded] = useState(!!initialShop);
  const [userRole, setUserRole] = useState<UserRole>(initialRole ?? 'owner');
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  const [impersonateToken, setImpersonateToken] = useState<string | null>(null);
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [expiresInMinutes, setExpiresInMinutes] = useState<number>(60);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const purchasesItem = {
    href: '/purchases',
    label: 'Purchase Management',
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
    label: 'Supplier Ledger',
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
    label: 'GST Compliance',
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
    label: 'Business Reports',
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
    const allowed = ALLOWED_NAV_BY_ROLE[userRole] || ALLOWED_NAV_BY_ROLE.view_only;
    return items.filter((item) => allowed.includes(item.href));
  })();


  useEffect(() => {
    // If data was passed in as props, persist to localStorage and skip fetch
    if (initialShop) {
      try {
        localStorage.setItem('trubill_navbar_shop_info', JSON.stringify(initialShop));
        if (initialRole) localStorage.setItem('trubill_navbar_role', initialRole);
      } catch {}
      return; // Skip the Supabase fetch entirely
    }

    // Hydrate state from localStorage immediately on mount (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const storedShop = localStorage.getItem('trubill_navbar_shop_info');
        if (storedShop) {
          setShopInfo(JSON.parse(storedShop));
        }
        const storedRole = localStorage.getItem('trubill_navbar_role');
        if (storedRole) {
          setUserRole(storedRole as UserRole);
        }
        const storedLowStock = localStorage.getItem('trubill_navbar_low_stock');
        if (storedLowStock) {
          setLowStockCount(parseInt(storedLowStock, 10) || 0);
        }
      } catch {}
      // Mark hydration complete regardless of whether cache hit
      setShopLoaded(true);
    }

    const fetchNavbarData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch active announcement
        const { data: activeAnns } = await supabase
          .from('system_announcements')
          .select('message')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (activeAnns && activeAnns.length > 0) {
          setAnnouncement(activeAnns[0].message);
        } else {
          setAnnouncement(null);
        }

        // Try owner first
        let { data: shop } = await supabase
          .from('shops')
          .select('id, name, shop_type, gst_registered, inventory_enabled, logo_url, subscription_status, trial_ends_at, subscription_ends_at, whatsapp_invoices_sent, is_frozen, frozen_reason, state')
          .eq('auth_user_id', user.id)
          .single();

        let resolvedRole: UserRole = 'owner';

        if (shop) {
          resolvedRole = 'owner';
        } else {
          // Check if they are a staff member
          const { data: staff } = await supabase
            .from('staff')
            .select('role, shop_id, shops(id, name, shop_type, gst_registered, inventory_enabled, logo_url, subscription_status, trial_ends_at, subscription_ends_at, whatsapp_invoices_sent, is_frozen, frozen_reason, state)')
            .eq('auth_user_id', user.id)
            .eq('status', 'active')
            .single();

          if (staff) {
            resolvedRole = staff.role as UserRole;
            const staffShop = staff.shops as any;
            if (staffShop) {
              shop = {
                id: staffShop.id,
                name: staffShop.name,
                shop_type: staffShop.shop_type,
                gst_registered: staffShop.gst_registered,
                inventory_enabled: staffShop.inventory_enabled,
                logo_url: staffShop.logo_url,
                subscription_status: staffShop.subscription_status,
                trial_ends_at: staffShop.trial_ends_at,
                subscription_ends_at: staffShop.subscription_ends_at,
                whatsapp_invoices_sent: staffShop.whatsapp_invoices_sent,
                is_frozen: staffShop.is_frozen,
                frozen_reason: staffShop.frozen_reason,
                state: staffShop.state,
              } as any;
            }
          }
        }

        if (shop) {
          const now = new Date();
          const trialEnds = shop.trial_ends_at ? new Date(shop.trial_ends_at) : null;
          const subEnds = shop.subscription_ends_at ? new Date(shop.subscription_ends_at) : null;
          
          let shouldExpire = false;
          if ((shop.subscription_status || 'trial') === 'trial' && trialEnds && trialEnds < now) {
            shouldExpire = true;
          } else if (shop.subscription_status === 'active' && subEnds && subEnds < now) {
            shouldExpire = true;
          }
          
          if (shouldExpire) {
            shop.subscription_status = 'expired';
            // Update database to expired (non-blocking client update)
            supabase
              .from('shops')
              .update({ subscription_status: 'expired' })
              .eq('id', shop.id)
              .then((res: any) => {
                if (res.error) console.error('Failed to auto-expire shop subscription in Navbar:', res.error);
              });
          }

          setShopInfo(shop as any);
          setUserRole(resolvedRole);
          setShopLoaded(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('trubill_navbar_shop_info', JSON.stringify(shop));
            localStorage.setItem('trubill_navbar_role', resolvedRole);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('impersonate');
      if (tokenFromUrl) {
        document.cookie = `impersonate_token=${tokenFromUrl}; path=/; max-age=3600; SameSite=Lax`;
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const token = getCookie('impersonate_token');
    setImpersonateToken(token || null);

    if (token) {
      fetch(`/api/admin/impersonate/status?token=${token}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTargetEmail(data.email);
            setExpiresInMinutes(Math.max(0, Math.round(data.expiresInSeconds / 60)));
          } else {
            document.cookie = 'impersonate_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            setImpersonateToken(null);
          }
        })
        .catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    if (!impersonateToken || expiresInMinutes <= 0) return;

    const interval = setInterval(() => {
      setExpiresInMinutes((prev) => {
        if (prev <= 1) {
          document.cookie = 'impersonate_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          setImpersonateToken(null);
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [impersonateToken, expiresInMinutes]);

  const handleEndImpersonation = async () => {
    if (!impersonateToken) return;

    try {
      await fetch('/api/admin/impersonate/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: impersonateToken }),
      });
    } catch (e) {
      console.error('Failed to end impersonation:', e);
    }

    document.cookie = 'impersonate_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setImpersonateToken(null);
    window.location.href = '/admin';
  };

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('trubill_navbar_shop_info');
        localStorage.removeItem('trubill_navbar_role');
        localStorage.removeItem('trubill_navbar_low_stock');
      }
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    window.location.href = '/login';
  };

  return (
    <>
      {shopInfo?.is_frozen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white z-[99999] p-6 text-center select-none">
          <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-650" />
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
              🔒
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mb-2">
              Account Temporarily Frozen
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Your business account for <strong className="text-slate-100 font-extrabold">{shopInfo.name}</strong> has been temporarily frozen by platform administration.
            </p>
            {shopInfo.frozen_reason && (
              <div className="bg-slate-900/50 border border-slate-700/30 p-4 rounded-2xl mb-8">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1.5">
                  Reason for Freeze
                </p>
                <p className="text-xs font-semibold text-slate-300 italic">
                  "{shopInfo.frozen_reason}"
                </p>
              </div>
            )}
            <div className="space-y-3">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '919080689844'}?text=My%20account%20for%20${encodeURIComponent(shopInfo.name)}%20is%2520frozen.%20Please%20help.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-2xl shadow-lg shadow-emerald-600/15 hover:shadow-emerald-600/25 transition-all duration-300"
              >
                💬 Contact Support on WhatsApp
              </a>
              <button
                onClick={handleLogout}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs py-3 rounded-2xl transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      {impersonateToken && (
        <div className="fixed top-0 left-0 right-0 bg-amber-600 text-white text-xs md:text-sm font-semibold flex items-center justify-between px-6 py-2.5 z-[100] shadow-md">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">🕵️</span>
            <span>
              Viewing as Owner <strong className="underline">{targetEmail || '...'}</strong> (Session expires in {expiresInMinutes} {expiresInMinutes === 1 ? 'minute' : 'minutes'})
            </span>
          </div>
          <button
            onClick={handleEndImpersonation}
            className="bg-white text-amber-700 hover:bg-amber-50 transition-colors px-3 py-1 rounded-md text-xs font-bold shadow-sm"
          >
            End Session
          </button>
        </div>
      )}

      {announcement && (
        <div 
          className="fixed left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs md:text-sm font-semibold flex items-center justify-center gap-2 px-6 py-2.5 z-[99] shadow-md h-[40px]"
          style={{ top: impersonateToken ? '40px' : '0' }}
        >
          <span className="animate-bounce">📢</span>
          <span>{announcement}</span>
        </div>
      )}

      {/* Global CSS Injector to offset pages on desktop and mobile view */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 768px) {
          body {
            padding-left: 18rem !important;
            ${(impersonateToken || announcement) ? `padding-top: ${(impersonateToken ? 40 : 0) + (announcement ? 40 : 0)}px !important;` : ''}
          }
          .sidebar {
            ${(impersonateToken || announcement) ? `top: ${(impersonateToken ? 40 : 0) + (announcement ? 40 : 0)}px !important;` : ''}
          }
        }
        @media (max-width: 767px) {
          body {
            padding-top: ${(impersonateToken ? 40 : 0) + (announcement ? 40 : 0) + 56}px !important;
          }
          .mobile-header-fixed {
            position: fixed !important;
            top: ${(impersonateToken ? 40 : 0) + (announcement ? 40 : 0)}px;
            left: 0;
            right: 0;
            z-index: 50;
          }
        }
      `}} />

      {/* ─── DESKTOP LEFT SIDEBAR (>= 768px) ─── */}
      <aside className="hidden md:flex flex-col w-72 bg-[#1E3A8A] fixed left-0 top-0 bottom-0 z-40 p-6 sidebar">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/trubill-logo.png" alt="TruBill logo" className="w-10 h-10 object-contain shrink-0 brightness-0 invert" loading="lazy" />
          <div>
            <span className="font-heading font-black text-base leading-none block text-white">
              TruBill
            </span>
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider mt-0.5 block">Sales Invoice</span>
          </div>
        </div>

        {/* Quick Action: New Sales Invoice */}
        <Link href="/invoice/new" className="mb-6 block">
          <button className="bg-white text-[#1E3A8A] font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#1E3A8A]">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Sales Invoice
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
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-150 border-l-4 ${
                    isActive
                      ? 'bg-white/10 border-white text-white font-medium'
                      : 'border-transparent text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-white/60'}>
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
        <div className="border-t border-white/20 pt-4 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(shopInfo?.name || 'AS').slice(0, 2).toUpperCase()}
            </div>
             <div className="truncate flex-1">
              <p className="text-xs font-medium text-white truncate">{shopInfo?.name || 'Active Shop'}</p>
              <p className="text-xs text-white/60 font-semibold uppercase tracking-wider truncate">
                {shopInfo?.state || (shopInfo?.shop_type ? shopInfo.shop_type.replace('_', ' ') : 'Tamil Nadu, IN')}
              </p>
              {userRole !== 'owner' && (
                <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-none uppercase text-white mt-1 ${
                  userRole === 'admin' ? 'bg-[#16a34a]' : userRole === 'billing_staff' ? 'bg-[#2563eb]' : 'bg-[#6b7280]'
                }`}>
                  {userRole === 'admin' ? 'Admin' : userRole === 'billing_staff' ? 'Billing' : 'View Only'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors cursor-pointer"
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
      <div className="mobile-header-fixed md:hidden w-full exclude-blur">
        {/* Dark Top Strip (Navy Blue) */}
        <div className="bg-[#001048] h-1 w-full" />
        
        <nav className="bg-white/95 backdrop-blur-xl border-b border-[#e8eaed]">
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
                <img src="/trubill-logo.png" alt="TruBill logo" className="w-8 h-8 object-contain shrink-0" loading="lazy" />
                <span className="font-heading font-black text-sm">
                  <span className="text-[#001048]">Tru</span>
                  <span className="text-[#0050e8]">Bill</span>
                </span>
              </Link>
            </div>

            <div className="flex flex-col items-end justify-center">
              {!shopLoaded ? (
                /* Shimmer skeleton while data loads */
                <div className="h-6 w-28 rounded-lg bg-gray-200 animate-pulse" />
              ) : (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex items-center gap-1.5 bg-[#f3f4f6] hover:bg-[#e5e7eb] px-2 py-1 rounded-lg transition-colors max-w-[160px]"
                  aria-label="Open navigation menu"
                >
                  {/* Shop logo / initials */}
                  <div className="w-5 h-5 rounded bg-[#0050e8]/10 flex items-center justify-center overflow-hidden border border-[#e8eaed] shrink-0">
                    {shopInfo?.logo_url ? (
                      <img src={shopInfo.logo_url} alt="Shop logo" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-[8px] font-bold text-[#0050e8] leading-none">
                        {(shopInfo?.name || 'TB').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 truncate max-w-[110px]">
                    {shopInfo?.name || 'My Shop'}
                  </span>
                </button>
              )}
              {shopLoaded && userRole !== 'owner' && (
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-none uppercase text-white mt-0.5 ${
                  userRole === 'admin' ? 'bg-[#16a34a]' : userRole === 'billing_staff' ? 'bg-[#2563eb]' : 'bg-[#6b7280]'
                }`}>
                  {userRole === 'admin' ? 'Admin' : userRole === 'billing_staff' ? 'Billing' : 'View Only'}
                </span>
              )}
            </div>
          </div>
        </nav>
        {/* Bottom Accent Strip (Primary Blue) */}
        <div className="bg-[#0050e8] h-0.5 w-full" />
      </div>

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
                  <div className="w-8 h-8 rounded-lg bg-[#0050e8]/10 flex items-center justify-center overflow-hidden border border-[#e8eaed] shrink-0">
                    {shopInfo?.logo_url ? (
                      <img src={shopInfo.logo_url} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-sm font-bold text-[#0050e8]">
                        {(shopInfo?.name || 'TB').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-heading font-extrabold text-[#1a1d26] text-xs leading-none block truncate uppercase">
                      {shopInfo?.name || 'TruBill'}
                    </span>
                    <span className="text-[9px] font-bold text-[#0050e8] uppercase tracking-wider mt-0.5 block truncate">
                      {shopInfo?.shop_type ? shopInfo.shop_type.replace('_', ' ') : 'Sales Invoice'}
                    </span>
                    {userRole !== 'owner' && (
                      <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-none uppercase text-white mt-1 ${
                        userRole === 'admin' ? 'bg-[#16a34a]' : userRole === 'billing_staff' ? 'bg-[#2563eb]' : 'bg-[#6b7280]'
                      }`}>
                        {userRole === 'admin' ? 'Admin' : userRole === 'billing_staff' ? 'Billing' : 'View Only'}
                      </span>
                    )}
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
                <button className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer">
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
                            ? 'bg-[#0050e8]/10 text-[#0050e8]'
                            : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#1a1d26]'
                        }`}
                      >
                        <span className={isActive ? 'text-[#0050e8]' : 'text-[#9ca3af]'}>
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
                  <div className="w-9 h-9 rounded-full bg-[#0050e8]/10 flex items-center justify-center text-[#0050e8] shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-xs font-bold text-[#1a1d26] truncate">{shopInfo?.name || 'Active Shop'}</p>
                    <p className="text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wider truncate">
                      {shopInfo?.state || (shopInfo?.shop_type ? shopInfo.shop_type.replace('_', ' ') : 'Tamil Nadu, IN')}
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
            {(() => {
              const desiredOrder = ['/dashboard', '/invoice/new', '/customers'];
              return activeNavItems
                .filter((item) => desiredOrder.includes(item.href))
                .sort((a, b) => desiredOrder.indexOf(a.href) - desiredOrder.indexOf(b.href));
            })().map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                if (item.isMain) {
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 -mt-5 rounded-2xl bg-[#0050e8] text-white shadow-lg shadow-[#0050e8]/25 flex items-center justify-center cursor-pointer"
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
                      ? 'text-[#0050e8] bottom-nav-active'
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

      {/* Subscription Banner */}
      <SubscriptionBanner shop={shopInfo} />
    </>
  );
}
