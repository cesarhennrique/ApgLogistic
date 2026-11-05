// shortcut: memória por instância serverless, não compartilhada; trocar por Upstash Redis se houver abuso.
// A sliding window per key: each allowed hit's time, the ones older than windowMs dropped on the next check.
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();
  return function allow(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    // keys whose hits have all left the window go, so the map stays small
    if (hits.size > 1000) for (const [k, ts] of hits) if (ts.every((t) => now - t >= windowMs)) hits.delete(k);
    return true;
  };
}

// The client's IP: the first address of x-forwarded-for (set by Vercel's edge), "unknown" without it.
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
