import { describe, expect, it } from "vitest";
import { normalizeIdentity } from "./identity";

describe("normalizeIdentity", () => {
  it("normalises a bare domain", () => {
    expect(normalizeIdentity("example.com")).toEqual({
      identityKey: "example.com",
      displayUrl: "https://example.com",
      kind: "url",
    });
  });

  it("strips scheme, www, query, fragment, trailing slash, and case", () => {
    for (const input of [
      "https://WWW.Example.com/?ref=abc",
      "http://example.com/",
      "https://example.com#top",
      "  example.com/  ",
      "www.example.com?utm_source=x",
    ]) {
      expect(normalizeIdentity(input)?.identityKey).toBe("example.com");
    }
  });

  it("keeps paths but strips their trailing slash", () => {
    expect(normalizeIdentity("https://example.com/page/")?.identityKey).toBe(
      "example.com/page"
    );
  });

  it("normalises handles with an x: prefix", () => {
    expect(normalizeIdentity("@Jamil")).toEqual({
      identityKey: "x:jamil",
      displayUrl: "https://x.com/jamil",
      kind: "handle",
    });
    expect(normalizeIdentity("@@jamil")?.identityKey).toBe("x:jamil");
  });

  it("the same url and handle entered twice resolve to the same key", () => {
    expect(normalizeIdentity("https://WWW.Example.com/?ref=abc")?.identityKey).toBe(
      normalizeIdentity("example.com")?.identityKey
    );
    expect(normalizeIdentity("@jamil")?.identityKey).toBe(
      normalizeIdentity("  @JAMIL ")?.identityKey
    );
  });

  it("rejects dangerous and non-http schemes", () => {
    expect(normalizeIdentity("javascript:alert(1)")).toBeNull();
    expect(normalizeIdentity("data:text/html,hi")).toBeNull();
    expect(normalizeIdentity("ftp://example.com")).toBeNull();
    expect(normalizeIdentity("JAVASCRIPT:alert(1)")).toBeNull();
  });

  it("rejects garbage", () => {
    expect(normalizeIdentity("")).toBeNull();
    expect(normalizeIdentity("   ")).toBeNull();
    expect(normalizeIdentity("not a url")).toBeNull();
    expect(normalizeIdentity("localhost")).toBeNull();
    expect(normalizeIdentity("@")).toBeNull();
    expect(normalizeIdentity("@has spaces")).toBeNull();
  });
});
