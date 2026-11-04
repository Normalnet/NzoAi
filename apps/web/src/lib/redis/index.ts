import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url && !process.env.REDIS_HOST) {
    return null;
  }

  try {
    const redisOptions = {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        if (times > 2) return null; // Stop reconnecting after 2 attempts if Redis isn't running
        return 1000;
      },
    };

    redisClient = url
      ? new Redis(url, redisOptions)
      : new Redis({
          host: process.env.REDIS_HOST || "localhost",
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          db: Number(process.env.REDIS_DB) || 0,
          ...redisOptions,
        });

    redisClient.on("error", (err) => {
      // Log once, suppress repetitive spam
      if (err.message) {
        console.warn("[redis] Redis connection warning:", err.message);
      }
    });

    return redisClient;
  } catch (e) {
    console.warn("[redis] Could not initialize Redis client:", e);
    return null;
  }
}
