import { createClient } from "redis";

// Singleton Redis client for Next.js server components.
// Uses a connection promise to avoid race conditions when generateMetadata
// and the page component call getClient() concurrently.

type RedisClient = ReturnType<typeof createClient>;
let _connectPromise: Promise<RedisClient> | null = null;

function getClient(): Promise<RedisClient> {
  if (!_connectPromise) {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: { connectTimeout: 5000, reconnectStrategy: false },
    });
    client.on("error", () => {
      // Swallow connection errors so they don't become unhandled rejections.
      // getClient callers will receive a rejection from the connect promise
      // below if the connection fails.
    });
    _connectPromise = client.connect().then(() => client);
  }
  return _connectPromise;
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

  async incr(key: string): Promise<number> {
    const client = await getClient();
    return client.incr(key);
  },
};
