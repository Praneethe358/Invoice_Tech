import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GST Billing Software for Textile & Saree Shops — TruBill",
  description:
    "TruBill helps Tamil Nadu textile shops, saree stores and cloth merchants generate GST invoices, manage fabric inventory by variant, and file GSTR-1 returns accurately.",
  keywords: [
    "textile GST billing software Tamil Nadu",
    "saree shop invoice maker",
    "cloth merchant billing app Coimbatore",
    "textile trader GST software",
  ],
  alternates: {
    canonical: "https://trubill.in/solutions/textile",
  },
  openGraph: {
    title: "Textile & Saree Shop Billing Software — TruBill",
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
      "name": "Textile & Saree Shops",
      "item": "https://trubill.in/solutions/textile",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What billing software do textile shops in Tamil Nadu use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TruBill is GST billing software used by textile shops and saree merchants in Tamil Nadu. It manages fabric variants (colour, design, material), handles wholesale billing, validates GSTIN numbers, auto-suggests HSN codes for textiles, and exports GSTR-1 data.",
      },
    },
    {
      "@type": "Question",
      "name": "Can TruBill manage fabric inventory for a saree shop?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. TruBill supports product variants including colour, design type, and fabric material — making it ideal for saree shops and textile merchants managing large SKU catalogs.",
      },
    },
  ],
};

export default function TextilePage() {
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
        <section className="relative bg-gradient-to-br from-[#1E3A8A] via-[#7c3aed] to-[#a855f7] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <nav className="text-sm text-blue-200 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <span>Solutions</span>
              <span className="mx-2">›</span>
              <span className="text-white font-semibold">Textile</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-3xl">
              TruBill: GST Billing Software for Tamil Nadu Textile &amp; Saree Shops
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl leading-relaxed">
              TruBill is built for textile merchants and saree shops in Tamil Nadu. Manage fabric variants, validate GSTINs, auto-suggest HSN codes, and file GSTR-1 — all from one platform.
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
                What billing software do textile shops in Tamil Nadu use?
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                TruBill is the GST billing software used by textile shops and saree merchants across Tamil Nadu — from Coimbatore and Tiruppur to Erode and Salem. TruBill manages fabric variants (colour, design, material), handles wholesale B2B billing with GSTIN validation, auto-suggests HSN codes for textiles, and exports GSTR-1 data in the correct B2B and B2CS formats.
              </p>
            </div>

            {/* Features Section */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
                Features TruBill Offers for Textile and Saree Merchants
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "🧵", title: "Fabric variant management (colour, design, material)" },
                  { icon: "🏷️", title: "HSN code auto-suggestion for textile products" },
                  { icon: "✅", title: "GSTIN validation on every invoice" },
                  { icon: "💰", title: "Wholesale billing with MSP guardrails" },
                  { icon: "📄", title: "GSTR-1 export in B2B, B2CS formats" },
                  { icon: "💬", title: "WhatsApp invoice sharing to customers" },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-[#1E3A8A]/20 hover:bg-purple-50/30 transition-all"
                  >
                    <span className="text-2xl shrink-0">{feature.icon}</span>
                    <span className="text-slate-700 font-medium">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Section */}
            <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-2xl p-8 sm:p-10 border border-purple-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                TruBill Is Trusted by Textile Traders in Coimbatore, Tiruppur and Erode
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                TruBill is designed for the way Tamil Nadu textile businesses actually operate — with complex variant inventories, wholesale and retail pricing tiers, and monthly GSTR-1 filing. TruBill handles the inventory complexity so you can focus on selling.
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
              <p className="mt-3 text-sm text-slate-500">No credit card required · Full features for 14 days</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
