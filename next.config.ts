import withPWA from 'next-pwa'

const nextConfig = {
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Expose environment variables to the client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'ulsjciplzhkdmgotawux.supabase.co',
      },
      {
        protocol: 'https' as const,
        hostname: '**supabase.co',
      },
    ],
  },
  // Turbopack configuration (Next.js 16+ defaults to Turbopack)
  turbopack: {},
  webpack: (config: any) => config, // Keep webpack config for compatibility
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
