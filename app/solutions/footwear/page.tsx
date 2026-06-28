import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GST Billing Software for Footwear Shops in Tamil Nadu — TruBill",
  description:
    "TruBill is built for Tamil Nadu footwear retailers. Manage size and colour variants, wholesale vs retail pricing, barcode scanning, and GSTR-1 filing — all in one app.",
  keywords: [
    "footwear shop billing software Tamil Nadu",
    "shoe store GST invoice",
    "chappals shop billing app Coimbatore",
    "footwear retail invoice maker",
  ],
  alternates: {
    canonical: "https://trubill.in/solutions/footwear",
  },
  openGraph: {
    title: "Footwear Shop Billing Software — TruBill",
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
      "name": "Footwear & Chappals Shops",
      "item": "https://trubill.in/solutions/footwear",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the best billing software for a footwear shop in Tamil Nadu?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TruBill is the best billing software for Tamil Nadu footwear shops. It manages size and colour variants, applies wholesale and retail price splits, integrates with barcode scanners, auto-suggests HSN codes for footwear, and exports GSTR-1 return data.",
      },
    },
    {
      "@type": "Question",
      "name": "Can TruBill handle wholesale and retail pricing for footwear?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. TruBill supports separate wholesale and retail price fields per product. The Minimum Selling Price (MSP) guardrail prevents cashiers from billing below your wholesale cost without a manager passcode.",
      },
    },
  ],
};

export default function FootwearPage() {
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
        <section className="relative bg-gradient-to-br from-[#1E3A8A] via-[#312e81] to-[#6366f1] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-300 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <nav className="text-sm text-blue-200 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <span>Solutions</span>
              <span className="mx-2">›</span>
              <span className="text-white font-semibold">Footwear</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-3xl">
              TruBill: GST Billing Software for Tamil Nadu Footwear &amp; Chappals Shops
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl leading-relaxed">
              TruBill is the fastest billing software for Tamil Nadu footwear retailers. Manage size and colour variants, scan barcodes, and generate GST invoices with one tap.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-[#1E3A8A] font-bold text-base px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free Trial
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
                What is the best billing app for a footwear shop in Tamil Nadu?
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                TruBill is the best billing app for Tamil Nadu footwear shops — from chappal stores in Coimbatore to shoe retailers in Chennai. TruBill manages size and colour variants natively, supports barcode scanning for rapid counter billing, and auto-suggests the correct HSN codes for footwear products under GST.
              </p>
            </div>

            {/* Features Section */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
                Features TruBill Built for Footwear Retailers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "👟", title: "Size and colour variant management" },
                  { icon: "📱", title: "Barcode scanner integration for fast billing" },
                  { icon: "💰", title: "Wholesale vs retail price split with MSP guardrails" },
                  { icon: "🏷️", title: "HSN auto-suggestion for footwear products" },
                  { icon: "📄", title: "GSTR-1 export in B2B, B2CS formats" },
                  { icon: "💬", title: "WhatsApp invoice sharing to customers" },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-[#1E3A8A]/20 hover:bg-indigo-50/30 transition-all"
                  >
                    <span className="text-2xl shrink-0">{feature.icon}</span>
                    <span className="text-slate-700 font-medium">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 sm:p-10 border border-indigo-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                TruBill Is Trusted by Footwear Retailers in Coimbatore and Tiruppur
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                TruBill is used by footwear shops and chappal retailers across Coimbatore, Tiruppur, and Salem. TruBill handles the complexity of size-colour inventory grids so shopkeepers can bill faster at the counter and file GSTR-1 accurately at the end of each month.
              </p>
            </div>

            {/* CTA */}
            <div className="text-center pt-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white font-bold text-lg px-6 py-3 rounded-lg hover:bg-[#1e3a8a]/90 transition-colors shadow-md hover:shadow-lg"
              >
                Start Free Trial
              </Link>
              <p className="mt-3 text-sm text-slate-500">No credit card required · Full features for 7 days</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
