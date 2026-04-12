// Shared wordmark — the one place the brand mark lives in code.
// Changing italic color, tracking, font, or the stamp icon here updates
// every header, sidebar, and footer across marketing, auth, and app shells.
//
// The component renders an inline-flex <span> so callers stay in control
// of the semantic wrapper (Link for clickable, plain span otherwise).

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<
  Size,
  { text: string; icon: string; iconPx: number }
> = {
  sm: { text: 'text-xl', icon: 'h-8 w-8', iconPx: 32 },
  md: { text: 'text-2xl', icon: 'h-9 w-9', iconPx: 36 },
  lg: { text: 'text-2xl', icon: 'h-10 w-10', iconPx: 40 },
  xl: { text: 'text-3xl', icon: 'h-14 w-14', iconPx: 56 },
};

export function Wordmark({
  size = 'md',
  showIcon = true,
}: {
  size?: Size;
  showIcon?: boolean;
}) {
  const s = SIZE_MAP[size];
  return (
    <span
      className={`inline-flex items-center font-display ${s.text} font-medium tracking-tight`}
    >
      {showIcon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/nin-icon.svg"
          alt=""
          width={s.iconPx}
          height={s.iconPx}
          className={`${s.icon} mr-2`}
        />
      )}
      kan<span className="italic text-primary">NINJA</span>
    </span>
  );
}
