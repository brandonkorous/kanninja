'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { DOJO_PALETTE } from '@/lib/card-colors';
import { DOJO_COLOR_IDS, type DojoColorId } from '@kanninja/shared';

interface DojoColorPickerProps {
  /** Currently picked slug, or null if the dojo is using the
   *  hash-based fallback. */
  value: string | null;
  onChange: (value: DojoColorId | null) => void;
}

/**
 * Curated 8-swatch picker for a dojo's color, plus a "default"
 * option that clears the explicit pick (the frontend then renders
 * the hash-based fallback). Swatches are pure DaisyUI / Tailwind so
 * they theme-flip cleanly with hanko-night.
 *
 * Saves immediately on click — no separate Save button — because the
 * choice is small, reversible, and the immediate visual confirmation
 * (swatch checkmark) is the right feedback for a color pick.
 */
export function DojoColorPicker({ value, onChange }: DojoColorPickerProps) {
  return (
    <div role="radiogroup" aria-label="Dojo color" className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        role="radio"
        aria-checked={value === null}
        aria-label="Default (auto)"
        onClick={() => onChange(null)}
        className={`relative w-8 h-8 rounded-full border-2 ${
          value === null ? 'border-base-content' : 'border-base-300'
        } bg-base-200 hover:border-base-content/60 focus-visible:shadow-focus focus-visible:outline-none transition-colors`}
        title="Default — auto-pick from id"
      >
        {value === null && (
          <FontAwesomeIcon
            icon={faCheck}
            aria-hidden="true"
            className="absolute inset-0 m-auto text-base-content text-xs"
          />
        )}
      </button>

      {DOJO_COLOR_IDS.map((id) => {
        const swatch = DOJO_PALETTE[id];
        if (!swatch) return null;
        const isActive = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={swatch.label}
            onClick={() => onChange(id)}
            title={swatch.label}
            className={`relative w-8 h-8 rounded-full ${swatch.swatch} border-2 ${
              isActive ? 'border-base-content' : 'border-transparent'
            } hover:border-base-content/60 focus-visible:shadow-focus focus-visible:outline-none transition-colors`}
          >
            {isActive && (
              <FontAwesomeIcon
                icon={faCheck}
                aria-hidden="true"
                className="absolute inset-0 m-auto text-white text-xs drop-shadow"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
