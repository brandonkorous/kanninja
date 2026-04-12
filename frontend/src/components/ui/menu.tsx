'use client';

import {
    createContext,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface MenuContextValue {
    close: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

interface MenuRootProps {
    /** The button (or any element) that opens the menu when clicked. */
    trigger: ReactNode;
    /** Menu alignment relative to the trigger. Defaults to 'end' (right edge). */
    align?: 'start' | 'end';
    /** Extra classes for the inline-flex wrapper around the trigger. */
    className?: string;
    children: ReactNode;
}

const MENU_WIDTH = 208; // matches w-52 (52 * 4px)
const GAP = 4; // visual gap between trigger and menu

/**
 * Hanko dropdown menu that replaces DaisyUI's CSS-only `.dropdown`.
 *
 * Why this exists: DaisyUI's dropdown uses `:focus` + `position: absolute`,
 * so it gets clipped by any ancestor with `overflow: hidden`. The kanban has
 * two such ancestors (the column list + the page main wrapper), so the
 * actions menu visually disappeared on cards near the top of a column.
 *
 * This portals the menu to document.body so it escapes every overflow clip,
 * computes position from the trigger's bounding rect, and flips above the
 * trigger when there isn't room below.
 */
function MenuRoot({ trigger, align = 'end', className, children }: MenuRootProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const menuId = useId();

    const computePosition = () => {
        const triggerEl = triggerRef.current;
        if (!triggerEl) return;
        const rect = triggerEl.getBoundingClientRect();
        const menuHeight = menuRef.current?.offsetHeight ?? 0;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Default: below the trigger. If that would overflow the viewport
        // AND there's room above, flip it.
        let top = rect.bottom + GAP;
        if (top + menuHeight > viewportHeight - 8 && rect.top - GAP - menuHeight > 8) {
            top = rect.top - GAP - menuHeight;
        }

        let left: number;
        if (align === 'end') {
            left = rect.right - MENU_WIDTH;
        } else {
            left = rect.left;
        }
        // Clamp so the menu never escapes horizontally.
        left = Math.max(8, Math.min(left, viewportWidth - MENU_WIDTH - 8));

        setPosition({ top, left });
    };

    // Measure + position after the menu mounts into the portal. useLayoutEffect
    // runs before paint, so the visibility flip happens in a single frame.
    useLayoutEffect(() => {
        if (!open) return;
        computePosition();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Reposition on scroll/resize so the menu sticks to its trigger.
    useEffect(() => {
        if (!open) return;
        const handler = () => computePosition();
        window.addEventListener('scroll', handler, true);
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('scroll', handler, true);
            window.removeEventListener('resize', handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Click-outside close.
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (triggerRef.current?.contains(target)) return;
            if (menuRef.current?.contains(target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Escape-to-close. Returns focus to the trigger so keyboard users don't
    // lose their place.
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                setOpen(false);
                triggerRef.current?.querySelector<HTMLElement>('button')?.focus();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    return (
        <MenuContext.Provider value={{ close: () => setOpen(false) }}>
            <div
                ref={triggerRef}
                className={`inline-flex ${className ?? ''}`}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
                /* stopPropagation on pointer/key events so the host card's
                 * dnd-kit listeners don't hijack menu interactions. */
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpen((v) => !v);
                    }
                }}
            >
                {trigger}
            </div>

            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <ul
                        ref={menuRef}
                        id={menuId}
                        role="menu"
                        style={{
                            position: 'fixed',
                            top: position?.top ?? 0,
                            left: position?.left ?? 0,
                            width: MENU_WIDTH,
                            // Hide until measured so there's no flash at 0,0.
                            visibility: position ? 'visible' : 'hidden',
                            zIndex: 50,
                        }}
                        className="menu p-2 shadow-e3 bg-base-100 border border-base-300 rounded-box"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {children}
                    </ul>,
                    document.body,
                )}
        </MenuContext.Provider>
    );
}

interface MenuItemProps {
    onClick?: () => void;
    icon?: IconDefinition;
    disabled?: boolean;
    /** Renders the item with `text-error` — use for Delete, etc. */
    destructive?: boolean;
    children: ReactNode;
}

function MenuItem({ onClick, icon, disabled, destructive, children }: MenuItemProps) {
    const ctx = useContext(MenuContext);
    return (
        <li>
            <button
                type="button"
                role="menuitem"
                disabled={disabled}
                className={`${destructive ? 'text-error' : ''} disabled:text-base-content/30 disabled:cursor-not-allowed disabled:bg-transparent disabled:hover:bg-transparent`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    onClick?.();
                    ctx?.close();
                }}
            >
                {icon && <FontAwesomeIcon icon={icon} aria-hidden="true" />}
                {children}
            </button>
        </li>
    );
}

function MenuSeparator() {
    return (
        <li className="menu-title p-0" aria-hidden="true">
            <hr className="border-base-300 my-1" />
        </li>
    );
}

export const Menu = Object.assign(MenuRoot, {
    Item: MenuItem,
    Separator: MenuSeparator,
});
