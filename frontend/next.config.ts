import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
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
