export type Identity = {
  identityKey: string;
  displayUrl: string;
  kind: "url" | "handle";
};

/**
 * The single normalisation function. Every lookup and every insert goes
 * through here — it is what makes "same url tops up the same row" true.
 *
 * urls:    trim, lowercase, strip http(s)://, strip leading www.,
 *          strip query + fragment, strip trailing slash.
 * handles: trim, lowercase, strip leading @, prefix with "x:".
 *
 * returns null for anything that is not a plausible http(s) url or handle,
 * including javascript:, data:, and every other scheme.
 */
export function normalizeIdentity(raw: string): Identity | null {
  const input = raw.trim();
  if (!input) return null;

  if (input.startsWith("@")) {
    const handle = input.replace(/^@+/, "").trim().toLowerCase();
    if (!/^[a-z0-9_.]{1,30}$/.test(handle)) return null;
    return {
      identityKey: `x:${handle}`,
      displayUrl: `https://x.com/${handle}`,
      kind: "handle",
    };
  }

  let v = input.toLowerCase();

  const scheme = v.match(/^([a-z][a-z0-9+.-]*):/);
  if (scheme && scheme[1] !== "http" && scheme[1] !== "https") return null;

  v = v.replace(/^https?:\/\//, "");
  v = v.replace(/^www\./, "");
  v = v.split(/[?#]/)[0];
  v = v.replace(/\/+$/, "");
  if (!v) return null;

  const host = v.split("/")[0];
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return null;

  try {
    new URL(`https://${v}`);
  } catch {
    return null;
  }

  return { identityKey: v, displayUrl: `https://${v}`, kind: "url" };
}
