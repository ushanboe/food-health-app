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
  // Empty turbopack config to silence the warning
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Allow ngrok for development
  allowedDevOrigins: [
    'https://dac21f3cbfc2.ngrok-free.app',
    'https://*.ngrok-free.app',
    'https://*.ngrok.io',
  ],
};

module.exports = withPWA(nextConfig);
