/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // unsafe-inline needed for Next.js
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "font-src 'self' https://cdnjs.cloudflare.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://localhost:3001",
      "frame-ancestors 'none'",   // prevents clickjacking
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',   // prevents MIME sniffing attacks
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',      // prevents clickjacking
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
