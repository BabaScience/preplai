/**
 * @pre/mcp-server — SSE Subscriber Registry
 *
 * Manages Server-Sent Events subscribers per session.
 * The player connects via EventSource at /session/:id/events.
 */

/** Minimal interface for the raw writable stream on a reply object. */
export interface SseReply {
  raw: {
    write(data: string): boolean;
  };
}

export class SseRegistry {
  private readonly subscribers = new Map<string, Set<SseReply>>();

  /**
   * Register a subscriber (Fastify reply) for a session's SSE events.
   */
  subscribe(sessionId: string, reply: SseReply): void {
    if (!this.subscribers.has(sessionId)) {
      this.subscribers.set(sessionId, new Set());
    }
    this.subscribers.get(sessionId)!.add(reply);
  }

  /**
   * Remove a subscriber when the connection closes.
   */
  unsubscribe(sessionId: string, reply: SseReply): void {
    this.subscribers.get(sessionId)?.delete(reply);
  }

  /**
   * Push a JSON event to all subscribers of a session.
   * Automatically removes subscribers that fail to write (disconnected).
   */
  emit(sessionId: string, event: Record<string, unknown>): void {
    const subs = this.subscribers.get(sessionId);
    if (!subs || subs.size === 0) return;

    const data = JSON.stringify(event);
    for (const reply of subs) {
      try {
        reply.raw.write(`data: ${data}\n\n`);
      } catch {
        // Subscriber disconnected; remove it
        subs.delete(reply);
      }
    }
  }

  /**
   * Get the number of active subscribers for a session.
   */
  subscriberCount(sessionId: string): number {
    return this.subscribers.get(sessionId)?.size ?? 0;
  }
}
