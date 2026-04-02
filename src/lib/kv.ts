import Redis from "ioredis";

// Thin wrapper over ioredis that matches the @vercel/kv interface used in this
// app (kv.set with TTL, kv.get with auto JSON parse/stringify).
const client = new Redis(process.env.REDIS_URL!, {
  lazyConnect: false,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

interface SetOptions {
  ex?: number; // TTL in seconds
}

export const kv = {
  async set(key: string, value: unknown, options?: SetOptions): Promise<void> {
    const serialized = JSON.stringify(value);
    if (options?.ex) {
      await client.set(key, serialized, "EX", options.ex);
    } else {
      await client.set(key, serialized);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    const raw = await client.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  },
};
