/** @type {import('next').NextConfig} */
import withPWA from '@ducanh2912/next-pwa';

const withPWAConfig = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
};

export default withPWAConfig(nextConfig);