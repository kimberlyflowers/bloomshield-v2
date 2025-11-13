/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://thirdweb.com https://*.thirdweb.com https://cdnjs.cloudflare.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.thirdweb.com wss://*.thirdweb.com https://*.rpc.thirdweb.com https://rpc.ankr.com https://*.infura.io https://*.alchemy.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org",
              "report-uri /api/csp-report",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
