import fp from 'fastify-plugin';
import type { FastifyRequest } from 'fastify';
import { auth } from '../lib/auth.js';

/**
 * Mounts Better Auth's handler at /api/auth/*.
 *
 * Better Auth ships a web-standard handler — `(Request) => Promise<Response>` —
 * so this plugin is a two-way adapter between Fastify's Node-style req/reply
 * and the Fetch API. Three things it has to get right:
 *
 *  1. **Raw body.** Better Auth parses the body itself. Fastify's JSON parser
 *     would hand it an already-decoded object, so we install a catch-all
 *     content-type parser that leaves the payload as a string. It's scoped to
 *     this plugin's encapsulation context, so the rest of the API keeps normal
 *     JSON parsing. (This is also why it doesn't use `fastify-raw-body`, which
 *     is registered `global: false` for webhook signature checks.)
 *
 *  2. **Set-Cookie.** A sign-in response sets more than one cookie, and
 *     `headers.get('set-cookie')` folds them into a single comma-joined string
 *     that browsers then parse wrongly. `getSetCookie()` preserves them as
 *     separate values.
 *
 *  3. **A real absolute URL.** Better Auth resolves callback URLs and does its
 *     origin check against it, so it must be built from the configured public
 *     base URL rather than whatever Host header arrived.
 */

function toWebRequest(request: FastifyRequest): Request {
  const url = new URL(request.url, `${request.protocol}://${request.hostname}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.append(key, String(value));
    }
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  return new Request(url.toString(), {
    method: request.method,
    headers,
    body: hasBody ? (request.body as string | undefined) : undefined,
  });
}

export const betterAuthPlugin = fp(async (fastify) => {
  // Leave bodies untouched — Better Auth does its own parsing.
  fastify.addContentTypeParser(
    '*',
    { parseAs: 'string' },
    (_request, payload, done) => done(null, payload),
  );

  fastify.route({
    method: ['GET', 'POST', 'OPTIONS'],
    url: '/api/auth/*',
    handler: async (request, reply) => {
      try {
        const response = await auth.handler(toWebRequest(request));

        reply.status(response.status);

        const setCookies = response.headers.getSetCookie();
        for (const cookie of setCookies) reply.header('set-cookie', cookie);

        response.headers.forEach((value, key) => {
          if (key.toLowerCase() === 'set-cookie') return;
          reply.header(key, value);
        });

        return reply.send(response.body ? await response.text() : null);
      } catch (error) {
        request.log.error({ err: error }, 'Better Auth handler failed');
        // Deliberately not routed through the app's AppError handler: this is
        // the auth endpoint, and leaking internals here is how you hand an
        // attacker a map.
        return reply.status(500).send({ error: 'Authentication service error' });
      }
    },
  });
});
