import { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

/**
 * Two endpoints, because liveness and readiness answer different questions and
 * giving them the same answer is actively harmful.
 *
 * Until the Azure cutover both probes — and the startup probe — pointed at the
 * static handler below. That meant a pod reported Ready, joined the Service and
 * received traffic while the database was unreachable: the deploy went green,
 * `kubectl rollout status` succeeded, and every real request 500'd. On a
 * migration where the database is moving, a wrong `kanninja_app` password or an
 * unresolvable private DNS name would have looked exactly like a healthy
 * deploy.
 */
export async function healthRoutes(fastify: FastifyInstance) {
  /**
   * LIVENESS — "is this process wedged?"
   *
   * Deliberately touches nothing. A liveness failure gets the container KILLED,
   * and restarting a pod does not repair a database: if this checked the
   * database, a brief Postgres blip would restart every replica at once, each
   * would fail its startup probe against the same unreachable server, and a
   * recoverable incident becomes a crashloop that outlives its cause.
   *
   * Also the startup probe, for the same reason.
   */
  fastify.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  /**
   * READINESS — "should this pod be sent traffic?"
   *
   * A failure here removes the pod from the Service endpoints and leaves it
   * running, which is the correct response to a dependency being down: stop
   * advertising, keep the process, recover when the dependency does.
   *
   * `SELECT 1` proves the whole chain the static check cannot: that the private
   * DNS name resolves from inside the VNet, that TLS negotiates, that the
   * `kanninja_app` role's password matches, and that the pool can hand out a
   * connection.
   */
  fastify.get('/api/health/ready', async (request, reply) => {
    // Raced against a deadline shorter than the probe's own timeoutSeconds.
    // postgres.js has a 15s connect_timeout, so an unreachable server would
    // otherwise leave the probe hanging until Kubernetes gave up — which reads
    // as a timeout rather than a refusal, and holds a connection slot open for
    // every probe in the meantime.
    //
    // The timer is cleared in `finally` so a healthy check does not leave a
    // pending timeout behind on every probe — at one probe per 10s per pod that
    // is otherwise a steady trickle of garbage for no reason.
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        db.execute(sql`select 1`),
        new Promise((_resolve, rejectDeadline) => {
          timer = setTimeout(() => rejectDeadline(new Error('database check timed out')), 2000);
        }),
      ]);
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch (error) {
      // warn, not error: a readiness failure during a rollout or a planned
      // database restart is expected, and paging on it trains people to ignore
      // the signal that matters.
      request.log.warn({ err: error }, 'readiness check failed');
      // 503, not 500 — "not ready yet" is a normal state, not a fault.
      return reply.code(503).send({
        status: 'not_ready',
        reason: 'database unreachable',
        timestamp: new Date().toISOString(),
      });
    } finally {
      clearTimeout(timer);
    }
  });
}
