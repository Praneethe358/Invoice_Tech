'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const TERMS_HTML = `
<style>
  .terms-content h1 {
    font-size: 2.25rem;
    font-weight: 800;
    color: #001048;
    margin-bottom: 0.5rem;
  }
  .terms-content p {
    margin-bottom: 1.25rem;
    line-height: 1.75;
    color: #4b5563;
  }
  .terms-content h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1d26;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid #e8eaed;
    padding-bottom: 0.25rem;
  }
  .terms-content ul {
    list-style-type: disc;
    margin-left: 1.5rem;
    margin-bottom: 1.25rem;
    color: #4b5563;
  }
  .terms-content li {
    margin-bottom: 0.5rem;
    line-height: 1.6;
  }
  .terms-content strong {
    color: #1a1d26;
  }
  .terms-content a {
    color: #0050e8;
    text-decoration: underline;
  }
  .terms-content a:hover {
    color: #0043c4;
  }
</style>

<div class="terms-content">
  <span style="display: block; margin: 0 auto 3.125rem; width: 11.125rem; height: 3.5rem; background: url(/trubill-logo.png) center no-repeat; background-size: contain;"></span>
  
  <h1>Terms of Service</h1>
  <p><em>Last updated: June 20, 2026</em></p>

  <p>These Terms of Service ("Terms") govern your access to and use of TruBill Invoice (the "Services"), operated by TruBill, doing business as "TruBill Invoice" ("TruBill," "we," "us," or "our"). By creating an account, accessing, or using the Services, you agree to be bound by these Terms. If you do not agree, do not use the Services.</p>

  <h2>1. Definitions</h2>
  <ul>
    <li><strong>"Shop Owner"</strong> means the individual or business that registers a shop account on TruBill.</li>
    <li><strong>"Staff"</strong> means individuals invited by a Shop Owner to access the Shop Owner's account under a defined role.</li>
    <li><strong>"User"</strong> means any Shop Owner or Staff member using the Services.</li>
    <li><strong>"Customer"</strong> means an end customer of a Shop Owner who receives invoices via WhatsApp.</li>
  </ul>

  <h2>2. Eligibility and Account Registration</h2>
  <p>You must be at least 18 years old and capable of entering into a binding contract under Indian law to create a Shop Owner account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account, including actions taken by Staff you invite. You agree to provide accurate, current, and complete information during registration, including your shop name, GSTIN (if applicable), and contact details.</p>

  <h2>3. Description of Services</h2>
  <p>TruBill Invoice is a WhatsApp-native invoicing and GST compliance platform that allows Shop Owners to create and send GST-compliant invoices, manage customers and inventory, record payments and purchases, generate GST return data (including GSTR-1 and GSTR-3B formatted exports), and manage staff access with role-based permissions.</p>

  <h2>4. Subscription, Free Trial, and Payments</h2>
  <p>TruBill Invoice offers a monthly subscription at <strong>₹349 (Indian Rupees) per month</strong>. New accounts receive a <strong>14-day free trial</strong> with no payment required. At the end of the trial period, if no payment has been made, your account will not be automatically charged; instead, the ability to send new invoices will be suspended until you upgrade to a paid subscription. All existing data remains accessible and viewable during suspension.</p>
  <p>Payment is accepted via UPI only. Subscriptions are not billed automatically — you must manually make a UPI payment and notify us via WhatsApp or email at <strong>trubillapp@gmail.com</strong>. Subscriptions are activated or renewed manually, typically within 2 hours of payment confirmation. TruBill reserves the right to suspend or terminate access to the Services upon non-payment or expiry of a subscription period.</p>
  <p><strong>Refunds:</strong> If you are not satisfied with the Services, you may request a full refund within 7 days of payment, no questions asked, by contacting us at trubillapp@gmail.com.</p>

  <h2>5. User Content and Uploads</h2>
  <p>Shop Owners may upload content to the Services, including but not limited to a shop logo image. You retain ownership of any content you upload, but grant TruBill a limited license to host, store, and display that content as necessary to provide the Services (for example, displaying your logo on invoices and your public shop page). You represent that you have the right to upload any content you submit and that it does not infringe any third party's rights.</p>

  <h2>6. Acceptable Use</h2>
  <p>You agree not to:</p>
  <ul>
    <li>Use the Services to advertise or offer to sell goods and services unrelated to your registered shop;</li>
    <li>Sell, rent, or otherwise transfer your account or profile to another party;</li>
    <li>Upload or submit false, inaccurate, or misleading business information, invoices, or GST data;</li>
    <li>Use the platform to generate invoices or GST filings for businesses other than your own registered shop without authorization;</li>
    <li>Attempt to access another shop owner's account, data, or invoices without authorization;</li>
    <li>Use automated scripts, bots, or scrapers to access or interact with the Services.</li>
  </ul>
  <p>Violation of these terms may result in suspension or termination of your account at our discretion.</p>

  <h2>7. Intellectual Property</h2>
  <p>The TruBill name, logo, design, and all underlying software, content, and trademarks are the exclusive property of TruBill and are protected by applicable intellectual property laws. Nothing in these Terms grants you any right to use TruBill's branding except as necessary to use the Services as intended.</p>

  <h2>8. GST Filing Disclaimer</h2>
  <p>TruBill Invoice generates GST return data, including GSTR-1 and GSTR-3B formatted exports, based solely on information entered by the User. TruBill Invoice is <strong>not</strong> a GST Suvidha Provider (GSP) and is not affiliated with or endorsed by the Goods and Services Tax Network (GSTN) or the Government of India. Users are solely responsible for verifying the accuracy of all GST data before submission to the official GST portal. TruBill Invoice shall not be liable for any penalties, interest, or legal consequences arising from incorrect or incomplete GST filings made using data generated by this platform.</p>

  <h2>9. Third-Party Services and Links</h2>
  <p>The Services integrate with or link to third-party services including WhatsApp (operated by Meta Platforms), the official GST portal (gst.gov.in), and infrastructure providers such as Supabase and Vercel. TruBill is not responsible for the content, policies, or practices of these third-party services. Your use of WhatsApp to receive invoices is also subject to Meta's own terms and policies.</p>

  <h2>10. Disclaimer of Warranties</h2>
  <p>The Services are provided "as is" and "as available" without warranties of any kind, express or implied. TruBill does not warrant that the Services will be uninterrupted, error-free, or completely secure, or that any GST or financial calculations will be free of errors. You use the Services at your own risk.</p>

  <h2>11. Limitation of Liability</h2>
  <p>To the maximum extent permitted by law, TruBill's total liability arising out of or relating to these Terms or the Services shall not exceed the amount you paid to TruBill in the 6 months preceding the claim. TruBill shall not be liable for any indirect, incidental, special, or consequential damages, including loss of profits, data, or business opportunities, arising from your use of the Services.</p>

  <h2>12. Indemnification</h2>
  <p>You agree to indemnify and hold TruBill harmless from any claims, damages, liabilities, and expenses arising from your use of the Services, your violation of these Terms, or your violation of any rights of a third party, including claims related to inaccurate GST filings or invoice data you have entered.</p>

  <h2>13. Termination</h2>
  <p>You may stop using the Services at any time. TruBill may suspend or terminate your access to the Services at any time, with or without notice, for conduct that violates these Terms, non-payment of subscription fees, or for any other reason at our discretion. Upon termination, your right to use the Services will immediately cease, though you may request an export of your data prior to termination where reasonably possible.</p>

  <h2>14. Dispute Resolution</h2>
  <p>In the event of any dispute arising out of or relating to these Terms or the Services, the parties agree to first attempt to resolve the dispute through informal negotiation for a period of <strong>30 days</strong>. If the dispute is not resolved within that period, it shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996 (India). The arbitration shall be conducted by a single arbitrator, seated in <strong>Coimbatore, Tamil Nadu, India</strong>, and the language of arbitration shall be English.</p>

  <h2>15. Governing Law</h2>
  <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. The courts of Coimbatore, Tamil Nadu shall have exclusive jurisdiction over any matters not subject to arbitration under Section 14.</p>

  <h2>16. Changes to These Terms</h2>
  <p>We may update these Terms from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. If we make material changes, we will notify you by email at the address associated with your account. Continued use of the Services after such changes constitutes acceptance of the updated Terms.</p>

  <h2>17. Copyright Infringement Notices</h2>
  <p>If you believe that content available through the Services infringes your copyright, please notify us at <strong>trubillapp@gmail.com</strong> with sufficient detail to identify the content and your claim.</p>

  <h2>18. Contact Us</h2>
  <p>If you have any questions about these Terms, please contact us:</p>
  <ul>
    <li>Email: <a href="mailto:trubillapp@gmail.com">trubillapp@gmail.com</a></li>
    <li>By visiting: <a href="https://trubill.in/contact">trubill.in</a></li>
  </ul>

  <p><strong>TruBill</strong>, doing business as <strong>TruBill Invoice</strong></p>
</div>
`;

export default function TermsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-page min-h-screen bg-[#f5f6fa] text-[#1a1d26] flex flex-col justify-between">
      {/* ─── Navbar ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 w-full shrink-0">
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

            {/* Mobile Left: Hamburger + Logo */}
            <div className="flex md:hidden items-center gap-3">
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

              <Link href="/" className="flex items-center gap-2">
                <img src="/trubill-logo.png" alt="TruBill Logo" className="w-12 h-12 object-contain shrink-0" />
                <span className="font-heading font-black text-xl tracking-tight">
                  <span className="text-[#001048]">Tru</span>
                  <span className="text-[#0050e8]">Bill</span>
                </span>
              </Link>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8 font-semibold">
              <Link href="/#features" className="text-sm text-[#4b5563] hover:text-[#1a1d26] transition-colors">
                Features
              </Link>
              <Link href="/#how-it-works" className="text-sm text-[#4b5563] hover:text-[#1a1d26] transition-colors">
                How It Works
              </Link>
              <Link href="/#faq" className="text-sm text-[#4b5563] hover:text-[#1a1d26] transition-colors">
                FAQ
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

      {/* ─── Mobile Dropdown Overlay ────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-14 md:top-16 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-14 md:top-16 left-0 right-0 z-50 w-full bg-white border-b border-[#e8eaed] shadow-2xl flex flex-col md:hidden overflow-y-auto max-h-[calc(100vh-56px)]"
            >
              <div className="flex flex-col space-y-3 px-5 pt-4">
                <Link
                  href="/#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  How It Works
                </Link>
                <Link
                  href="/#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  FAQ
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  Login
                </Link>
              </div>
              <div className="px-5 pt-4">
                <p className="text-[11px] text-[#6b7280] leading-relaxed">
                  Easy WhatsApp billing, manage customer payments, track outstanding balances, control inventory, and simplify accounting with TruBill - Tamil Nadu's best lightweight billing software. Start billing free today.
                </p>
              </div>
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

      {/* ─── Main Content Container ────────────────────────────── */}
      <main className="flex-1 bg-white border-y border-[#e8eaed]">
        <div className="max-w-[800px] mx-auto px-6 py-10 sm:py-16 text-slate-800 leading-relaxed font-sans">
          <div dangerouslySetInnerHTML={{ __html: TERMS_HTML }} />
        </div>
      </main>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#e8eaed] text-sm text-[#4b5563] shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pb-8 md:pb-12 border-b border-[#e8eaed]">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <img src="/trubill-logo.png" alt="TruBill Logo" className="w-8 h-8 object-contain shrink-0" />
                <span className="font-heading font-black text-base">
                  <span className="text-[#001048]">Tru</span>
                  <span className="text-[#0050e8]">Bill</span>
                  <span className="text-[#1a1d26]"> Invoice</span>
                </span>
              </div>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                Simple, lightweight billing software designed for small businesses, supermarkets, and freelancers in Tamil Nadu.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/#features" className="hover:text-[#1a1d26] transition-colors">Features</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-[#1a1d26] transition-colors">How it Works</Link></li>
                <li><Link href="/login" className="hover:text-[#1a1d26] transition-colors">Sandbox Login</Link></li>
                <li><Link href="/signup" className="hover:text-[#1a1d26] transition-colors">Create Account</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/#faq" className="hover:text-[#1a1d26] transition-colors">FAQ</Link></li>
                <li><span className="text-[#9ca3af]">A4 PDF Format</span></li>
                <li><span className="text-[#9ca3af]">A5 PDF Format</span></li>
                <li><span className="text-[#9ca3af]">Tax Calculator</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">HQ Address</h4>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                TruBill Invoice<br />
                Coimbatore, Tamil Nadu<br />
                trubillapp@gmail.com
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between pt-6 md:pt-8 text-[11px] sm:text-xs text-[#6b7280] gap-3">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1">
              <span>© {new Date().getFullYear()} TruBill. All rights reserved.</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span>MSME Registered — UDYAM-TN-03-0331333</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <Link href="/privacy" className="hover:text-[#1a1d26] transition-colors">Privacy Policy</Link>
              <span className="hidden sm:inline text-slate-300">•</span>
              <Link href="/terms" className="hover:text-[#1a1d26] transition-colors">Terms of Service</Link>
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
