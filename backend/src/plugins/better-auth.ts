import type { FastifyInstance, FastifyRequest } from 'fastify';
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

// NOT wrapped in fastify-plugin, and that is the whole point.
//
// `fp()` exists to BREAK encapsulation so a plugin's decorators reach the
// parent scope. This plugin decorates nothing and must not break it: the
// content-type parsers below have to stay inside this scope or every other
// route in the API loses normal JSON parsing. index.ts already says as much —
// "registered as its own encapsulated plugin because it installs a catch-all
// content-type parser that must not leak" — and wrapping it in fp() quietly
// did the opposite of what that comment promises.
export const betterAuthPlugin = async (fastify: FastifyInstance) => {
  // Leave bodies untouched — Better Auth parses them itself.
  //
  // BOTH REGISTRATIONS ARE REQUIRED. `'*'` is not a wildcard over every
  // content type; Fastify consults it only for types that have no more
  // specific parser, and it ships a built-in `application/json` one. So a
  // catch-all alone left JSON going through Fastify's parser, `request.body`
  // arrived as an OBJECT, and `new Request({ body: object })` stringified it
  // to "[object Object]" — which Better Auth then rejected with
  // "Invalid JSON in request body" on every sign-in, sign-up and password
  // reset. The failure is total and looks like a malformed client request.
  const asString = (
    _request: FastifyRequest,
    payload: unknown,
    done: (err: Error | null, body?: unknown) => void,
  ) => done(null, payload);

  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, asString);
  fastify.addContentTypeParser('*', { parseAs: 'string' }, asString);

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
};
