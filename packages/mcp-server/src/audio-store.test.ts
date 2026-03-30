/**
 * @preplai/mcp-server — AudioStore LRU Cache Tests
 *
 * Tests the in-memory LRU eviction behavior of AudioStore.
 * GridFS is not initialized, so the store operates in memory-only mode.
 */
import { describe, it, expect } from 'vitest';
import { AudioStore } from './audio-store.js';

/** Create a buffer of the given byte size. */
function buf(bytes: number): Buffer {
  return Buffer.alloc(bytes, 0x41);
}

describe('AudioStore LRU cache', () => {
  it('accepts a configurable maxBytes', () => {
    const store = new AudioStore(1024);
    expect(store.maxBytes).toBe(1024);
  });

  it('defaults to 500 MB maxBytes', () => {
    const store = new AudioStore();
    expect(store.maxBytes).toBe(500 * 1024 * 1024);
  });

  it('tracks memoryUsage as buffers are added', async () => {
    const store = new AudioStore(10_000);
    await store.set('s1', 0, buf(100));
    expect(store.memoryUsage).toBe(100);
    await store.set('s1', 1, buf(200));
    expect(store.memoryUsage).toBe(300);
  });

  it('evicts LRU entries when exceeding maxBytes', async () => {
    const store = new AudioStore(500);
    await store.set('s1', 0, buf(200)); // 200
    await store.set('s1', 1, buf(200)); // 400
    await store.set('s1', 2, buf(200)); // 600 → evicts s1/0 → 400
    expect(store.size).toBe(2);
    expect(store.has('s1', 0)).toBe(false);
    expect(store.has('s1', 1)).toBe(true);
    expect(store.has('s1', 2)).toBe(true);
    expect(store.memoryUsage).toBe(400);
  });

  it('promotes entries on get (LRU touch)', async () => {
    const store = new AudioStore(500);
    await store.set('s1', 0, buf(200)); // oldest
    await store.set('s1', 1, buf(200)); // middle
    // Touch s1/0 so it becomes most recently used
    await store.get('s1', 0);
    // Now s1/1 is the oldest — it should be evicted first
    await store.set('s1', 2, buf(200)); // 600 → evicts s1/1 → 400
    expect(store.has('s1', 0)).toBe(true);
    expect(store.has('s1', 1)).toBe(false);
    expect(store.has('s1', 2)).toBe(true);
  });

  it('handles overwrite of existing key correctly', async () => {
    const store = new AudioStore(1000);
    await store.set('s1', 0, buf(300));
    expect(store.memoryUsage).toBe(300);
    // Overwrite with a smaller buffer
    await store.set('s1', 0, buf(100));
    expect(store.memoryUsage).toBe(100);
    expect(store.size).toBe(1);
  });

  it('decrements bytes on deleteSession', async () => {
    const store = new AudioStore(10_000);
    await store.set('s1', 0, buf(100));
    await store.set('s1', 1, buf(200));
    await store.set('s2', 0, buf(50));
    expect(store.memoryUsage).toBe(350);
    await store.deleteSession('s1');
    expect(store.memoryUsage).toBe(50);
    expect(store.size).toBe(1);
  });

  it('evicts multiple entries if a single large buffer is inserted', async () => {
    const store = new AudioStore(500);
    await store.set('s1', 0, buf(100));
    await store.set('s1', 1, buf(100));
    await store.set('s1', 2, buf(100));
    expect(store.size).toBe(3);
    // Insert a 400-byte buffer (total 700) — evicts s1/0 and s1/1 to get to 500
    await store.set('s2', 0, buf(400));
    expect(store.size).toBe(2);
    expect(store.has('s1', 0)).toBe(false);
    expect(store.has('s1', 1)).toBe(false);
    expect(store.has('s1', 2)).toBe(true);
    expect(store.has('s2', 0)).toBe(true);
    expect(store.memoryUsage).toBe(500);
  });

  it('returns null for evicted entries (not in GridFS either)', async () => {
    const store = new AudioStore(300);
    await store.set('s1', 0, buf(200));
    await store.set('s1', 1, buf(200)); // evicts s1/0
    const result = await store.get('s1', 0);
    expect(result).toBeNull();
  });
});
