import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow external font loading for PDF generation
  serverExternalPackages: ['@react-pdf/renderer'],

  typescript: {
    ignoreBuildErrors: true,
  },

  // Headers for service worker and security
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://unpkg.com https://app.termly.io https://*.termly.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack-cx.razorpay.com https://app.termly.io https://*.termly.io; frame-src https://api.razorpay.com https://checkout.razorpay.com https://app.termly.io https://*.termly.io;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
