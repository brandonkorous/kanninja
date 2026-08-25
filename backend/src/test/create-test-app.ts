import Fastify from 'fastify';
import { errorHandlerPlugin } from '../plugins/error-handler.js';

/**
 * Creates a minimal Fastify instance for route integration tests.
 * Auth is bypassed — profileId is set to a fixed test user.
 */
export async function createTestApp(
  registerRoutes: (app: ReturnType<typeof Fastify>) => Promise<void>,
  profileId = 'test-user-1',
) {
  const app = Fastify({ logger: false });

  // Decorate request like the real auth plugin does
  app.decorateRequest('authUserId', undefined);
  app.decorateRequest('profileId', undefined);

  // Bypass auth — inject profileId on every request
  app.addHook('onRequest', async (request) => {
    request.authUserId = 'auth_test_user';
    request.profileId = profileId;
  });

  await app.register(errorHandlerPlugin);
  await registerRoutes(app);
  await app.ready();

  return app;
}
