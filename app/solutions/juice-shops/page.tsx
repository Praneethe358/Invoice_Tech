import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GST Billing App for Juice Shops & Beverage Businesses — TruBill",
  description:
    "TruBill helps Tamil Nadu juice shops, smoothie bars, and beverage counters generate GST invoices, track ingredient inventory, and file GSTR-1 returns automatically.",
  keywords: [
    "juice shop billing software",
    "beverage shop GST invoice Tamil Nadu",
    "smoothie bar billing app India",
    "juice counter invoice maker",
  ],
  alternates: {
    canonical: "https://trubill.in/solutions/juice-shops",
  },
  openGraph: {
    title: "Juice Shop & Beverage Business Billing — TruBill",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://trubill.in",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Solutions",
      "item": "https://trubill.in/solutions",
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Juice Shops & Beverage Businesses",
      "item": "https://trubill.in/solutions/juice-shops",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is there a GST billing app for juice shops in Tamil Nadu?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. TruBill is a GST billing app built for Tamil Nadu juice shops and beverage businesses. It generates GST-compliant counter receipts, tracks ingredient inventory, produces daily sales reports, and shares invoices via WhatsApp.",
      },
    },
    {
      "@type": "Question",
      "name": "What HSN code should a juice shop use for GST billing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Tamil Nadu juice shops typically use SAC code 996331 for restaurant or counter food services. TruBill auto-suggests the correct SAC code based on your business type during invoice creation.",
      },
    },
  ],
};

export default function JuiceShopsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0ea5e9] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <nav className="text-sm text-blue-200 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <span>Solutions</span>
              <span className="mx-2">›</span>
              <span className="text-white font-semibold">Juice Shops</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-3xl">
              TruBill: Fast GST Billing for Tamil Nadu Juice Shops &amp; Beverage Counters
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl leading-relaxed">
              TruBill is the fastest GST billing app for juice shops in Tamil Nadu. Generate counter receipts, track ingredient stock, and share invoices on WhatsApp — in under 3 seconds per order.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-[#1E3A8A] font-bold text-base px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
              >
                Try TruBill Free
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="space-y-16">
            {/* Q&A Section */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                Is there a GST billing app built for juice shops in Tamil Nadu?
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                TruBill is a GST billing app purpose-built for Tamil Nadu juice shops, smoothie bars, and beverage counters. TruBill generates GST-compliant counter receipts instantly, auto-suggests SAC code 996331 for food and beverage services, and lets you share digital invoices on WhatsApp — eliminating the need for thermal printers at your counter.
              </p>
            </div>

            {/* Features Section */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
                Features TruBill Offers for Juice Shops and Beverage Businesses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "🧃", title: "Counter billing optimised for speed" },
                  { icon: "📦", title: "Ingredient inventory tracking" },
                  { icon: "🏷️", title: "SAC code 996331 auto-suggestion" },
                  { icon: "📊", title: "Daily sales reports and revenue analytics" },
                  { icon: "💬", title: "WhatsApp invoice sharing" },
                  { icon: "📱", title: "Works on phone, tablet, or desktop" },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-[#1E3A8A]/20 hover:bg-blue-50/30 transition-all"
                  >
                    <span className="text-2xl shrink-0">{feature.icon}</span>
                    <span className="text-slate-700 font-medium">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-8 sm:p-10 border border-blue-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                Start Billing with TruBill in Minutes
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mb-6">
                TruBill takes less than 2 minutes to set up. Add your juice shop details, enter your product list, and start generating GST-compliant invoices instantly. No software installation, no hardware required.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white font-bold text-lg px-6 py-3 rounded-lg hover:bg-[#1e3a8a]/90 transition-colors shadow-md hover:shadow-lg"
              >
                Try TruBill Free
              </Link>
              <p className="mt-3 text-sm text-slate-500">No credit card required · Full features for 7 days</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
