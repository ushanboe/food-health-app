/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  // Configure turbopack root to fix workspace detection
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Allow ngrok and other dev origins
  allowedDevOrigins: [
    '63392b5f9e9f.ngrok-free.app',
    'dac21f3cbfc2.ngrok-free.app',
    '*.ngrok-free.app',
    '*.ngrok.io',
  ],
};

module.exports = withPWA(nextConfig);
