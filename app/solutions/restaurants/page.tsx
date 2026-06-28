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
  twitter: {
    card: "summary_large_image",
    title: "Restaurant & Food Business Billing — TruBill",
    images: ["/og-restaurants.png"],
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: "🍽️",
                    title: "Dine-in, Parcel & Delivery",
                    description: "Manage seating layouts, takeaway orders, and third-party delivery dispatch from a unified interface, eliminating order confusion and terminal clutter."
                  },
                  {
                    icon: "🏷️",
                    title: "SAC 996331 Compliance",
                    description: "The billing engine automatically locks in the correct 5% or 18% splits based on AC or Non-AC seating parameters, keeping your books audit-ready without manual calculations."
                  },
                  {
                    icon: "💬",
                    title: "Official Meta API WhatsApp Invoicing",
                    description: "Instantly dispatch thermal-styled digital bills directly to customer WhatsApp numbers via the official Meta API, cutting your paper roll and hardware maintenance costs down to absolute zero."
                  },
                  {
                    icon: "📊",
                    title: "Real-Time Sales Analytics",
                    description: "Track net revenue, tax splits, and payment types instantly. Generate automated GSTR-1 ready reports at the end of each shift with zero manual entry."
                  },
                  {
                    icon: "👥",
                    title: "Multi-Staff Guardrails",
                    description: "Establish dedicated cashier profiles with custom roles and permission limits to prevent unauthorized discounts, voided items, or cash drawer access."
                  },
                  {
                    icon: "🎁",
                    title: "Risk-Free Onboarding",
                    description: "Get started immediately with our full-featured 7-day free trial. No credit card, no complex integration, and no setup fees required."
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-4 p-6 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-[#1E3A8A]/20 hover:bg-blue-50/30 hover:shadow-md hover:translate-y-[-2px] transition-all duration-300"
                  >
                    <span className="text-3xl shrink-0 p-3 bg-white rounded-xl shadow-xs border border-slate-100">{feature.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1.5">{feature.title}</h3>
                      <p className="text-slate-650 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mid-Page Call-To-Action (CTA) */}
              <div className="mt-12 bg-gradient-to-r from-slate-900 to-[#1E3A8A] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg border border-slate-850">
                <div className="text-center md:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Streamline Your Restaurant Billing Today</h3>
                  <p className="text-blue-100 text-sm mt-2 max-w-xl">
                    Deploy TruBill's automated compliance and direct WhatsApp invoicing to improve checkout speeds and eliminate paper costs.
                  </p>
                </div>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-white text-[#1E3A8A] font-bold text-base px-6 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg shrink-0"
                >
                  Start Free 7-Day Trial
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Trust Section */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-sm">
              <div className="max-w-3xl mb-10">
                <span className="text-blue-600 font-semibold text-xs tracking-wider uppercase">Regional Enterprise Presence</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-4">
                  TruBill Is Trusted by Tamil Nadu Food Businesses
                </h2>
                <p className="text-lg text-slate-655 leading-relaxed">
                  Simplifying operations and compliance for leading cloud kitchens, dine-in restaurants, sweet stalls, and beverage counters across Tamil Nadu's prime business regions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    city: "Chennai",
                    badge: "Metro Region",
                    description: "Powering fast-paced cloud kitchens and multi-chain restaurants in Adyar, Anna Nagar, and Velachery."
                  },
                  {
                    city: "Coimbatore",
                    badge: "Industrial Hub",
                    description: "Optimizing table-wise billing and daily ingredient registers for bakeries and dining rooms in RS Puram."
                  },
                  {
                    city: "Madurai",
                    badge: "Cultural Center",
                    description: "Ensuring offline-first stability and swift token printouts for traditional messes and tiffin counters."
                  },
                  {
                    city: "Tiruppur",
                    badge: "Textile Belt",
                    description: "Supporting food counters with multi-cashier shifts, manager approval gates, and precise tax audits."
                  }
                ].map((region) => (
                  <div
                    key={region.city}
                    className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-100/55 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-extrabold text-slate-800 text-lg">{region.city}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100/40">
                          {region.badge}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{region.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center pt-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white font-bold text-lg px-6 py-4 rounded-xl hover:bg-[#1e3a8a]/90 transition-colors shadow-md hover:shadow-lg"
              >
                Start Free 7-Day Trial
              </Link>
            </div>

            {/* Multi-Vertical Context Navigation */}
            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
              <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200/60 px-6 py-3.5 rounded-2xl text-xs sm:text-sm text-slate-650 max-w-3xl mx-auto shadow-2xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h2.25M9 13.5h.008v.008H9v-.008zm0 3h.008v.008H9v-.008zm0 3h.008v.008H9v-.008zm3-6h.008v.008H12v-.008zm0 3h.008v.008H12v-.008zm0 3h.008v.008H12v-.008zm3-6h.008v.008H15v-.008zm0 3h.008v.008H15v-.008z" />
                  </svg>
                  Not a food business?
                </span>
                <span>
                  Check out TruBill for{" "}
                  <Link href="/solutions/textile" className="font-extrabold text-[#1E3A8A] hover:underline">
                    Apparel
                  </Link>
                  ,{" "}
                  <Link href="/solutions/footwear" className="font-extrabold text-[#1E3A8A] hover:underline">
                    Footwear
                  </Link>
                  , or{" "}
                  <Link href="/solutions/textile" className="font-extrabold text-[#1E3A8A] hover:underline">
                    Textile
                  </Link>{" "}
                  retail stores.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <MarketingFooter />
    </div>
    </>
  );
}
