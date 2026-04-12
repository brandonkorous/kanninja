import { forwardRef } from 'react';

// Hanko textarea primitive. Sensible default min-height (6rem ≈ 96px) so
// empty textareas don't collapse to a single line. `resize-y` by default
// because horizontal resize breaks layouts; pass className to override if
// a specific form needs a fixed size.

export const Textarea = forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className = '', invalid, rows = 4, ...props }, ref) {
    const invalidClass = invalid ? 'textarea-error' : '';
    return (
        <textarea
            ref={ref}
            rows={rows}
            aria-invalid={invalid || undefined}
            className={`textarea textarea-bordered w-full focus:shadow-focus focus:outline-none resize-y min-h-[6rem] ${invalidClass} ${className}`}
            {...props}
        />
    );
});
