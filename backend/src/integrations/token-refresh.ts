import * as repo from '../repositories/integration.repo.js';
import { getProvider } from './registry.js';
import { encrypt, decrypt } from './crypto.js';
import { notificationService } from '../services/notification.service.js';

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const EXPIRY_BUFFER_MS = 10 * 60 * 1000; // refresh 10 min before expiry

let timer: ReturnType<typeof setInterval> | null = null;

export function startTokenRefreshJob() {
    if (timer) return;
    timer = setInterval(() => { refreshExpiringTokens().catch(() => { }); }, REFRESH_INTERVAL_MS);
    // Run once immediately on startup (non-blocking)
    refreshExpiringTokens().catch(() => { });
}

export function stopTokenRefreshJob() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

async function refreshExpiringTokens() {
    const connections = await repo.findActiveConnections();
    const now = Date.now();

    for (const conn of connections) {
        if (!conn.tokenExpiresAt || !conn.encryptedRefreshToken) continue;

        const expiresAt = new Date(conn.tokenExpiresAt).getTime();
        if (expiresAt - now > EXPIRY_BUFFER_MS) continue;

        try {
            const provider = getProvider(conn.providerId);
            const refreshToken = decrypt(conn.encryptedRefreshToken);
            const tokens = await provider.refreshTokens(refreshToken);

            await repo.updateConnection(conn.id, {
                encryptedAccessToken: encrypt(tokens.accessToken),
                encryptedRefreshToken: tokens.refreshToken
                    ? encrypt(tokens.refreshToken)
                    : conn.encryptedRefreshToken,
                tokenExpiresAt: tokens.expiresAt,
                consecutiveFailures: 0,
            });
        } catch {
            await repo.incrementFailures(conn.id);

            // Check if auto-disabled
            const updated = await repo.findConnectionById(conn.id);
            if (updated && updated.status === 'error') {
                await notifyAutoDisabled(conn.profileId, conn.providerId);
            }
        }
    }
}

async function notifyAutoDisabled(profileId: string, providerId: string) {
    await notificationService.notify({
        userId: profileId,
        type: 'integration.disabled',
        title: 'Integration disconnected',
        message: `Your ${providerId} integration was automatically disabled after repeated failures. Please reconnect it.`,
        data: { providerId },
    }).catch(() => { });
}
