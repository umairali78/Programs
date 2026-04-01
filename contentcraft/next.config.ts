import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'mammoth', 'pdf-parse'],
  },
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
