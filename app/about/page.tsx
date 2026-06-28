import type { Metadata } from "next";
import MarketingNavbar from "@/components/MarketingNavbar";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "About TruBill — Our Story & Mission",
  description:
    "TruBill is a GST billing and inventory platform built specifically for small businesses, restaurants, and retail merchants in Tamil Nadu, India.",
  keywords: [
    "about TruBill",
    "Tamil Nadu GST billing company",
    "Coimbatore software startup",
    "invoice billing app mission",
  ],
  alternates: {
    canonical: "https://trubill.in/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white">
      <div>
        <MarketingNavbar />
        
        {/* Hero section */}
        <section className="bg-gradient-to-br from-[#1E3A8A] to-[#1e40af] text-white py-20 px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">About TruBill</h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
            Simplifying GST billing and compliance for local retail and food businesses across Tamil Nadu.
          </p>
        </section>

        {/* Narrative block */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-slate-700 leading-relaxed space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
            <p>
              TruBill was founded with a single purpose: to make GST billing and store inventory management simple, accessible, and fast for small and medium businesses in Tamil Nadu. We believe that shopkeepers shouldn't need a degree in finance or complex, heavy ERP systems just to create a correct tax invoice and file GSTR-1 returns.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Built for Tamil Nadu Merchants</h2>
            <p>
              From tiffin centers and juice bars to textile stores and footwear shops, TruBill is designed specifically for local trade. We natively support the GST slabs (5%, 12%, 18%), HSN/SAC codes, and dynamic product variants that Tamil Nadu merchants handle every single day.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">Our Core Values</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
              <li><strong>Speed:</strong> Invoices should be generated and sent via WhatsApp in under 3 seconds.</li>
              <li><strong>Security:</strong> Secure role permissions and manager overrides protect your margins.</li>
              <li><strong>Simplicity:</strong> Clean, clear dashboards requiring zero training for cashiers.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Where We Are</h2>
            <p>
              TruBill is headquartered in Coimbatore, Tamil Nadu. We proudly offer localized customer support in both <strong>Tamil</strong> and <strong>English</strong> to make sure your billing operations run smoothly, day in and day out.
            </p>
          </div>
        </section>
      </div>
      
      <MarketingFooter />
    </div>
  );
}
