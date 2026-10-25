import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url && !process.env.REDIS_HOST) {
    return null;
  }

  try {
    redisClient = url
      ? new Redis(url, { maxRetriesPerRequest: 1, enableOfflineQueue: false })
      : new Redis({
          host: process.env.REDIS_HOST || "localhost",
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          db: Number(process.env.REDIS_DB) || 0,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        });

    redisClient.on("error", (err) => {
      console.warn("[redis] Redis connection warning:", err.message);
    });

    return redisClient;
  } catch (e) {
    console.warn("[redis] Could not initialize Redis client:", e);
    return null;
  }
}
