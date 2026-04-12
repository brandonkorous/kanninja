import { forwardRef, useId } from 'react';

// Hanko checkbox with inline label. Always wraps a label element so the
// entire row is clickable (bigger tap target, better a11y). The label sits
// to the right of the box by default.
//
// Use `<Field>` + bare `<input type="checkbox">` instead when the checkbox
// needs the eyebrow label treatment above the control — this component is
// for the more common inline-label case.

export const Checkbox = forwardRef<
    HTMLInputElement,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
        label: React.ReactNode;
        hint?: string;
    }
>(function Checkbox({ className = '', id, label, hint, ...props }, ref) {
    const autoId = useId();
    const inputId = id || autoId;
    return (
        <div>
            <label
                htmlFor={inputId}
                className="flex items-start gap-3 cursor-pointer"
            >
                <input
                    ref={ref}
                    id={inputId}
                    type="checkbox"
                    className={`checkbox checkbox-primary mt-0.5 shrink-0 ${className}`}
                    {...props}
                />
                <span className="text-sm text-base-content leading-snug">
                    {label}
                </span>
            </label>
            {hint && (
                <p className="mt-2 ml-8 text-xs text-base-content/50 leading-relaxed">
                    {hint}
                </p>
            )}
        </div>
    );
});
