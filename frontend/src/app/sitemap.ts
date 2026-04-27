import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { COMPARISON_ROUTES, PERSONA_ROUTES } from '@/config/marketing-routes';

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/features', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/mcp', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/changelog', priority: 0.5, changeFrequency: 'weekly' },
    { path: '/contact', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/brand', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/careers', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/docs', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/api', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/status', priority: 0.3, changeFrequency: 'daily' },
    { path: '/vs', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/for', priority: 0.7, changeFrequency: 'monthly' },
    // Legal — indexed but low priority
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/cookies', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/aup', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/dpa', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/subprocessors', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/refund', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/privacy-choices', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    return [
        ...STATIC_ROUTES.map((r) => ({
            url: `${SITE_URL}${r.path}`,
            lastModified: now,
            changeFrequency: r.changeFrequency,
            priority: r.priority,
        })),
        ...COMPARISON_ROUTES.map((c) => ({
            url: `${SITE_URL}/vs/${c.slug}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        })),
        ...PERSONA_ROUTES.map((p) => ({
            url: `${SITE_URL}/for/${p.slug}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
    ];
}
