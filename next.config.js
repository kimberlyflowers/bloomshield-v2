/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' vercel.live; script-src 'self' 'unsafe-eval' 'unsafe-inline' vercel.live; style-src 'self' 'unsafe-inline' vercel.live; font-src 'self' data: vercel.live; img-src 'self' data: blob: vercel.live; connect-src 'self' https: wss: vercel.live;"
          },
        ],
      },
    ];
  },
  experimental: {
    esmExternals: 'loose'
  }
};

module.exports = nextConfig;
