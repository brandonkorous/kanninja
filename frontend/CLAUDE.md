# CLAUDE.md — kanNINJA v2 Frontend

Frontend-scoped guidance. For monorepo-wide architecture see [../CLAUDE.md](../CLAUDE.md).

## Design Context

The visual language is **Hanko** — already fully defined in code and the canonical brand kit. Before any UI work, read these in order:

1. [../../.claude/skills/hanko/SKILL.md](../../.claude/skills/hanko/SKILL.md) — the cheat sheet (colors, type, spacing, signature moves, do/don't)
2. [src/styles/tokens.css](src/styles/tokens.css) — Tailwind 4 design tokens (fonts, type scale, spacing, radii, shadows)
3. [src/styles/themes/hanko.css](src/styles/themes/hanko.css) — DaisyUI 5 theme (light `hanko` + dark `hanko-night`)

If this file disagrees with those, **those win** — and update this file to match.

### Users

A wide audience: solo founders/indie makers, freelancers, creative agencies, small product/eng teams (2–10), and general knowledge workers. The modal user is "general knowledge worker," but no design choice should alienate the solo or small-team end of the spectrum. Users are typically context-switching between strategy and execution, so respect cognitive load — the interface should clear space, not fill it.

### Brand Personality

**Three words:** Restraint · Warmth · Mastery (from the Hanko brand guide).

**Voice:** Calm, confident, direct. Warmth carries the weight; restraint earns the trust.

**Mission:** Turn chaos into kata. Help anyone practice the small disciplines that compound into mastery.

**Metaphor:** the Japanese dojo — kata, training, clans, the seal. Lean into ninja/dojo/kata language when it earns its keep; never decoratively.

**Peak emotional moment:** mastery / craftsmanship. The satisfaction of using a well-honed tool — like a chef's knife. Pride in the system itself. This means the UI must reward attention: details have to hold up under scrutiny. No throwaway choices.

### Aesthetic Direction

Hanko's signature moves (see the skill for the full list):

- **Cream paper canvas** (Washi `#F8F4EC`) with sumi ink text and a single **vermillion seal** (`#E0432F`) used sparingly as the primary CTA only — never decoratively. One stamp per screen.
- **Three fonts, never more:** Fraunces (display, italic-as-accent), Inter (body/UI), JetBrains Mono (eyebrows/tokens). No `font-serif` token exists on purpose — Fraunces is display-only.
- **Generous radii** ("rounder than feels safe"), **warm-tinted soft shadows** (`shadow-e1`–`e4` only — no `shadow-sm/md/lg`), hairline borders, **no gradients, no fake depth, no noise**.
- **Both themes:** light (`hanko`, default) and dark (`hanko-night`). Vermillion stays constant across both — only the surroundings invert.
- **Strong left alignment** with generous left margins. Hanko breathes — vary the spacing rhythm (`gap-4`/`gap-6`/`gap-8`), don't default to `gap-2`.

**Anti-references — what this must NOT look like:**

- v1 kanNINJA: generic shadcn blue + primary→purple gradient AI-slop. Never echo its colors, typography, or layout choices.
- "Lightning fast / moves fast" SaaS landing-page tropes. The current [src/app/page.tsx](src/app/page.tsx) is a good example of what to *replace*: gradient hero, generic badge, four bland feature cards, "moves fast" copy. None of that respects Hanko.
- Cold grays, neon semantic colors, hard drop shadows, default Tailwind blue, centered-everything layouts.
- Anything that looks like every other AI-generated B2B SaaS dashboard.

### Design Principles

1. **One stamp per screen.** Vermillion is the seal — reserve it for the single most important action. If `bg-primary` appears more than once on a page, you're devaluing it. Secondary actions go to `btn-secondary` (sumi/snow) or `btn-ghost`.

2. **Restraint earns trust, warmth carries weight.** Hairlines over heavy borders. Soft warm `shadow-e*` over hard drops. Cream paper over cold gray. The interface should feel like a well-made notebook, not a dashboard.

3. **Fraunces is a signature move, not a decoration.** Italic Fraunces in vermillion is the "this is kanNINJA, not generic SaaS" moment — use it for hero emphasis and at most a handful of card/section titles per page. Overusing it kills the effect. Never use Fraunces for body text or anything under 18px.

4. **Hanko breathes.** When in doubt, more whitespace, not less. Reach for `p-6`, `p-8`, `p-12` deliberately. The 4px spacing grid is a brand commitment — every padding and gap should resolve to a Tailwind utility, never a magic number.

5. **Mastery is in the details.** The peak emotional moment is craftsmanship — so the tool itself has to feel honed. No half-built components, no placeholder text in shipped code, focus ring on every interactive element (`shadow-focus`), soft transitions, alignment to the 4px grid, semantic DaisyUI classes (not raw hex), eyebrow labels in mono caps where they earn their keep.

6. **WCAG 2.2 AA is the floor.** Keyboard navigation, visible focus (vermillion `shadow-focus` ring) on every interactive element, 4.5:1 contrast for body text, `prefers-reduced-motion` respected, no color-only state indicators (always pair color with icon or text).

## Working in this directory

- DaisyUI semantic classes (`bg-primary`, `text-base-content`, `btn`, `card`) by default — they auto-flip between light/dark themes. Reach for raw hex only when a color must NOT theme-flip (rare).
- FontAwesome icons via `@fortawesome/react-fontawesome` (not lucide-react).
- Apache ECharts via `echarts-for-react` for charts (not recharts).
- All data flows through the Fastify API via `src/lib/api-client.ts` + React Query hooks. The frontend's only direct Supabase usage is Realtime broadcast/presence in `src/lib/supabase-client.ts`.
- Files should be 200 lines or less.
