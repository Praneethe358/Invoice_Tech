import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact TruBill Support — Reach Out to Us",
  description:
    "Have questions? Get in touch with the TruBill team for sales inquiries, custom integrations, or localized support in Tamil and English.",
  keywords: [
    "TruBill contact",
    "TruBill customer support",
    "email TruBill",
    "Tamil Nadu GST billing support",
  ],
  alternates: {
    canonical: "https://trubill.in/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero section */}
      <section className="bg-gradient-to-br from-[#1E3A8A] to-[#1e40af] text-white py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Contact Our Team</h1>
        <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
          We're here to help you simplify your billing. Reach out for support, demo requests, or feature inquiries.
        </p>
      </section>

      {/* Grid container */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Info Details */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">Get in Touch</h3>
            <p className="text-slate-600 leading-relaxed">
              If you have any questions about TruBill, want a personalized demo, or need assistance setting up your products, feel free to contact us.
            </p>

            <div className="space-y-4 text-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-xl">✉️</span>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Support Email</h4>
                  <a href="mailto:trubillapp@gmail.com" className="text-[#1E3A8A] hover:underline text-sm font-medium">
                    trubillapp@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xl">🗣️</span>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Languages Supported</h4>
                  <p className="text-slate-600 text-sm">Tamil, English</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Office Location</h4>
                  <p className="text-slate-600 text-sm">Coimbatore, Tamil Nadu, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Static Form for design */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Send Message</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anandan"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#1E3A8A] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#1E3A8A] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  placeholder="How can we help you today?"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#1E3A8A] transition-colors resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition-colors shadow-sm"
              >
                Submit Inquire
              </button>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
