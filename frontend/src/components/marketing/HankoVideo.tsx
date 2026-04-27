'use client';

import { useEffect, useState } from 'react';

type AspectRatio = '16:9' | '4:3' | '1:1';

const ASPECT_CLASSES: Record<AspectRatio, string> = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
};

export function HankoVideo({
    sources,
    poster,
    alt,
    aspect = '4:3',
    className = '',
}: {
    sources: { mp4: string; webm?: string };
    poster: string;
    alt: string;
    aspect?: AspectRatio;
    className?: string;
}) {
    // Default to true so SSR + first paint show the static poster (no video
    // network request). On hydrate, we read the actual media query and flip
    // to autoplay video when motion is allowed. Avoids a flash of motion for
    // reduced-motion users and keeps the visual stable above the fold.
    const [reduceMotion, setReduceMotion] = useState(true);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduceMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const frame =
        'overflow-hidden rounded-3xl shadow-e2 border border-base-300/60 bg-base-200';

    return (
        <div className={`${ASPECT_CLASSES[aspect]} ${frame} ${className}`}>
            {reduceMotion ? (
                <img
                    src={poster}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                />
            ) : (
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={poster}
                    aria-label={alt}
                    className="h-full w-full object-cover"
                >
                    {sources.webm && <source src={sources.webm} type="video/webm" />}
                    <source src={sources.mp4} type="video/mp4" />
                </video>
            )}
        </div>
    );
}
