import { forwardRef } from 'react';

// Hanko select primitive. DaisyUI's select handles the theme-aware chrome,
// this just adds the focus ring and full-width default. The dropdown arrow
// color comes from the DaisyUI theme — see globals.css for any overrides.
//
// The default width is `w-full` for form layouts, but callers can opt
// out for inline usage (e.g. the role select inside a flex row) by
// passing any width utility via className. We detect the override and
// drop the default so Tailwind's cascade doesn't fight the caller's
// choice — without this, both `w-full` and `w-auto` end up in the
// class attribute and `w-full` silently wins, collapsing sibling
// flex-1 elements to zero width.

type SelectSize = 'md' | 'sm';

// Matches any Tailwind width utility the caller might pass to override
// the default: w-auto, w-full, w-fit, w-min, w-max, w-screen, w-1/2,
// w-32, w-[240px], etc. Case-sensitive and anchored on a word boundary
// so it doesn't accidentally match e.g. `max-w-sm`.
const WIDTH_UTILITY = /(?:^|\s)w-(?:auto|full|fit|min|max|screen|svw|lvw|dvw|\d|\[|\d+\/\d+)/;

export const Select = forwardRef<
    HTMLSelectElement,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
        size?: SelectSize;
        invalid?: boolean;
        children: React.ReactNode;
    }
>(function Select({ className = '', size = 'md', invalid, children, ...props }, ref) {
    const sizeClass = size === 'sm' ? 'select-sm' : '';
    const invalidClass = invalid ? 'select-error' : '';
    const widthClass = WIDTH_UTILITY.test(className) ? '' : 'w-full';
    return (
        <select
            ref={ref}
            aria-invalid={invalid || undefined}
            className={`select select-bordered ${widthClass} focus:shadow-focus focus:outline-none ${sizeClass} ${invalidClass} ${className}`}
            {...props}
        >
            {children}
        </select>
    );
});
