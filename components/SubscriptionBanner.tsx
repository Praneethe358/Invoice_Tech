'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shop } from '@/lib/types';
import { getSubscriptionAccess, SubscriptionAccess } from '@/lib/subscription';

interface SubscriptionBannerProps {
  shop: Shop | null;
}

export default function SubscriptionBanner({ shop }: SubscriptionBannerProps) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && shop) {
      // Clear/check dismissed status for this session
      const isDismissed = sessionStorage.getItem(`trubill_sub_dismissed_${shop.id}`);
      if (isDismissed === 'true') {
        setDismissed(true);
      }
    }
  }, [shop]);

  // Don't show on admin, upgrade, login, signup, public status, or public shop pages
  const isExcludedPage = 
    pathname.startsWith('/admin') ||
    pathname.startsWith('/upgrade') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/status/') ||
    pathname.startsWith('/shop/');

  if (!mounted || !shop || isExcludedPage) return null;

  const access = getSubscriptionAccess(shop);
  const { urgency, status, daysRemaining, message } = access;

  // No banner needed for active shops with high remaining days
  if (urgency === 'none' && status === 'active') return null;

  // Determine if this banner is dismissible
  const isDismissible = urgency === 'none' || (status === 'active' && urgency === 'warning');

  // If already dismissed this session, don't render
  if (isDismissible && dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`trubill_sub_dismissed_${shop.id}`, 'true');
    }
  };

  // Banner styles based on urgency
  let bgClass = 'bg-blue-50 border-b-2 border-blue-500 text-blue-900';
  let icon = '🎉';
  let text = '';
  let ctaText = 'Upgrade — ₹299/month';

  if (urgency === 'none' && status === 'trial') {
    bgClass = 'bg-[#eff6ff] border-b-2 border-[#3b82f6] text-[#1e3a8a]';
    icon = '🎉';
    text = `Free trial — ${daysRemaining} days remaining. Upgrade to keep sending invoices after your trial.`;
    ctaText = 'Upgrade — ₹299/month';
  } else if (urgency === 'warning' && status === 'trial') {
    bgClass = 'bg-[#fffbeb] border-b-2 border-[#f59e0b] text-[#78350f]';
    icon = '⚠️';
    text = `Trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}! Upgrade now to avoid interruption.`;
    ctaText = 'Upgrade Now';
  } else if (urgency === 'warning' && status === 'active') {
    bgClass = 'bg-[#fffbeb] border-b-2 border-[#f59e0b] text-[#78350f]';
    icon = '🔔';
    text = `Subscription renews in ${daysRemaining} days. Pay ₹299 to continue uninterrupted.`;
    ctaText = 'Pay Now';
  } else if (urgency === 'blocked') {
    bgClass = 'bg-[#fef2f2] border-b-2 border-[#ef4444] text-[#991b1b]';
    icon = '🔒';
    const subType = status === 'cancelled' ? 'subscription' : 'free trial';
    text = `Your ${subType} has ended. Upgrade to continue sending invoices.`;
    ctaText = 'Upgrade Now — ₹299/month';
  }

  return (
    <>
      {/* Inject padding/margin offsets and blur filter if blocked */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 768px) {
          body {
            padding-top: 48px !important;
          }
          .sub-banner-position {
            top: 0px !important;
          }
          .md\\:sticky.md\\:top-0 {
            top: 48px !important;
          }
        }
        @media (max-width: 767px) {
          body {
            padding-top: 104px !important;
          }
          .mobile-header-fixed {
            top: 48px !important;
          }
          .sub-banner-position {
            top: 0px !important;
          }
        }
        ${urgency === 'blocked' ? `
          main, #main-content, [role="main"], .page-container, .min-h-screen > div {
            filter: blur(2px) !important;
            pointer-events: none !important;
          }
        ` : ''}
      `}} />

      <motion.div
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -48, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed left-0 md:left-72 right-0 h-12 z-[40] ${bgClass} flex items-center justify-between px-4 shadow-sm text-xs font-semibold sub-banner-position`}
      >
        <div className="flex items-center gap-2 overflow-hidden mr-2 truncate">
          <span className="text-base">{icon}</span>
          <span className="truncate">{text}</span>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/upgrade">
            <button className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold px-3 py-1 rounded-md text-[11px] shadow-xs active:scale-[0.98] transition-all cursor-pointer">
              {ctaText}
            </button>
          </Link>

          {isDismissible && (
            <button
              onClick={handleDismiss}
              className="text-current opacity-60 hover:opacity-100 p-1 cursor-pointer"
              aria-label="Dismiss banner"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
