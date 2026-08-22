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
      if (!res.ok) {
        console.warn(`favicon: ${url} returned ${res.status}`);
        continue;
      }
      const type = res.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) {
        console.warn(`favicon: ${url} is ${type || "typeless"}, not an image`);
        continue;
      }
      const buf = await res.arrayBuffer();
      // a real icon is bigger than a 16x16 placeholder stub
      if (buf.byteLength < 150) {
        console.warn(`favicon: ${url} is a ${buf.byteLength}-byte stub, skipping`);
        continue;
      }
      const dims = imageDimensions(buf);
      if (dims && (dims.w < 16 || dims.h < 16)) {
        console.warn(`favicon: ${url} is ${dims.w}x${dims.h}, below 16x16, skipping`);
        continue;
      }
      return url;
    } catch (err) {
      console.warn(`favicon: ${url} fetch failed`, err);
      continue;
    }
  }
  console.warn(`favicon: no usable icon for ${domain}, falling back to tile`);
  return null;
}

/**
 * Header-sniff image dimensions for png, gif, ico, and jpeg. Returns
 * null for formats it does not recognise (those pass through on the
 * byte-size check alone).
 */
export function imageDimensions(
  buf: ArrayBuffer
): { w: number; h: number } | null {
  const b = new Uint8Array(buf);
  if (b.length < 24) return null;

  // png: 8-byte signature, IHDR width/height at offsets 16/20, big-endian
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    const dv = new DataView(buf);
    return { w: dv.getUint32(16), h: dv.getUint32(20) };
  }
  // gif: "GIF8", width/height at 6/8, little-endian
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
    return { w: b[6] | (b[7] << 8), h: b[8] | (b[9] << 8) };
  }
  // ico: reserved 0, type 1; first entry width/height at 6/7 (0 = 256)
  if (b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0 && b[4] > 0) {
    return { w: b[6] || 256, h: b[7] || 256 };
  }
  // jpeg: scan markers for SOF0-SOF15 (skipping DHT/DAC/RST)
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      const len = (b[i + 2] << 8) | b[i + 3];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { w: (b[i + 7] << 8) | b[i + 8], h: (b[i + 5] << 8) | b[i + 6] };
      }
      i += 2 + len;
    }
  }
  return null;
}
