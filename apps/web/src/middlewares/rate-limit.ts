import { getRedisClient } from "../lib/redis";

const memoryLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  keyPrefix: string,
  identifier: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `ratelimit:${keyPrefix}:${identifier}`;
  const now = Date.now();
  const redis = getRedisClient();

  if (redis) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      const ttl = await redis.ttl(key);
      return {
        success: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
        reset: Math.max(0, ttl),
      };
    } catch (err) {
      // In case Redis fails, fallback to memory
    }
  }

  // Memory fallback
  const record = memoryLimitMap.get(key);
  if (!record || record.resetAt <= now) {
    memoryLimitMap.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      success: true,
      remaining: maxRequests - 1,
      reset: windowSeconds,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, maxRequests - record.count);
  const resetSecs = Math.ceil((record.resetAt - now) / 1000);

  return {
    success: record.count <= maxRequests,
    remaining,
    reset: resetSecs,
  };
}
