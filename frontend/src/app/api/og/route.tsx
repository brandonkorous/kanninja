import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { NextRequest } from 'next/server';

// Node runtime, not edge — AKS standalone isn't a real edge environment.
// Fonts are co-located in ./_fonts/ and loaded via `new URL(...,
// import.meta.url)` so Next bundles them with the compiled route — no
// reliance on process.cwd(), works identically in dev, standalone, Docker.
// Forced dynamic so query params always re-render.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Hanko palette (raw hex — these must NOT theme-flip in the rendered PNG).
const WASHI = '#F8F4EC';
const SUMI = '#0E0F12';
const VERMILLION = '#E0432F';
const SLATE = '#6B6A65';
const ASH = '#D6D2C5';

// Module-scope font cache: pay the disk read once per process, not per OG
// request. Discord, Slack, and Twitter typically warm this within seconds.
let cachedFonts: {
    frauncesRoman: Buffer;
    frauncesItalic: Buffer;
    inter: Buffer;
    mono: Buffer;
} | null = null;

// fileURLToPath is required because webpack's `import.meta.url` polyfill
// returns a URL whose constructor identity doesn't match Node's native URL,
// so readFile rejects it. Converting to a filesystem path string sidesteps
// the type check while preserving webpack's asset-tracking — the new URL()
// call still tells the bundler to include the .ttf in the build output.
function fontPath(name: string): string {
    return fileURLToPath(new URL(`./_fonts/${name}`, import.meta.url));
}

async function loadFonts() {
    if (cachedFonts) return cachedFonts;
    const [frauncesRoman, frauncesItalic, inter, mono] = await Promise.all([
        readFile(fontPath('Fraunces-Medium.ttf')),
        readFile(fontPath('Fraunces-MediumItalic.ttf')),
        readFile(fontPath('Inter-Regular.ttf')),
        readFile(fontPath('JetBrainsMono-Medium.ttf')),
    ]);
    cachedFonts = { frauncesRoman, frauncesItalic, inter, mono };
    return cachedFonts;
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const title = searchParams.get('title') ?? 'kanNINJA';
    const eyebrow = searchParams.get('eyebrow') ?? 'wizeworks · kanNINJA';
    const subtitle =
        searchParams.get('subtitle') ?? 'A kanban that respects your attention.';

    const fonts = await loadFonts();

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: WASHI,
                    padding: '80px 96px',
                    position: 'relative',
                }}
            >
                {/* Hairline border at edges — like the brand kit's paper feel */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 24,
                        border: `1px solid ${ASH}`,
                        borderRadius: 20,
                    }}
                />

                {/* Eyebrow — mono caps in vermillion */}
                <div
                    style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: 22,
                        letterSpacing: 4,
                        color: VERMILLION,
                        textTransform: 'uppercase',
                        display: 'flex',
                    }}
                >
                    {eyebrow}
                </div>

                {/* Title — Fraunces medium, mixing roman and italic-vermillion */}
                <div
                    style={{
                        fontFamily: 'Fraunces',
                        fontWeight: 500,
                        fontSize: 96,
                        lineHeight: 1.05,
                        letterSpacing: -2,
                        color: SUMI,
                        marginTop: 64,
                        maxWidth: 980,
                        display: 'flex',
                        flexWrap: 'wrap',
                    }}
                >
                    {title}
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        fontFamily: 'Inter',
                        fontSize: 28,
                        lineHeight: 1.4,
                        color: SLATE,
                        marginTop: 36,
                        maxWidth: 880,
                        display: 'flex',
                    }}
                >
                    {subtitle}
                </div>

                {/* Footer row — wordmark left, vermillion seal right */}
                <div
                    style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                            style={{
                                fontFamily: 'Fraunces',
                                fontWeight: 500,
                                fontSize: 40,
                                color: SUMI,
                                display: 'flex',
                            }}
                        >
                            kan
                            <span
                                style={{
                                    fontFamily: 'Fraunces',
                                    fontStyle: 'italic',
                                    fontWeight: 500,
                                    color: VERMILLION,
                                }}
                            >
                                NINJA
                            </span>
                        </div>
                        <div
                            style={{
                                fontFamily: 'JetBrains Mono',
                                fontSize: 16,
                                letterSpacing: 3,
                                color: SLATE,
                                textTransform: 'uppercase',
                                marginTop: 8,
                                display: 'flex',
                            }}
                        >
                            kanninja.com
                        </div>
                    </div>
                    {/* Vermillion stamp — square with rounded corners and 忍 */}
                    <div
                        style={{
                            width: 144,
                            height: 144,
                            borderRadius: 28,
                            backgroundColor: VERMILLION,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: WASHI,
                            fontFamily: 'Fraunces',
                            fontSize: 96,
                            fontWeight: 500,
                            lineHeight: 1,
                        }}
                    >
                        忍
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            fonts: [
                { name: 'Fraunces', data: fonts.frauncesRoman, style: 'normal', weight: 500 },
                { name: 'Fraunces', data: fonts.frauncesItalic, style: 'italic', weight: 500 },
                { name: 'Inter', data: fonts.inter, style: 'normal', weight: 400 },
                { name: 'JetBrains Mono', data: fonts.mono, style: 'normal', weight: 500 },
            ],
            headers: {
                'Cache-Control': 'public, immutable, max-age=31536000',
            },
        }
    );
}
