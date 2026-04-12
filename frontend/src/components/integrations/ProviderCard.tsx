'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlug,
  faLock,
  faArrowsRotate,
  faPause,
  faPlay,
  faTrash,
  faGear,
  faCalendarDays,
  faEnvelope,
  faBook,
  faBolt,
  faVideo,
  faClock,
  faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import {
  faSlack,
  faGithub,
  faGitlab,
  faBitbucket,
  faFigma,
  faJira,
  faDiscord,
  faGoogle,
  faDropbox,
  faMicrosoft,
  faIntercom,
  faHubspot,
  faSalesforce,
  faConfluence,
} from '@fortawesome/free-brands-svg-icons';
import { ConnectionStatus } from './ConnectionStatus';
import type { IntegrationProvider, IntegrationConnection } from '@/hooks/use-integrations';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const PROVIDER_ICONS: Record<string, { icon: IconDefinition; color: string }> = {
  // Built
  google_calendar: { icon: faCalendarDays, color: 'text-blue-500' },
  slack: { icon: faSlack, color: 'text-[#4A154B]' },
  github: { icon: faGithub, color: 'text-base-content' },
  // Messaging
  microsoft_teams: { icon: faMicrosoft, color: 'text-[#6264A7]' },
  discord: { icon: faDiscord, color: 'text-[#5865F2]' },
  // Calendar
  outlook: { icon: faMicrosoft, color: 'text-[#0078D4]' },
  // Email
  gmail: { icon: faGoogle, color: 'text-[#EA4335]' },
  // Knowledge
  notion: { icon: faBook, color: 'text-base-content' },
  confluence: { icon: faConfluence, color: 'text-[#172B4D]' },
  google_docs: { icon: faGoogle, color: 'text-[#4285F4]' },
  // Dev Tools
  gitlab: { icon: faGitlab, color: 'text-[#FC6D26]' },
  bitbucket: { icon: faBitbucket, color: 'text-[#0052CC]' },
  // Design
  figma: { icon: faFigma, color: 'text-[#F24E1E]' },
  // PM Import
  linear: { icon: faBook, color: 'text-[#5E6AD2]' },
  jira: { icon: faJira, color: 'text-[#0052CC]' },
  // Automation
  zapier: { icon: faBolt, color: 'text-[#FF4A00]' },
  make: { icon: faBolt, color: 'text-[#6D00CC]' },
  generic_webhooks: { icon: faPlug, color: 'text-base-content/60' },
  // Files
  google_drive: { icon: faGoogle, color: 'text-[#0F9D58]' },
  dropbox: { icon: faDropbox, color: 'text-[#0061FF]' },
  onedrive: { icon: faMicrosoft, color: 'text-[#094AB2]' },
  // Media
  loom: { icon: faVideo, color: 'text-[#625DF5]' },
  // Time Tracking
  toggl: { icon: faClock, color: 'text-[#E57CD8]' },
  // Support
  zendesk: { icon: faHeadset, color: 'text-[#03363D]' },
  intercom: { icon: faIntercom, color: 'text-[#1F8DED]' },
  // CRM
  hubspot: { icon: faHubspot, color: 'text-[#FF7A59]' },
  salesforce: { icon: faSalesforce, color: 'text-[#00A1E0]' },
};

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  essentials: 'Essentials',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
};

interface ProviderCardProps {
  provider: IntegrationProvider;
  connection?: IntegrationConnection;
  onConnect: () => void;
  onDisconnect: (id: string) => void;
  onPause: (id: string) => void;
  onSync: (id: string) => void;
  onConfigure: (id: string) => void;
  isConnecting: boolean;
}

export function ProviderCard({
  provider,
  connection,
  onConnect,
  onDisconnect,
  onPause,
  onSync,
  onConfigure,
  isConnecting,
}: ProviderCardProps) {
  const isConnected = connection && connection.status !== 'revoked';
  const isLocked = !provider.available;
  const brandIcon = PROVIDER_ICONS[provider.id];

  return (
    <div
      className={`card bg-base-100 border shadow-e1 transition-all ${
        isConnected
          ? 'border-success/30 shadow-e2'
          : isLocked
            ? 'border-base-300 opacity-75'
            : 'border-base-300 hover:border-base-content/20 hover:shadow-e2'
      }`}
    >
      <div className="card-body p-6 gap-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                isConnected ? 'bg-success/10' : 'bg-base-200'
              }`}
            >
              {brandIcon ? (
                <FontAwesomeIcon
                  icon={brandIcon.icon}
                  className={`text-lg ${isConnected ? 'text-success' : brandIcon.color}`}
                />
              ) : (
                <FontAwesomeIcon icon={faPlug} className="text-base-content/40" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-base">
                  {provider.displayName}
                </h3>
                {provider.requiredTier !== 'free' && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                    {TIER_LABELS[provider.requiredTier] ?? provider.requiredTier}
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-base-content/40 mt-0.5">
                {provider.category}
              </p>
            </div>
          </div>
          {isConnected && <ConnectionStatus status={connection.status} />}
        </div>

        {/* Description */}
        {provider.description && (
          <p className="text-sm text-base-content/60 mt-3 leading-relaxed">
            {provider.description}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-base-200 mt-4 pt-4">
          {/* Actions */}
          {isLocked ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-base-content/40">
                Requires {TIER_LABELS[provider.requiredTier]} plan
              </p>
              <button className="btn btn-xs btn-ghost gap-1.5 text-primary">
                <FontAwesomeIcon icon={faLock} className="text-[10px]" />
                Upgrade
              </button>
            </div>
          ) : isConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  className="btn btn-xs btn-ghost gap-1"
                  onClick={() => onSync(connection.id)}
                  title="Sync now"
                >
                  <FontAwesomeIcon icon={faArrowsRotate} className="text-[10px]" />
                  Sync
                </button>
                <button
                  className="btn btn-xs btn-ghost gap-1"
                  onClick={() => onPause(connection.id)}
                  title={connection.status === 'paused' ? 'Resume' : 'Pause'}
                >
                  <FontAwesomeIcon
                    icon={connection.status === 'paused' ? faPlay : faPause}
                    className="text-[10px]"
                  />
                </button>
                <button
                  className="btn btn-xs btn-ghost"
                  onClick={() => onConfigure(connection.id)}
                  title="Configure"
                >
                  <FontAwesomeIcon icon={faGear} className="text-[10px]" />
                </button>
              </div>
              <button
                className="btn btn-xs btn-ghost text-error/60 hover:text-error"
                onClick={() => onDisconnect(connection.id)}
                title="Disconnect"
              >
                <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-sm btn-primary gap-2 w-full"
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <FontAwesomeIcon icon={faPlug} className="text-xs" />
              )}
              Connect {provider.displayName}
            </button>
          )}
        </div>

        {/* Last synced footer */}
        {isConnected && connection.lastSyncedAt && (
          <p className="text-[11px] text-base-content/30 mt-3 font-mono text-right">
            Synced {formatRelativeTime(connection.lastSyncedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
