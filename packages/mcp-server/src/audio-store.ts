/**
 * @preplai/mcp-server — Audio Store (GridFS + Memory Cache)
 *
 * Persists audio buffers to MongoDB GridFS for durability across restarts.
 * Uses an in-memory Map as a read-through cache for low-latency serving.
 *
 * Graceful fallback: if init() is never called (e.g. in tests),
 * operates as a pure in-memory store.
 */

import mongoose from 'mongoose';
import { Readable } from 'node:stream';
import { Session as SessionModel } from '@preplai/db';

const BUCKET_NAME = 'audio';

// Use mongoose.mongo.GridFSBucket to avoid BSON version mismatch between
// separately-installed mongodb driver and the one bundled with mongoose.
type GridFSBucket = InstanceType<typeof mongoose.mongo.GridFSBucket>;

export class AudioStore {
  private readonly cache = new Map<string, Buffer>();
  private bucket: GridFSBucket | null = null;

  private key(sessionId: string, frameIndex: number): string {
    return `${sessionId}/${frameIndex}`;
  }

  private filename(sessionId: string, frameIndex: number): string {
    return `${sessionId}/${frameIndex}.mp3`;
  }

  /**
   * Initialize GridFS bucket. Call after connectDb().
   * Safe to skip in tests — store degrades to in-memory only.
   */
  init(db?: any): void {
    const nativeDb = db ?? mongoose.connection.db;
    if (!nativeDb) {
      console.warn('[AudioStore] No MongoDB connection — running in memory-only mode');
      return;
    }
    this.bucket = new mongoose.mongo.GridFSBucket(nativeDb as any, { bucketName: BUCKET_NAME });
    console.log('[AudioStore] GridFS bucket initialized');
  }

  /** Store an audio buffer for a specific frame. */
  async set(sessionId: string, frameIndex: number, audio: Buffer): Promise<void> {
    const k = this.key(sessionId, frameIndex);
    this.cache.set(k, audio);

    if (!this.bucket) return;

    const fname = this.filename(sessionId, frameIndex);

    try {
      // Delete existing file if any (upsert semantics)
      const existing = await this.bucket.find({ filename: fname }).toArray();
      for (const file of existing) {
        await this.bucket.delete(file._id);
      }

      // Write new file
      await new Promise<void>((resolve, reject) => {
        const uploadStream = this.bucket!.openUploadStream(fname, {
          metadata: { sessionId, frameIndex, contentType: 'audio/mpeg', createdAt: Date.now() },
        });
        const readable = Readable.from(audio);
        readable.pipe(uploadStream);
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
    } catch (err) {
      console.error(`[AudioStore] GridFS write failed for ${fname}:`, err);
      // Memory cache still has the buffer — serve from there
    }
  }

  /** Retrieve an audio buffer. Checks memory cache first, then GridFS. */
  async get(sessionId: string, frameIndex: number): Promise<Buffer | null> {
    const k = this.key(sessionId, frameIndex);

    // Fast path: memory cache
    const cached = this.cache.get(k);
    if (cached) return cached;

    // Slow path: GridFS
    if (!this.bucket) return null;

    const fname = this.filename(sessionId, frameIndex);
    try {
      const files = await this.bucket.find({ filename: fname }).toArray();
      if (files.length === 0) return null;

      const chunks: Buffer[] = [];
      const downloadStream = this.bucket.openDownloadStreamByName(fname);

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        downloadStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
        downloadStream.on('error', reject);
      });

      // Populate cache for next time
      this.cache.set(k, buffer);
      return buffer;
    } catch (err) {
      console.error(`[AudioStore] GridFS read failed for ${fname}:`, err);
      return null;
    }
  }

  /** Check if audio exists in memory cache (sync, used as optimization hint). */
  has(sessionId: string, frameIndex: number): boolean {
    return this.cache.has(this.key(sessionId, frameIndex));
  }

  /** Delete all audio buffers for a session (memory + GridFS). */
  async deleteSession(sessionId: string): Promise<number> {
    const prefix = `${sessionId}/`;
    let deleted = 0;

    // Clear memory cache
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    // Clear GridFS
    if (this.bucket) {
      try {
        const files = await this.bucket
          .find({ filename: { $regex: `^${sessionId}/` } })
          .toArray();
        for (const file of files) {
          await this.bucket.delete(file._id);
        }
        deleted = Math.max(deleted, files.length);
      } catch (err) {
        console.error(`[AudioStore] GridFS deleteSession failed for ${sessionId}:`, err);
      }
    }

    return deleted;
  }

  /**
   * Remove GridFS audio files whose sessionId no longer exists in the sessions collection.
   * Also clears corresponding entries from the in-memory cache.
   * Returns the number of orphaned files deleted.
   */
  async cleanOrphanedAudio(): Promise<number> {
    if (!this.bucket) return 0;

    try {
      const files = await this.bucket.find({}).toArray();
      if (files.length === 0) return 0;

      // Collect unique sessionIds from GridFS metadata
      const gridSessionIds = new Set<string>();
      for (const file of files) {
        const sid = file.metadata?.sessionId;
        if (sid) gridSessionIds.add(sid);
      }

      if (gridSessionIds.size === 0) return 0;

      // Find which of those sessions still exist in MongoDB
      const existingDocs = await SessionModel.find(
        { id: { $in: Array.from(gridSessionIds) } },
        { id: 1 },
      ).lean();
      const existingIds = new Set(existingDocs.map((d: any) => d.id));

      // Delete files belonging to sessions that no longer exist
      let deleted = 0;
      for (const file of files) {
        const sid = file.metadata?.sessionId;
        if (sid && !existingIds.has(sid)) {
          await this.bucket!.delete(file._id);
          deleted++;
        }
      }

      // Also purge memory cache entries for orphaned sessions
      if (deleted > 0) {
        const orphanedSids = Array.from(gridSessionIds).filter((s) => !existingIds.has(s));
        for (const sid of orphanedSids) {
          const prefix = `${sid}/`;
          for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
              this.cache.delete(key);
            }
          }
        }
      }

      return deleted;
    } catch (err) {
      console.error('[AudioStore] cleanOrphanedAudio failed:', err);
      return 0;
    }
  }

  /** Get total number of cached audio buffers (memory only). */
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
