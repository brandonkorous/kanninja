import { forwardRef } from 'react';

// Hanko input primitive — uses DaisyUI's `input input-bordered` as the base
// so theme colors flow through, adds the vermillion focus ring and a sane
// default width. Pass `size="sm"` for the compact variant used in tight
// contexts like the kanban card tabs.

type InputSize = 'md' | 'sm';

export const Input = forwardRef<
    HTMLInputElement,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
        size?: InputSize;
        invalid?: boolean;
    }
>(function Input({ className = '', size = 'md', invalid, ...props }, ref) {
    const sizeClass = size === 'sm' ? 'input-sm' : '';
    const invalidClass = invalid ? 'input-error' : '';
    return (
        <input
            ref={ref}
            aria-invalid={invalid || undefined}
            className={`input input-bordered w-full focus:shadow-focus focus:outline-none ${sizeClass} ${invalidClass} ${className}`}
            {...props}
        />
    );
});
