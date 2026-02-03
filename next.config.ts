import withPWA from 'next-pwa'

const nextConfig = {
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