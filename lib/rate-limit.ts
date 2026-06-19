// In-memory rate limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    store.set(key, newRecord);
    return { limited: false, remaining: limit - 1, resetTime: newRecord.resetTime };
  }

  if (record.count >= limit) {
    return { limited: true, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  return { limited: false, remaining: limit - record.count, resetTime: record.resetTime };
}
