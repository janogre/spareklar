import { createClient } from "redis";

// Thin wrapper over node-redis that matches the @vercel/kv interface used in
// this app (kv.set with TTL, kv.get with auto JSON parse/stringify).
// Uses REDIS_URL env var (standard Redis connection string).

type RedisClient = ReturnType<typeof createClient>;
let _client: RedisClient | null = null;

async function getClient(): Promise<RedisClient> {
  if (_client?.isOpen) return _client;
  _client = createClient({
    url: process.env.REDIS_URL,
    socket: { connectTimeout: 5000, reconnectStrategy: false },
  });
  await _client.connect();
  return _client;
}

interface SetOptions {
  ex?: number; // TTL in seconds
}

export const kv = {
  async set(key: string, value: unknown, options?: SetOptions): Promise<void> {
    const client = await getClient();
    const serialized = JSON.stringify(value);
    if (options?.ex) {
      await client.set(key, serialized, { EX: options.ex });
    } else {
      await client.set(key, serialized);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    const client = await getClient();
    const raw = await client.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  },
};
