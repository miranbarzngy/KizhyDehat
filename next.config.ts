import withPWA from 'next-pwa'

const nextConfig = {
  images: {
    domains: ['ulsjciplzhkdmgotawux.supabase.co', '*.supabase.co'],
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
