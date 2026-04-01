/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'mammoth', 'pdf-parse'],
  },
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
