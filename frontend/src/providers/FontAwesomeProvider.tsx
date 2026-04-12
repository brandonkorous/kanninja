'use client';

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

// Prevent FontAwesome from adding its CSS automatically (Next.js handles it)
config.autoAddCss = false;

export function FontAwesomeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
