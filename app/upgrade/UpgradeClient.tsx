'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import { Shop } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamic script loader for Razorpay Checkout SDK
const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface UpgradeClientProps {
  shop: Shop;
  supportPhone: string;
}

export default function UpgradeClient({ shop, supportPhone }: UpgradeClientProps) {
  const { showToast } = useToast();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Razorpay states
  const [isPaying, setIsPaying] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [mockOrder, setMockOrder] = useState<any>(null);

  const trialEnds = shop.trial_ends_at ? new Date(shop.trial_ends_at) : null;
  const subEnds = shop.subscription_ends_at ? new Date(shop.subscription_ends_at) : null;
  const isTrial = shop.subscription_status === 'trial';
  const isActive = shop.subscription_status === 'active';
  const isExpired = shop.subscription_status === 'expired' || shop.subscription_status === 'cancelled';

  // Calculate days remaining
  const now = new Date();
  let daysRemaining = 0;
  if (isTrial && trialEnds) {
    daysRemaining = Math.max(0, Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  } else if (isActive && subEnds) {
    daysRemaining = Math.max(0, Math.ceil((subEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Razorpay Checkout handler
  const handleRazorpayPayment = async () => {
    setIsPaying(true);
    try {
      // 1. Create order on server
      const orderRes = await fetch('/api/upgrade/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        showToast(orderData.error || 'Failed to initialize payment order', 'error');
        setIsPaying(false);
        return;
      }

      const { order, key_id, shop: shopDetails, is_mock } = orderData;

      if (is_mock) {
        setIsMockMode(true);
        setMockOrder(order);
        showToast('Developer Sandbox Mode active. Click the button to simulate.', 'info');
        setIsPaying(false);
        return;
      }

      // 2. Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast('Razorpay SDK failed to load. Check your internet connection.', 'error');
        setIsPaying(false);
        return;
      }

      // 3. Configure options & Open standard checkout
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'TruBill Pro Plan',
        description: `1 Month Auto-Activation - ${shopDetails.name}`,
        order_id: order.id,
        prefill: {
          name: shopDetails.name,
          email: shopDetails.email || '',
          contact: shopDetails.phone || '',
        },
        theme: {
          color: '#0050e8',
        },
        handler: async function (response: any) {
          setIsPaying(true);
          try {
            const verifyRes = await fetch('/api/upgrade/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              showToast('Payment verified! Subscription activated ✓', 'success');
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              showToast(verifyData.error || 'Verification failed', 'error');
              setIsPaying(false);
            }
          } catch {
            showToast('Verification request failed. Contact support.', 'error');
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (e) {
      console.error(e);
      showToast('Error setting up checkout.', 'error');
      setIsPaying(false);
    }
  };

  // Mock/sandbox activation handler
  const handleMockVerify = async () => {
    if (!mockOrder) return;
    setIsPaying(true);
    try {
      const verifyRes = await fetch('/api/upgrade/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: mockOrder.id,
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
          razorpay_signature: 'mock_signature',
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        showToast('Sandbox simulation complete! Subscription activated ✓', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showToast(verifyData.error || 'Mock verification failed', 'error');
        setIsPaying(false);
      }
    } catch {
      showToast('Simulation verification failed.', 'error');
      setIsPaying(false);
    }
  };

  const faqs = [
    {
      q: 'When will my account activate?',
      a: 'Instantly! Your subscription activates automatically within seconds of successful payment — no manual steps needed.'
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We accept UPI (GPay, PhonePe, Paytm), credit/debit cards, netbanking, and popular wallets — all through Razorpay\'s secure gateway.'
    },
    {
      q: 'How do I renew each month?',
      a: 'Simply visit this page again before your subscription expires and make the payment. It will auto-extend your plan instantly.'
    },
    {
      q: 'Can I get a refund?',
      a: 'Yes, absolutely. We offer a 7-day refund guarantee. If you are not satisfied with TruBill, simply contact us within 7 days and we will issue a full refund, no questions asked.'
    }
  ];

  // WhatsApp support link
  const supportWaUrl = `https://wa.me/${supportPhone}?text=${encodeURIComponent(`Hi TruBill, I need help with my subscription. Shop: ${shop.name}`)}`;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />
      
      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-24">
        {/* Header with greeting - Desktop only */}
        <div className="hidden md:flex bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-xs items-center justify-between mb-8 md:sticky md:top-0 md:z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#0050e8]/10 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-[#0050e8] flex items-center justify-center text-white font-black text-sm">
                  PRO
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                Billing & Subscription
              </h1>
              <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium">
                Upgrade your shop to TruBill Pro Plan
              </p>
            </div>
          </div>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 md:hidden">
          <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
            Upgrade Plan
          </h1>
          <p className="text-[10px] text-gray-500 font-semibold mt-1">
            Pay securely via Razorpay. Subscription activates instantly.
          </p>
        </div>

        {/* Current status banner */}
        <div className="mb-8">
          {isTrial && daysRemaining > 0 && (
            <div className="bg-[#eff6ff] border-l-4 border-[#0050e8] p-5 flex items-center gap-4 rounded-none border border-y-[#e5e7eb] border-r-[#e5e7eb] shadow-2xs">
              <span className="text-2xl shrink-0">🎉</span>
              <div>
                <p className="text-sm font-bold text-[#1e3a8a]">Free Trial Active</p>
                <p className="text-xs text-blue-700 mt-0.5">Your trial expires in <strong>{daysRemaining} days</strong>. Upgrade today to continue sending invoices without interruptions.</p>
              </div>
            </div>
          )}
          {isTrial && daysRemaining <= 0 && (
            <div className="bg-[#fffbeb] border-l-4 border-amber-500 p-5 flex items-center gap-4 rounded-none border border-y-[#e5e7eb] border-r-[#e5e7eb] shadow-2xs">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-bold text-[#78350f]">Trial Expired</p>
                <p className="text-xs text-amber-800 mt-0.5">Your 14-day free trial has ended. Upgrade to continue sending professional invoices to customers on WhatsApp.</p>
              </div>
            </div>
          )}
          {isActive && (
            <div className="bg-[#f0fdf4] border-l-4 border-emerald-500 p-5 flex items-center gap-4 rounded-none border border-y-[#e5e7eb] border-r-[#e5e7eb] shadow-2xs">
              <span className="text-2xl shrink-0">✨</span>
              <div>
                <p className="text-sm font-bold text-[#065f46]">Subscription Active</p>
                <p className="text-xs text-emerald-800 mt-0.5">Thank you for subscribing! Your subscription is active and renews on <strong>{subEnds?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> ({daysRemaining} days remaining).</p>
              </div>
            </div>
          )}
          {isExpired && (
            <div className="bg-[#fef2f2] border-l-4 border-red-500 p-5 flex items-center gap-4 rounded-none border border-y-[#e5e7eb] border-r-[#e5e7eb] shadow-2xs">
              <span className="text-2xl shrink-0">🔒</span>
              <div>
                <p className="text-sm font-bold text-[#991b1b]">Subscription Expired</p>
                <p className="text-xs text-red-800 mt-0.5">Your subscription has expired. Please make a payment to restore access to sending invoices.</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Pro Plan Details Card */}
          <div className="md:col-span-6 bg-white border border-[#e5e7eb] rounded-none p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[460px]">
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-[#0050e8] uppercase tracking-wider">TRUBILL PRO PLAN</span>
                <h2 className="text-2xl font-black text-gray-900 mt-1 uppercase tracking-tight font-heading">All-in-One Invoicing</h2>
              </div>

              <div className="flex items-baseline gap-1 border-y border-gray-100 py-4">
                <span className="text-3xl font-black text-gray-900">₹349</span>
                <span className="text-xs font-semibold text-gray-400">/ month</span>
                <span className="ml-auto text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-none uppercase tracking-wide">
                  Tax Included
                </span>
              </div>

              <ul className="space-y-3.5 text-xs font-semibold text-gray-600 pt-1">
                {[
                  'Unlimited Invoices & PDF generation',
                  'Instant Delivery via WhatsApp',
                  'Customer Outstanding & Credit Tracking',
                  'GST Invoice & Auto Tax Calculations',
                  'Inventory Stock Level & Low-Stock Alerts',
                  'One-Click GSTR-1 Sales Report Excel Export',
                  'Purchase Management & ITC verification',
                  'Credit & Debit Notes module',
                  'Daily Backup & Premium SSL Security',
                  'Up to 3 staff logins with custom roles'
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Razorpay Checkout Card */}
          <div className="md:col-span-6 bg-white border border-[#e5e7eb] rounded-none p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 uppercase tracking-tight font-heading">Secure Online Payment</h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Pay securely using UPI, credit/debit cards, netbanking, or wallets. Your subscription activates automatically on payment success.
              </p>
            </div>

            {/* Payment method icons */}
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-none p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Accepted Payment Methods</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: '📱', label: 'UPI / GPay / PhonePe' },
                  { icon: '💳', label: 'Credit & Debit Cards' },
                  { icon: '🏦', label: 'Net Banking' },
                  { icon: '👛', label: 'Wallets' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-1.5 bg-white border border-[#e5e7eb] px-3 py-2 rounded-none">
                    <span className="text-sm">{m.icon}</span>
                    <span className="text-[10px] font-bold text-gray-600">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Sandbox Mode */}
            {isMockMode && mockOrder ? (
              <div className="bg-[#eff6ff] border border-blue-200 p-4 space-y-4 rounded-none">
                <div>
                  <p className="text-[10px] font-bold text-[#1e3a8a] uppercase tracking-wider">🛠️ DEV SANDBOX SIMULATOR</p>
                  <p className="text-xs text-blue-700 mt-1 font-medium leading-relaxed">
                    No live Razorpay keys detected. Test the auto-activation flow by simulating a payment success:
                  </p>
                </div>
                <button
                  onClick={handleMockVerify}
                  disabled={isPaying}
                  className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold py-3 rounded-none text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer min-h-[48px]"
                >
                  {isPaying ? 'Simulating activation...' : 'Simulate Payment Success ✓'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleRazorpayPayment}
                disabled={isPaying}
                className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white font-black py-3.5 rounded-none text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer min-h-[52px] shadow-sm uppercase tracking-wide"
              >
                {isPaying ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Initializing Checkout...
                  </span>
                ) : (
                  'Pay ₹349 & Activate Instantly'
                )}
              </button>
            )}

            <div className="flex items-center justify-center gap-4 opacity-50 pt-1">
              <span className="text-[10px] font-bold tracking-wider text-gray-500">SECURED BY RAZORPAY</span>
              <span className="text-[10px] text-gray-400">•</span>
              <span className="text-[10px] font-bold tracking-wider text-gray-500">256-BIT SSL</span>
            </div>

            {/* Support row */}
            <div className="border-t border-[#e5e7eb] pt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Need help?</p>
              <a
                href={supportWaUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="w-full bg-[#f9fafb] hover:bg-[#f3f4f6] border border-[#e5e7eb] text-gray-700 font-bold py-2.5 px-4 rounded-none text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]">
                  <svg className="w-4 h-4 fill-[#16a34a]" viewBox="0 0 24 24">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.233-1.371a9.936 9.936 0 0 0 4.777 1.224h.005c5.505 0 9.99-4.478 9.992-9.986 0-2.67-1.037-5.178-2.924-7.067C17.195 2.915 14.685 2 12.012 2zm5.72 14.158c-.313.882-1.823 1.626-2.5 1.696-.618.064-1.423.1-3.834-.9-2.827-1.173-4.634-4.048-4.776-4.238-.14-.19-1.134-1.51-1.134-2.883 0-1.373.719-2.048.974-2.316.257-.268.563-.335.751-.335.188 0 .376.002.538.01.168.008.397-.064.622.483.23.56.784 1.91.852 2.052.068.143.113.31.018.497-.094.188-.142.305-.282.469-.142.163-.298.364-.424.488-.14.137-.287.286-.123.57.164.28.728 1.206 1.56 1.95.16.14.316.28.487.41a3.023 3.023 0 0 0 .538.358c.28.163.443.087.608-.103.164-.19.702-.816.892-1.096.188-.28.376-.234.633-.14.258.096 1.642.775 1.925.916.28.14.469.21.538.33.068.118.068.685-.245 1.567z" />
                  </svg>
                  <span>Contact Support on WhatsApp</span>
                </button>
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="mt-16 max-w-2xl mx-auto space-y-4">
          <h2 className="text-lg font-bold text-gray-900 text-center uppercase tracking-tight font-heading">Frequently Asked Questions</h2>
          <div className="divide-y divide-slate-200 border border-[#e5e7eb] bg-white rounded-none overflow-hidden shadow-xs">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="flex flex-col">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-800 text-xs hover:bg-[#f9fafb] transition-colors min-h-[56px] cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-0 text-gray-500 text-xs font-semibold leading-relaxed border-t border-[#f3f4f6] bg-[#f9fafb]/30">
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
      </PageTransition>
    </div>
  );
}
