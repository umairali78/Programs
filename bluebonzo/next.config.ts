import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['mammoth', 'pdf-parse', 'xlsx'],
}

export default nextConfig
