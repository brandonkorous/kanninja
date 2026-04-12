'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faSun, faMoon, faDesktop } from '@fortawesome/free-solid-svg-icons';

// Three modes cycle in a fixed order. The `theme` value uses next-themes'
// internal tokens (`light` / `dark` / `system`) which the provider translates
// into DaisyUI's `hanko` / `hanko-night` via the value map in ThemeProvider.
type Mode = 'light' | 'dark' | 'system';

const MODES: { id: Mode; label: string; icon: IconDefinition }[] = [
    { id: 'light', label: 'Light', icon: faSun },
    { id: 'dark', label: 'Dark', icon: faMoon },
    { id: 'system', label: 'System', icon: faDesktop },
];

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    // Avoid hydration mismatch — the initial server render cannot know the
    // user's resolved theme, so render a placeholder with the same footprint
    // until the client has mounted.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const current = (theme as Mode) ?? 'system';
    const currentIndex = MODES.findIndex((m) => m.id === current);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextMode = MODES[(safeIndex + 1) % MODES.length];
    const currentMode = MODES[safeIndex];

    if (!mounted) {
        return (
            <div
                aria-hidden="true"
                className="btn btn-ghost btn-square opacity-0"
            />
        );
    }

    return (
        <button
            type="button"
            onClick={() => setTheme(nextMode.id)}
            aria-label={`Theme: ${currentMode.label}. Switch to ${nextMode.label}.`}
            title={currentMode.label}
            className="btn btn-ghost btn-square text-base-content/70 hover:text-base-content"
        >
            <FontAwesomeIcon icon={currentMode.icon} aria-hidden="true" />
        </button>
    );
}
