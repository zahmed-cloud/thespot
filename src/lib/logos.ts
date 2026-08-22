/**
 * Logo resolution. Runs at submit time, stored on the row in favicon_url:
 *   "platform:<id>"  → bundled brand mark
 *   "https://…"      → verified real favicon
 *   null             → deterministic gradient tile
 * Nothing ever renders as a grey globe.
 */

export type PlatformId =
  | "x" | "linkedin" | "instagram" | "github" | "youtube" | "tiktok"
  | "twitch" | "reddit" | "producthunt" | "discord" | "telegram"
  | "substack" | "medium" | "dribbble" | "behance" | "figma"
  | "notion" | "gumroad" | "appstore" | "playstore";

export type LogoRef =
  | { kind: "platform"; platform: PlatformId }
  | { kind: "img"; url: string }
  | { kind: "tile"; letter: string; gradient: number };

export function detectPlatform(identityKey: string): PlatformId | null {
  if (identityKey.startsWith("x:")) return "x";
  const host = identityKey.split("/")[0];
  const path = identityKey.slice(host.length + 1);

  const is = (...hosts: string[]) => hosts.includes(host);
  const ends = (suffix: string) => host === suffix || host.endsWith(`.${suffix}`);

  if (is("x.com", "twitter.com")) return "x";
  if (is("linkedin.com") && (path.startsWith("in/") || path.startsWith("company/")))
    return "linkedin";
  if (is("instagram.com")) return "instagram";
  if (is("github.com")) return "github";
  if (is("youtube.com", "youtu.be")) return "youtube";
  if (is("tiktok.com")) return "tiktok";
  if (is("twitch.tv")) return "twitch";
  if (is("reddit.com")) return "reddit";
  if (is("producthunt.com")) return "producthunt";
  if (is("discord.gg", "discord.com")) return "discord";
  if (is("t.me", "telegram.me")) return "telegram";
  if (ends("substack.com")) return "substack";
  if (is("medium.com") || ends("medium.com")) return "medium";
  if (is("dribbble.com")) return "dribbble";
  if (is("behance.net")) return "behance";
  if (is("figma.com")) return "figma";
  if (is("notion.so", "notion.site") || ends("notion.site")) return "notion";
  if (is("gumroad.com") || ends("gumroad.com")) return "gumroad";
  if (is("apps.apple.com")) return "appstore";
  if (is("play.google.com")) return "playstore";
  return null;
}

/** Eight curated gradient pairs. Deterministic per identity_key. */
export const TILE_GRADIENTS: Array<[string, string]> = [
  ["#4F7CF7", "#2B4ECC"],
  ["#7B5CF0", "#5233B8"],
  ["#E56399", "#B0336E"],
  ["#E8814D", "#C05621"],
  ["#3FB27F", "#217A54"],
  ["#38A8C9", "#1F6E8C"],
  ["#8899AC", "#5A6B7E"],
  ["#D8A03D", "#A9741C"],
];

export function gradientIndex(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) >>> 0;
  return h % TILE_GRADIENTS.length;
}

/** Submit-time encoding for the favicon_url column. */
export function encodePlatform(identityKey: string): string | null {
  const p = detectPlatform(identityKey);
  return p ? `platform:${p}` : null;
}

/** Render-time interpretation of whatever is stored on the row. */
export function logoRefFor(
  faviconUrl: string | null,
  identityKey: string,
  title: string
): LogoRef {
  if (faviconUrl?.startsWith("platform:")) {
    return { kind: "platform", platform: faviconUrl.slice(9) as PlatformId };
  }
  // rows written before the resolver existed may miss a stored platform
  const detected = detectPlatform(identityKey);
  if (detected) return { kind: "platform", platform: detected };
  if (faviconUrl && /^https:\/\//.test(faviconUrl)) {
    return { kind: "img", url: faviconUrl };
  }
  return {
    kind: "tile",
    letter: (title.replace(/^@/, "").trim()[0] ?? "?").toUpperCase(),
    gradient: gradientIndex(identityKey),
  };
}

/**
 * Server-side favicon resolution with verification, run at submit time.
 * Client-side resolution is what produced the grey-globe mess: the
 * browser fails silently and every row shows the fallback.
 */
export async function resolveFavicon(identityKey: string): Promise<string | null> {
  const domain = identityKey.split("/")[0];
  const candidates = [
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
    `https://${domain}/favicon.ico`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(3000),
        redirect: "follow",
      });
      if (!res.ok) continue;
      const type = res.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) continue;
      const bytes = (await res.arrayBuffer()).byteLength;
      // a real icon is bigger than a 16x16 placeholder stub
      if (bytes < 150) continue;
      return url;
    } catch {
      continue;
    }
  }
  return null;
}
