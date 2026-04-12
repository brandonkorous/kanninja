'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

// DaisyUI theme names must match globals.css — only `hanko` (light) and
// `hanko-night` (dark) exist. We declare both themes plus a system entry so
// next-themes' enableSystem feature can map the OS-level prefers-color-scheme
// to the corresponding Hanko variant. The `value` map is what translates
// next-themes' internal light/dark tokens into our DaisyUI data-theme values.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      themes={['hanko', 'hanko-night']}
      value={{ light: 'hanko', dark: 'hanko-night' }}
      enableSystem
    >
      {children}
    </NextThemesProvider>
  );
}
