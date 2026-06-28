import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Simple & Transparent Pricing Plans — TruBill",
  description:
    "Choose the best plan for your business. TruBill offers a 7-day free trial with limited WhatsApp invoices, a Standard plan at ₹349/month, and an Annual saver plan.",
  keywords: [
    "TruBill pricing",
    "GST billing software price",
    "cheap GST invoicing software India",
    "billing software monthly plan",
  ],
  alternates: {
    canonical: "https://trubill.in/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header/Hero */}
      <section className="bg-gradient-to-br from-[#1E3A8A] to-[#1e40af] text-white text-center py-20 px-4">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
          Start billing in minutes with our 7-day free trial. No credit card required, cancel anytime.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free Trial */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Free Trial</h3>
              <p className="text-sm text-slate-500 mt-1">Explore the platform features</p>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">₹0</span>
                <span className="text-slate-500 ml-1">/ 7 days</span>
              </div>
              <ul className="mt-8 space-y-4 text-slate-600 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Create GST Invoices
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Limited WhatsApp Invoices
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Basic Inventory Tracking
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block text-center w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-lg transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Standard / Most Popular */}
          <div className="bg-white rounded-2xl p-8 border-2 border-[#1E3A8A] shadow-md flex flex-col justify-between relative hover:shadow-lg transition-shadow">
            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#1E3A8A] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </span>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Standard Plan</h3>
              <p className="text-sm text-slate-500 mt-1">Almost all features available</p>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">₹349</span>
                <span className="text-slate-500 ml-1">/ month</span>
              </div>
              <ul className="mt-8 space-y-4 text-slate-600 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Unlimited GST Invoices
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> WhatsApp Invoice Dispatch
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Variant inventory (size, color, design)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> GSTR-1 return filing export
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> MSP cashier guardrails
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block text-center w-full bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Yearly (Best Value) */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Annual Saver</h3>
              <p className="text-sm text-slate-500 mt-1">For long term growth and savings</p>
              <div className="mt-6 flex items-baseline flex-wrap">
                <span className="text-4xl font-extrabold text-slate-900">₹4,188</span>
                <span className="text-slate-500 ml-1">/ year</span>
                <span className="text-xs text-slate-400 w-full mt-1">(billed as ₹349 × 12 months)</span>
              </div>
              <ul className="mt-8 space-y-4 text-slate-600 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Everything in Standard Plan
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Priority support (Tamil & English)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Free initial catalog setup assistance
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 block text-center w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Go Annual
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Help / FAQ */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Pricing FAQ</h2>
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-800 text-lg">Are there any setup fees or hidden charges?</h4>
            <p className="text-slate-600 mt-1 text-sm">No. There are no setup fees, activation charges, or hidden maintenance costs. You pay exactly the subscription price.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-lg">Do I need a credit card to start the trial?</h4>
            <p className="text-slate-600 mt-1 text-sm">No credit card is required to sign up for the free trial. You can test out the platform for 7 days completely free.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-lg">Can I cancel my plan at any time?</h4>
            <p className="text-slate-600 mt-1 text-sm">Yes. You can cancel your subscription inside your account settings at any time without any penalties.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
