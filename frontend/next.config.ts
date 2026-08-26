import type { NextConfig } from 'next';

// Baseline response headers applied to every route. Aligned with the Anthropic
// Connectors Directory technical requirements and the MCP spec's security
// best-practices document.
const baselineSecurityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Marketing surfaces don't need to be iframed by anyone; default-deny is fine.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
];

// Stricter set for the OAuth consent UI — per MCP spec, the consent page MUST
// prevent iframing to defeat clickjacking that would skip user approval.
const consentSecurityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    // Avatars are served by our own API, from a private blob container. The
    // Clerk and Supabase hosts that used to be here are gone with them.
    remotePatterns: [
      { protocol: 'https', hostname: 'api.kanninja.com' },
      { protocol: 'http', hostname: 'localhost', port: '3001' },
    ],
  },
  async headers() {
    // Next.js applies every matching entry in order — later headers override
    // earlier ones on conflict. Keep the stricter consent set LAST so its
    // X-Frame-Options: DENY wins against the baseline SAMEORIGIN.
    return [
      { source: '/:path*', headers: baselineSecurityHeaders },
      { source: '/oauth/consent', headers: consentSecurityHeaders },
    ];
  },
  // TODO: restore proper lint-during-build once frontend has its own flat
  // eslint.config.mjs wired to eslint-config-next. The workspace-level
  // eslint.config.js doesn't load the Next.js / react-hooks plugins, so
  // disable-comments for rules like @next/next/no-img-element and
  // react-hooks/exhaustive-deps error out during `next build`.
  // TypeScript's own type-check still runs during build and will fail it.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
