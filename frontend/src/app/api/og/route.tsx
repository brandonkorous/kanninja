import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const FRAUNCES_URL =
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap';
const INTER_URL =
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap';
const JETBRAINS_URL =
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=swap';

// Hanko palette (raw hex — these must NOT theme-flip in the rendered PNG).
const WASHI = '#F8F4EC';
const SUMI = '#0E0F12';
const VERMILLION = '#E0432F';
const SLATE = '#6B6A65';
const ASH = '#D6D2C5';

async function loadFont(cssUrl: string): Promise<ArrayBuffer> {
    const css = await fetch(cssUrl, {
        headers: {
            // Tell Google Fonts to give us .ttf/.otf, not .woff2 (ImageResponse
            // doesn't decode woff2).
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        },
    }).then((r) => r.text());
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match) throw new Error(`Could not parse font URL from ${cssUrl}`);
    return fetch(match[1]).then((r) => r.arrayBuffer());
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const title = searchParams.get('title') ?? 'kanNINJA';
    const eyebrow = searchParams.get('eyebrow') ?? 'wizeworks · kanNINJA';
    const subtitle =
        searchParams.get('subtitle') ??
        'A kanban that respects your attention.';

    const [fraunces, inter, mono] = await Promise.all([
        loadFont(FRAUNCES_URL),
        loadFont(INTER_URL),
        loadFont(JETBRAINS_URL),
    ]);

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

                {/* Title — Fraunces, mixing roman and italic-vermillion */}
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
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div
                            style={{
                                fontFamily: 'Fraunces',
                                fontWeight: 600,
                                fontSize: 40,
                                color: SUMI,
                                display: 'flex',
                            }}
                        >
                            kan
                            <span style={{ fontStyle: 'italic', color: VERMILLION }}>
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
                            fontWeight: 600,
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
                { name: 'Fraunces', data: fraunces, style: 'normal', weight: 500 },
                { name: 'Inter', data: inter, style: 'normal', weight: 400 },
                { name: 'JetBrains Mono', data: mono, style: 'normal', weight: 500 },
            ],
            headers: {
                // Cache aggressively — same query string = same image
                'Cache-Control': 'public, immutable, max-age=31536000',
            },
        }
    );
}
