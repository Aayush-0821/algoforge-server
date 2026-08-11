import { redisClient } from "./redis";

class RedisService {
  async set(key: string, value: string, ttlInSeconds?: number): Promise<void> {
    if (ttlInSeconds) {
      await redisClient.set(key, value, {
        EX: ttlInSeconds,
      });
      return;
    }
    await redisClient.set(key, value);
  }
  async get(key: string): Promise<string | null> {
    return redisClient.get(key);
  }

  async del(key: string): Promise<number> {
    return redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await redisClient.exists(key)) === 1;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return (await redisClient.expire(key, seconds)) === 1;
  }

  async increment(key: string): Promise<number> {
    return redisClient.incr(key);
  }

  async decrement(key: string): Promise<number> {
    return redisClient.decr(key);
  }

  async flush(): Promise<void> {
    await redisClient.flushDb();
  }
}

export const redisService = new RedisService();
