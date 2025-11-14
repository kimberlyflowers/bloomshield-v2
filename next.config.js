/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "font-src 'self' data:; " +
              "img-src 'self' data: blob:; " +
              "connect-src 'self' https://*.supabase.co https://*.thirdweb.com;"
          }
        ],
      },
    ]
  },
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig
