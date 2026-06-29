import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="bg-white border-t border-[#e8eaed] text-sm text-[#4b5563]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pb-8 md:pb-12 border-b border-[#e8eaed]">
          {/* Logo/Info column */}
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
              Simple, lightweight billing software designed for growing businesses, supermarkets, and freelancers in Tamil Nadu.
            </p>
          </div>

          {/* Product column */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#features" className="hover:text-[#1a1d26] transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-[#1a1d26] transition-colors">How it Works</Link></li>
              <li><Link href="/login" className="hover:text-[#1a1d26] transition-colors">Sandbox Login</Link></li>
              <li><Link href="/signup" className="hover:text-[#1a1d26] transition-colors">Create Account</Link></li>
            </ul>
          </div>

          {/* Resources column */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#faq" className="hover:text-[#1a1d26] transition-colors">FAQ</Link></li>
              <li><span className="text-[#9ca3af]">A4 PDF Format</span></li>
              <li><span className="text-[#9ca3af]">A5 PDF Format</span></li>
              <li><span className="text-[#9ca3af]">Tax Calculator</span></li>
            </ul>
          </div>

          {/* Address column */}
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
  );
}
