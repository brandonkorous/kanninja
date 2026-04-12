'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useUpdateConnectionConfig } from '@/hooks/use-integrations';
import type { IntegrationConnection } from '@/hooks/use-integrations';

interface ConfigModalProps {
  connection: IntegrationConnection;
  onClose: () => void;
}

/** Per-provider config field definitions */
const PROVIDER_FIELDS: Record<string, Array<{
  key: string;
  label: string;
  placeholder: string;
  helpText?: string;
}>> = {
  google_calendar: [
    { key: 'calendarId', label: 'Calendar ID', placeholder: 'primary', helpText: 'Use "primary" for your default calendar, or paste a specific calendar ID.' },
  ],
  slack: [
    { key: 'channelId', label: 'Slack Channel ID', placeholder: 'C0123456789', helpText: 'Right-click a channel in Slack → View channel details → copy the Channel ID.' },
  ],
  github: [
    { key: 'repository', label: 'Repository', placeholder: 'owner/repo', helpText: 'The full repository path, e.g. "acme/webapp".' },
  ],
  microsoft_teams: [
    { key: 'teamId', label: 'Team ID', placeholder: 'Team ID from Teams admin' },
    { key: 'channelId', label: 'Channel ID', placeholder: 'Channel ID' },
  ],
  outlook: [
    { key: 'calendarId', label: 'Calendar ID', placeholder: 'me', helpText: 'Use "me" for your primary calendar.' },
  ],
  gmail: [
    { key: 'notifyEmail', label: 'Notification Email', placeholder: 'you@example.com' },
  ],
  notion: [
    { key: 'databaseId', label: 'Notion Database ID', placeholder: 'Database ID from Notion URL' },
  ],
  gitlab: [
    { key: 'project', label: 'Project Path', placeholder: 'namespace/project', helpText: 'The full GitLab project path.' },
  ],
  bitbucket: [
    { key: 'workspace', label: 'Workspace', placeholder: 'workspace-slug' },
    { key: 'repoSlug', label: 'Repository', placeholder: 'repo-slug' },
  ],
  figma: [
    { key: 'teamId', label: 'Figma Team ID', placeholder: 'Team ID from Figma settings' },
  ],
  linear: [
    { key: 'teamId', label: 'Linear Team ID', placeholder: 'Team ID' },
  ],
  jira: [
    { key: 'cloudId', label: 'Cloud ID', placeholder: 'Your Jira Cloud ID' },
    { key: 'projectKey', label: 'Project Key', placeholder: 'PROJ' },
  ],
  zapier: [
    { key: 'hookUrl', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/...' },
  ],
  make: [
    { key: 'hookUrl', label: 'Webhook URL', placeholder: 'https://hook.make.com/...' },
  ],
  generic_webhooks: [
    { key: 'webhookUrl', label: 'Outbound Webhook URL', placeholder: 'https://your-server.com/webhook', helpText: 'kanNINJA will POST events to this URL with an HMAC signature.' },
  ],
  discord: [
    { key: 'channelId', label: 'Discord Channel ID', placeholder: 'Channel ID', helpText: 'Right-click a channel → Copy Channel ID (enable Developer Mode in Discord settings).' },
  ],
  google_drive: [
    { key: 'folderId', label: 'Folder ID', placeholder: 'Leave empty for root', helpText: 'Optional — the Google Drive folder ID for kanNINJA files.' },
  ],
  dropbox: [
    { key: 'folderPath', label: 'Folder Path', placeholder: '/kanNINJA', helpText: 'Dropbox folder path to sync with.' },
  ],
  onedrive: [
    { key: 'folderId', label: 'Folder ID', placeholder: 'root', helpText: 'OneDrive folder ID, or "root" for the root folder.' },
  ],
  toggl: [
    { key: 'workspaceId', label: 'Workspace ID', placeholder: 'Toggl Workspace ID' },
    { key: 'projectId', label: 'Project ID', placeholder: 'Optional — Toggl Project ID' },
  ],
  zendesk: [
    { key: 'subdomain', label: 'Zendesk Subdomain', placeholder: 'yourcompany', helpText: 'The subdomain from yourcompany.zendesk.com.' },
  ],
  hubspot: [
    { key: 'pipelineId', label: 'Deal Pipeline ID', placeholder: 'Pipeline ID', helpText: 'Optional — filter deals to a specific pipeline.' },
  ],
  salesforce: [
    { key: 'instanceUrl', label: 'Instance URL', placeholder: 'https://yourorg.my.salesforce.com' },
  ],
  confluence: [
    { key: 'cloudId', label: 'Cloud ID', placeholder: 'Atlassian Cloud ID' },
    { key: 'spaceKey', label: 'Space Key', placeholder: 'PROJ' },
  ],
  google_docs: [
    { key: 'folderId', label: 'Folder ID', placeholder: 'Leave empty for root' },
  ],
};

export function ConfigModal({ connection, onClose }: ConfigModalProps) {
  const update = useUpdateConnectionConfig();
  const config = connection.providerConfig ?? {};
  const fields = PROVIDER_FIELDS[connection.providerId] ?? [];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.key] = (config[field.key] as string) ?? '';
    }
    return initial;
  });

  const handleSave = () => {
    update.mutate({ id: connection.id, config: values }, { onSuccess: onClose });
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-lg">
            Configure Integration
          </h3>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-base-content/50">
            No configuration needed for this integration.
          </p>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="form-control">
                <label className="label">
                  <span className="label-text font-mono text-xs uppercase tracking-wider">
                    {field.label}
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={values[field.key] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                />
                {field.helpText && (
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">
                      {field.helpText}
                    </span>
                  </label>
                )}
              </div>
            ))}
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={update.isPending}
            >
              {update.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                'Save'
              )}
            </button>
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
