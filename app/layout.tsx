import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL("https://trubill.in"),

  title: {
    default: "GST Billing Software for Tamil Nadu Shops & Restaurants | TruBill Invoice",
    template: "%s | TruBill Invoice",
  },

  description:
    "TruBill is a GST invoicing SaaS for Tamil Nadu retailers, restaurants, juice shops, footwear and textile traders. Create GST bills, manage inventory, file GSTR-1 — all in one place.",

  keywords: [
    "GST billing software Tamil Nadu",
    "GST invoice app for restaurants",
    "juice shop billing software",
    "GST software for small business India",
    "TruBill invoice",
    "GSTR-1 filing software",
    "footwear billing software Coimbatore",
    "textile GST billing",
    "restaurant billing POS India",
    "free GST invoice maker",
  ],

  authors: [{ name: "TruBill", url: "https://trubill.in" }],
  creator: "TruBill",
  publisher: "TruBill",

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://trubill.in",
    siteName: "TruBill Invoice",
    title: "TruBill — GST Billing for Tamil Nadu Retailers & Restaurants",
    description:
      "Generate GST invoices, manage products, file returns — built for Tamil Nadu footwear shops, restaurants, juice shops and textile traders.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TruBill GST Invoice Software",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "TruBill Invoice — GST Billing Made Simple",
    description:
      "GST billing, inventory & GSTR-1 for Tamil Nadu shops, restaurants & juice bars.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "https://trubill.in",
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.json",

  verification: {
    google: "REPLACE_WITH_GSC_TOKEN",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1E3A8A',
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TruBill",
  "alternateName": ["TruBill Invoice", "trubill", "TRUBILL"],
  "url": "https://trubill.in",
  "logo": "https://trubill.in/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "trubillapp@gmail.com",
    "contactType": "customer support",
    "areaServed": "IN",
    "availableLanguage": ["English", "Tamil"],
  },
  "sameAs": [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TruBill Invoice",
  "url": "https://trubill.in",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://trubill.in/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "TruBill Invoice",
  "url": "https://trubill.in",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR",
    "description": "14-day free trial, no credit card required",
  },
  "description":
    "GST invoicing and billing software for Tamil Nadu retailers, restaurants, juice shops, footwear and textile traders.",
  "featureList": [
    "GST invoice generation with 5%, 12%, 18% tax slabs",
    "GSTR-1 filing export",
    "Inventory and variant management",
    "Barcode scanner integration",
    "Multi-user role management with MSP guardrails",
    "WhatsApp invoice sharing via Meta Cloud API",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="text/javascript"
          src="https://app.termly.io/resource-blocker/29352c0c-25b3-4799-a507-d425b159bd02?autoBlock=on"
          async
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
