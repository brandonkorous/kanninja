import type { Metadata } from 'next';
import { ComparisonPage } from '@/components/marketing/comparison/ComparisonPage';
import type { ComparisonData } from '@/components/marketing/comparison/types';
import { buildPageMetadata } from '@/lib/seo';

const data: ComparisonData = {
    competitor: 'Linear',
    competitorShort: 'Linear',
    competitorPositioning: 'the issue tracking tool you’ll enjoy using',
    heroSubtitle:
        "Linear is the gold standard for engineering teams — fast, opinionated, beautifully made. kanNINJA borrows the craft and points it at everyone else: the freelancer, the small team, the people whose work isn’t shipped as a release.",
    coreDifference:
        "Linear is built around the engineering loop: issues, cycles, projects, releases. kanNINJA is built around the kata — the small unit of work anyone can practice. Same craftsmanship, different audience.",
    pickThemIf: [
        "You're an engineering team and your work is shaped by issues, cycles, and releases.",
        "Keyboard-first navigation and CMD+K for everything is non-negotiable.",
        "You want tight GitHub / GitLab / Slack integration as the spine of your workflow.",
        "Your team values opinionated workflow over flexibility.",
    ],
    pickUsIf: [
        "You're not an engineering team — and Linear's vocabulary (cycles, triage, releases) doesn't fit how you work.",
        "You want the same craftsmanship Linear has, applied to general kanban.",
        "You need AI suggestions on cards — not a Slackbot integration.",
        "You'd like a generous free tier instead of a 250-issue cap.",
    ],
    rows: [
        { feature: 'Free tier', kanninja: 'Yes — forever, no issue cap', competitor: 'Yes — 250 issue cap' },
        { feature: 'Built for', kanninja: 'Anyone — kata are universal', competitor: 'Engineering teams primarily' },
        { feature: 'Keyboard navigation', kanninja: 'Yes — first-class', competitor: 'Yes — best-in-class' },
        { feature: 'AI built in', kanninja: 'Yes — 12 techniques (Pro)', competitor: 'Magic AI (limited, paid)' },
        { feature: 'Real-time presence', kanninja: 'Yes, native', competitor: 'Yes' },
        { feature: 'Cycles / sprints concept', kanninja: 'No — boards stand alone', competitor: 'Yes — central to the model' },
        { feature: 'Time tracking', kanninja: 'Yes, in the card', competitor: 'Integration only' },
        { feature: 'MCP server for AI agents', kanninja: 'Yes — 15 tools', competitor: 'Yes' },
        { feature: 'Pricing entry (paid)', kanninja: '$8 / user / month', competitor: '$10 / user / month (Standard)' },
    ],
    faqs: [
        {
            q: 'Is kanNINJA trying to compete with Linear for engineering teams?',
            a: "Honestly, no. If you're a 5-person engineering team shipping weekly cycles, Linear is purpose-built for you. We borrow Linear's discipline about craft and point it at the people Linear isn't built for.",
        },
        {
            q: 'Why don’t you have cycles?',
            a: "Because cycles are a Scrum / engineering concept and kanNINJA is for everyone — moms, freelancers, agencies, students. Boards stand on their own; if you want to time-box, you make a board called “This week.”",
        },
        {
            q: 'Is the keyboard navigation as good as Linear’s?',
            a: "Honest answer: Linear's keyboard navigation is the best in the industry. We're good — every common action is keyboardable — but we're not at Linear's level yet.",
        },
        {
            q: 'How does the AI compare to Linear’s Magic AI?',
            a: "Linear's Magic AI is mostly assistive (write a description, summarize a thread). kanNINJA's AI watches the board and suggests the next move. Different jobs.",
        },
        {
            q: 'Can I import from Linear?',
            a: "Not yet. Linear's API is excellent so the import will be cleaner when we build it. For now, CSV + manual paste.",
        },
        {
            q: 'Why charge less than Linear?',
            a: "Different audience. Engineering teams have bigger budgets per seat than the broader knowledge-work audience kanNINJA targets.",
        },
    ],
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA vs Linear',
    description:
        "Linear is for engineering teams. kanNINJA borrows the same craftsmanship and points it at everyone else. An honest comparison.",
    path: '/vs/linear',
    ogTitle: 'kanNINJA vs Linear',
    ogEyebrow: 'Comparison',
    keywords: ['kanNINJA vs Linear', 'Linear alternative', 'Linear for non-developers', 'kanban for everyone'],
});

export default function VsLinearPage() {
    return <ComparisonPage slug="linear" data={data} />;
}
