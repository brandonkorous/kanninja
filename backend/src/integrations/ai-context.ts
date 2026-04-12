import * as repo from '../repositories/integration.repo.js';
import { decrypt } from './crypto.js';

interface IntegrationContext {
  connectedServices: string[];
  recentEvents: Array<{
    provider: string;
    type: string;
    direction: string;
    timestamp: string;
  }>;
  calendarEvents?: Array<{
    summary: string;
    start: string;
    end: string;
  }>;
}

/**
 * Gather integration context for AI prompts. This gives AI features
 * awareness of what external tools are connected and recent activity.
 */
export async function getIntegrationContext(
  profileId: string,
): Promise<IntegrationContext> {
  const connections = await repo.findConnectionsByProfile(profileId);
  const active = connections.filter((c) => c.status === 'active');

  const connectedServices = active.map((c) => c.providerId);

  // Gather recent events across all connections (last 20)
  const allEvents: IntegrationContext['recentEvents'] = [];
  for (const conn of active) {
    const events = await repo.findEventsByConnection(conn.id, 10);
    for (const e of events) {
      allEvents.push({
        provider: conn.providerId,
        type: e.eventType,
        direction: e.direction,
        timestamp: e.createdAt.toISOString(),
      });
    }
  }

  // Sort by most recent, take top 20
  allEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const recentEvents = allEvents.slice(0, 20);

  return { connectedServices, recentEvents };
}

/**
 * Fetch upcoming Google Calendar events for calendar-aware AI features.
 * Returns the next 7 days of events for conflict detection.
 */
export async function getCalendarEvents(
  profileId: string,
): Promise<IntegrationContext['calendarEvents']> {
  const connections = await repo.findConnectionsByProfile(profileId);
  const calConn = connections.find(
    (c) => c.providerId === 'google_calendar' && c.status === 'active',
  );

  if (!calConn || !calConn.encryptedAccessToken) return [];

  const accessToken = decrypt(calConn.encryptedAccessToken);
  const calendarId =
    (calConn.providerConfig?.calendarId as string) || 'primary';
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: weekFromNow.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '30',
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) return [];

    const data = (await res.json()) as {
      items: Array<{
        summary?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }>;
    };

    return data.items.map((e) => ({
      summary: e.summary ?? '(untitled)',
      start: e.start?.dateTime ?? e.start?.date ?? '',
      end: e.end?.dateTime ?? e.end?.date ?? '',
    }));
  } catch {
    return [];
  }
}
