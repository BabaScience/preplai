/**
 * @preplai/mcp-server — Audio Store
 *
 * In-memory storage for generated audio buffers.
 * Keyed by sessionId/frameIndex. Typical audio is ~50 KB per frame.
 *
 * Future: Add LRU eviction or filesystem persistence for large deployments.
 */

export class AudioStore {
  private readonly cache = new Map<string, Buffer>();

  private key(sessionId: string, frameIndex: number): string {
    return `${sessionId}/${frameIndex}`;
  }

  /** Store an audio buffer for a specific frame. */
  set(sessionId: string, frameIndex: number, audio: Buffer): void {
    this.cache.set(this.key(sessionId, frameIndex), audio);
  }

  /** Retrieve an audio buffer. Returns null if not found. */
  get(sessionId: string, frameIndex: number): Buffer | null {
    return this.cache.get(this.key(sessionId, frameIndex)) ?? null;
  }

  /** Check if audio exists for a specific frame. */
  has(sessionId: string, frameIndex: number): boolean {
    return this.cache.has(this.key(sessionId, frameIndex));
  }

  /** Delete all audio buffers for a session. */
  deleteSession(sessionId: string): number {
    const prefix = `${sessionId}/`;
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  /** Get total number of stored audio buffers. */
  get size(): number {
    return this.cache.size;
  }

  /** Get approximate total memory usage in bytes. */
  get memoryUsage(): number {
    let total = 0;
    for (const buffer of this.cache.values()) {
      total += buffer.byteLength;
    }
    return total;
  }
}
