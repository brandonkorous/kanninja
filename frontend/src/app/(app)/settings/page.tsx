'use client';

import { ProfileSection } from '@/components/settings/ProfileSection';
import { SubscriptionSection } from '@/components/settings/SubscriptionSection';
import { ApiKeysSection } from '@/components/settings/ApiKeysSection';

export default function SettingsPage() {
    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-16">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Settings
                </p>
                <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
                    Your{' '}
                    <span className="italic text-primary">preferences.</span>
                </h1>
                <p className="mt-4 text-base text-base-content/60 max-w-xl">
                    How you appear, what you&rsquo;re paying, and who we talk to.
                </p>
            </div>

            <div className="space-y-8">
                <ProfileSection />
                <SubscriptionSection />
                <ApiKeysSection />
            </div>
        </div>
    );
}
