import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/dashboard',
                    '/dashboard/',
                    '/sign-in',
                    '/sign-up',
                    '/onboarding',
                ],
            },
            // Explicitly let answer-engine crawlers in
            { userAgent: 'GPTBot', allow: '/' },
            { userAgent: 'ChatGPT-User', allow: '/' },
            { userAgent: 'OAI-SearchBot', allow: '/' },
            { userAgent: 'PerplexityBot', allow: '/' },
            { userAgent: 'ClaudeBot', allow: '/' },
            { userAgent: 'Claude-Web', allow: '/' },
            { userAgent: 'Google-Extended', allow: '/' },
            { userAgent: 'Applebot-Extended', allow: '/' },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
