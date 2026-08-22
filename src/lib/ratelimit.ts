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
  // prefer headers the platform itself sets and callers cannot spoof;
  // fall back to the LAST forwarded entry (appended by the trusted
  // proxy), never the attacker-writable first one
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",");
    return parts[parts.length - 1].trim();
  }
  return "unknown";
}
