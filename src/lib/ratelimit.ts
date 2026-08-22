/**
 * In-memory fixed-window rate limiter. Per serverless instance, which is
 * acceptable here: the goal is stopping casual checkout spam, and Polar
 * is the real gate on anything that touches the board.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = windows.get(key);
  if (!entry || entry.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  if (windows.size > 10_000) {
    for (const [k, v] of windows) if (v.resetAt < now) windows.delete(k);
  }
  return entry.count <= limit;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
