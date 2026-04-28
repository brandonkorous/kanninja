// Shape of every /for/<slug> page. Each persona file declares one of these
// and hands it to PersonaPage. Strict on purpose — every persona page should
// have the same skeleton (hero, intro, sample board, use cases, FAQs, close).

export interface PersonaUseCase {
    title: string;
    body: string;
}

export interface PersonaSampleColumn {
    name: string;
    cards: string[];
}

export interface PersonaFAQ {
    q: string;
    a: string;
}

export interface PersonaData {
    /** Title-cased label, e.g. "Moms", "Wedding planning". */
    label: string;
    /**
     * Hero composition. headlineItalic gets the italic-vermillion treatment.
     * Keep both pieces short — the goal is a 4-7 word headline.
     */
    hero: {
        eyebrow: string;
        headlineBefore: string;
        headlineItalic: string;
        subtitle: string;
    };
    /** A second-paragraph intro that grounds the persona in a real moment. */
    intro: string;
    /**
     * Sample board — 3 to 4 columns of plausible kata for this persona.
     * Optional: when omitted, PersonaPage looks up the persona's template in
     * @kanninja/shared (getTemplateByPersonaSlug) and derives the columns
     * from its lists. New persona pages should prefer the shared registry
     * so /templates and /for/<slug> stay in sync.
     */
    sampleBoard?: {
        title: string;
        columns: PersonaSampleColumn[];
    };
    /** 4 to 6 specific things this persona uses kanNINJA for. */
    useCases: PersonaUseCase[];
    /** 3 to 5 FAQs specific to the persona. Powers FAQPage JSON-LD too. */
    faqs: PersonaFAQ[];
    /** Closing CTA composition. */
    close: {
        headlineBefore: string;
        headlineItalic: string;
    };
}
