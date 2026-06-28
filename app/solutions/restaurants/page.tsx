import type { Metadata } from "next";
import Link from "next/link";
import MarketingNavbar from "@/components/MarketingNavbar";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "GST Billing Software for Restaurants & Food Businesses — TruBill",
  description:
    "TruBill is GST billing software for Tamil Nadu restaurants, cloud kitchens, tiffin centres and food counters. Generate bills for dine-in, parcel, and delivery with HSN/SAC auto-suggestion.",
  keywords: [
    "restaurant billing software Tamil Nadu",
    "GST invoice for restaurants India",
    "cloud kitchen billing app",
    "tiffin centre GST software",
    "food business invoice maker Tamil Nadu",
  ],
  alternates: {
    canonical: "https://trubill.in/solutions/restaurants",
  },
  openGraph: {
    title: "Restaurant & Food Business Billing — TruBill",
    images: [{ url: "/og-restaurants.png", width: 1200, height: 630 }],
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
      "name": "Restaurants & Food Businesses",
      "item": "https://trubill.in/solutions/restaurants",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the best GST billing software for a restaurant in Tamil Nadu?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "TruBill is the best GST billing software for Tamil Nadu restaurants. It generates GST-compliant bills for dine-in, parcel, and delivery orders, auto-suggests SAC code 996331 for restaurant services, and lets cashiers share invoices via WhatsApp in under 3 seconds.",
      },
    },
    {
      "@type": "Question",
      "name": "Can TruBill handle both dine-in and delivery billing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. TruBill supports dine-in, parcel takeaway, and third-party delivery billing from a single dashboard. Each order type generates a fully GST-compliant invoice with the correct HSN/SAC code and tax slab applied automatically.",
      },
    },
    {
      "@type": "Question",
      "name": "Does TruBill work for juice shops and beverage counters?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. TruBill works for juice shops, smoothie bars, and beverage counters in Tamil Nadu. It supports counter billing, ingredient inventory tracking, daily sales reports, and GST-compliant receipt printing.",
      },
    },
  ],
};

export default function RestaurantsPage() {
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

      <div className="min-h-screen flex flex-col justify-between bg-white">
        <div>
          <MarketingNavbar />
          {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#3b82f6] text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <nav className="text-sm text-blue-200 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <span>Solutions</span>
              <span className="mx-2">›</span>
              <span className="text-white font-semibold">Restaurants</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-3xl">
              TruBill: GST Billing Software for Tamil Nadu Restaurants &amp; Food Shops
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl leading-relaxed">
              TruBill is purpose-built for Tamil Nadu food businesses. Generate GST-compliant bills for dine-in, parcel, and delivery with SAC code 996331 auto-applied — all from a single web dashboard.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-[#1E3A8A] font-bold text-base px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free 7-Day Trial
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
            {/* FAQ-style Q&A Section 1 */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                What is the best GST billing app for a restaurant in Tamil Nadu?
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                TruBill is purpose-built for Tamil Nadu food businesses. Generate GST-compliant bills for dine-in, parcel, and delivery, with SAC code 996331 auto-applied for restaurant services. TruBill auto-calculates GST at 5% for non-AC restaurants and 5% or 18% for AC and premium dining — so your cashier never has to look up tax slabs manually.
              </p>
            </div>

            {/* Features Section */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
                Key Features TruBill Offers for Restaurants and Food Counters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "🍽️", title: "Dine-in, parcel, and delivery billing from one dashboard" },
                  { icon: "🏷️", title: "SAC code 996331 auto-suggestion for food services" },
                  { icon: "💬", title: "WhatsApp invoice sharing via Meta Cloud API" },
                  { icon: "📊", title: "Daily order summary and sales reports" },
                  { icon: "👥", title: "Multi-cashier roles with MSP guardrails" },
                  { icon: "🎁", title: "7-day free trial, no credit card required" },
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

            {/* Trust Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 sm:p-10 border border-blue-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                TruBill Is Trusted by Tamil Nadu Food Businesses
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                TruBill is trusted by restaurants, cloud kitchens, tiffin centres, and juice shops across Tamil Nadu — from Coimbatore and Chennai to Tiruppur and Madurai. TruBill simplifies GST billing so food business owners can focus on their customers, not tax calculations.
              </p>
            </div>

            {/* CTA Section */}
            <div className="text-center pt-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white font-bold text-lg px-6 py-3 rounded-lg hover:bg-[#1e3a8a]/90 transition-colors shadow-md hover:shadow-lg"
              >
                Start Free 7-Day Trial
              </Link>
            </div>
          </div>
        </section>
      </div>
      <MarketingFooter />
    </div>
    </>
  );
}
