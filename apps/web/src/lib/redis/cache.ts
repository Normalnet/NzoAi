import { getRedisClient } from "./index";

const memoryFallbackCache = new Map<string, { value: any; expiresAt: number }>();

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // Redis error fallback
    }
  } else {
    const mem = memoryFallbackCache.get(key);
    if (mem && mem.expiresAt > Date.now()) {
      return mem.value;
    }
  }

  const freshData = await fetchFn();

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(freshData), "EX", ttlSeconds);
    } catch (err) {}
  } else {
    memoryFallbackCache.set(key, {
      value: freshData,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  return freshData;
}

export async function deleteCachedData(key: string): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.del(key);
    } catch (err) {}
  }
  memoryFallbackCache.delete(key);
}
