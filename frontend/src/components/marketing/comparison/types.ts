// Shape of every /vs/<competitor> page. Each comparison file declares one
// of these and hands it to ComparisonPage. Keeping this strict so the
// content stays consistent — and so we never end up with a comparison page
// that quietly skips, say, the honesty section.

export interface ComparisonRow {
    feature: string;
    /** "Yes", "No", "Add-on", or a short specific phrase. */
    kanninja: string;
    competitor: string;
    /** Optional one-liner under the row to add nuance. */
    note?: string;
}

export interface ComparisonFAQ {
    q: string;
    a: string;
}

export interface ComparisonData {
    competitor: string;
    competitorShort: string;
    /** A single phrase the competitor uses to describe themselves. */
    competitorPositioning: string;
    /** The hero subtitle — one sentence that frames the comparison honestly. */
    heroSubtitle: string;
    /** The thing kanNINJA does that the competitor structurally cannot. */
    coreDifference: string;
    /**
     * "Pick them if" bullets — when the competitor is genuinely the right
     * answer. Three or four items. Honesty earns the rest of the page.
     */
    pickThemIf: string[];
    /** "Pick kanNINJA if" bullets — three or four. */
    pickUsIf: string[];
    rows: ComparisonRow[];
    faqs: ComparisonFAQ[];
}
