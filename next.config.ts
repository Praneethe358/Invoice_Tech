import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow external font loading for PDF generation
  serverExternalPackages: ['@react-pdf/renderer'],

  // Headers for service worker
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
    ];
  },
};

export default nextConfig;
