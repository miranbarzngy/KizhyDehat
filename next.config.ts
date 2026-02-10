import withPWA from 'next-pwa'

const nextConfig = {
  // Expose environment variables to the client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
  webpack: (config: any) => config, // Explicitly force webpack mode
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
