import type { Metadata } from 'next';

export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://kanninja.com';
export const SITE_NAME = 'kanNINJA';
export const SITE_TAGLINE = 'Discipline, made visible.';
export const SITE_DESCRIPTION =
    'A kanban that respects your attention. The work in front of you, in the order you will finish it.';
export const TWITTER_HANDLE = '@kanninja';
export const ORG_LEGAL_NAME = 'wizeworks';
export const SUPPORT_EMAIL = 'hello@kanninja.com';

/**
 * The hosted remote MCP server's connection URL — the value users paste into
 * Claude.ai, ChatGPT, or any web MCP client. Note the `/mcp` path: the OAuth
 * discovery endpoints serve at the origin, but the MCP transport is at `/mcp`.
 */
export const MCP_REMOTE_URL = 'https://mcp.kanninja.com/mcp';

export function absoluteUrl(path: string): string {
    if (!path.startsWith('/')) path = `/${path}`;
    return `${SITE_URL}${path}`;
}

/**
 * Build the dynamic OG image URL for a given page. Routes to /api/og which
 * renders a Hanko-branded card via next/og at request time.
 */
export function ogImageUrl(params: {
    title: string;
    eyebrow?: string;
    subtitle?: string;
}): string {
    const search = new URLSearchParams();
    search.set('title', params.title);
    if (params.eyebrow) search.set('eyebrow', params.eyebrow);
    if (params.subtitle) search.set('subtitle', params.subtitle);
    return `${SITE_URL}/api/og?${search.toString()}`;
}

interface PageMetaInput {
    title: string;
    description: string;
    path: string;
    ogTitle?: string;
    ogDescription?: string;
    ogEyebrow?: string;
    keywords?: string[];
    type?: 'website' | 'article';
    noIndex?: boolean;
    /** When true, bypass the root layout's "%s · kanNINJA" template. Used by the home page. */
    absoluteTitle?: boolean;
}

/**
 * Single source of truth for marketing page metadata. Pages call this with
 * their content and get back a fully populated Metadata object: title,
 * description, canonical, OpenGraph, Twitter card, and a brand-rendered
 * dynamic OG image. No page should hand-roll `openGraph` blocks.
 */
export function buildPageMetadata(input: PageMetaInput): Metadata {
    const canonical = absoluteUrl(input.path);
    const ogTitle = input.ogTitle ?? input.title;
    const ogDescription = input.ogDescription ?? input.description;
    const image = ogImageUrl({
        title: ogTitle,
        eyebrow: input.ogEyebrow,
        subtitle: ogDescription,
    });

    return {
        title: input.absoluteTitle ? { absolute: input.title } : input.title,
        description: input.description,
        keywords: input.keywords,
        alternates: { canonical },
        robots: input.noIndex
            ? { index: false, follow: false }
            : { index: true, follow: true },
        openGraph: {
            type: input.type ?? 'website',
            url: canonical,
            siteName: SITE_NAME,
            locale: 'en_US',
            title: ogTitle,
            description: ogDescription,
            images: [
                {
                    url: image,
                    secureUrl: image,
                    type: 'image/png',
                    width: 1200,
                    height: 630,
                    alt: ogTitle,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            site: TWITTER_HANDLE,
            creator: TWITTER_HANDLE,
            title: ogTitle,
            description: ogDescription,
            images: [{ url: image, alt: ogTitle }],
        },
    };
}
