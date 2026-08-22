/**
 * Basic slur and profanity filter for title and description. Not meant to
 * be clever — meant to stop the obvious stuff landing on a public board.
 * Anything that slips through gets blanked by hand (see README, "wiping
 * a row").
 */
const BLOCKED = [
  "nigger", "nigga", "faggot", "fag", "kike", "spic", "chink", "wetback",
  "tranny", "retard", "raghead", "coon",
  "cunt", "cock", "dick", "pussy", "whore", "slut", "rape", "rapist",
  "hitler", "nazi",
  "porn", "onlyfans", "escort", "viagra", "cialis",
];

const boundary = (word: string) => new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, "i");
const patterns = BLOCKED.map(boundary);

export function containsBlockedTerm(text: string): boolean {
  const flat = text.toLowerCase().replace(/[\s._\-*]+/g, " ");
  const squeezed = flat.replace(/\s+/g, "");
  return patterns.some((p) => p.test(flat) || p.test(squeezed));
}
