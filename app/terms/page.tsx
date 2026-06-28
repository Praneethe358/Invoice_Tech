'use client';

import MarketingNavbar from "@/components/MarketingNavbar";
import MarketingFooter from "@/components/MarketingFooter";

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
  <p>TruBill Invoice offers a monthly subscription at <strong>₹349 (Indian Rupees) per month</strong>. New accounts receive a <strong>7-day free trial</strong> with no payment required. At the end of the trial period, if no payment has been made, your account will not be automatically charged; instead, the ability to send new invoices will be suspended until you upgrade to a paid subscription. All existing data remains accessible and viewable during suspension.</p>
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
  return (
    <div className="landing-page min-h-screen bg-[#f5f6fa] text-[#1a1d26] flex flex-col justify-between">
      <MarketingNavbar />

      {/* ─── Main Content Container ────────────────────────────── */}
      <main className="flex-1 bg-white border-y border-[#e8eaed]">
        <div className="max-w-[800px] mx-auto px-6 py-10 sm:py-16 terms-content">
          <div dangerouslySetInnerHTML={{ __html: TERMS_HTML }} />
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
