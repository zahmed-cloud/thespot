import { describe, expect, it } from "vitest";
import { detectPlatform, gradientIndex, imageDimensions } from "./logos";

describe("detectPlatform", () => {
  it("matches on the parsed hostname, never a substring of the url", () => {
    expect(detectPlatform("github.com/vercel")).toBe("github");
    expect(detectPlatform("notgithub.com/vercel")).toBeNull();
    expect(detectPlatform("github.com.evil.co/vercel")).toBeNull();
    expect(detectPlatform("mygithub.dev/x")).toBeNull();
    expect(detectPlatform("shipfast.club")).toBeNull();
  });

  it("matches known platforms and handles", () => {
    expect(detectPlatform("x:jamil")).toBe("x");
    expect(detectPlatform("x.com/jamil")).toBe("x");
    expect(detectPlatform("twitter.com/jamil")).toBe("x");
    expect(detectPlatform("linkedin.com/company/ascent")).toBe("linkedin");
    expect(detectPlatform("linkedin.com/feed")).toBeNull();
    expect(detectPlatform("quietletter.substack.com")).toBe("substack");
    expect(detectPlatform("youtu.be/abc")).toBe("youtube");
  });
});

describe("gradientIndex", () => {
  it("is deterministic and in range", () => {
    expect(gradientIndex("example.com")).toBe(gradientIndex("example.com"));
    for (const k of ["a.com", "b.com", "c.com"]) {
      const i = gradientIndex(k);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(8);
    }
  });
});

describe("imageDimensions", () => {
  it("reads png dimensions", () => {
    const png = new Uint8Array(26);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const dv = new DataView(png.buffer);
    dv.setUint32(16, 64);
    dv.setUint32(20, 32);
    expect(imageDimensions(png.buffer)).toEqual({ w: 64, h: 32 });
  });

  it("reads ico dimensions, treating 0 as 256", () => {
    const ico = new Uint8Array(24);
    ico.set([0, 0, 1, 0, 1, 0, 16, 16]);
    expect(imageDimensions(ico.buffer)).toEqual({ w: 16, h: 16 });
    ico[6] = 0;
    ico[7] = 0;
    expect(imageDimensions(ico.buffer)).toEqual({ w: 256, h: 256 });
  });

  it("returns null for unknown formats", () => {
    expect(imageDimensions(new Uint8Array(30).buffer)).toBeNull();
  });
});
