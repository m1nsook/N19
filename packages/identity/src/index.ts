import { randomInt } from "node:crypto";

// Public handles use neutral words and random digits, never private account data.
// This is a candidate generator: persistence must enforce uniqueness atomically.
const adjectives = ["quiet", "silver", "bright", "gentle", "clear", "swift", "calm", "open", "soft", "wild", "steady", "lunar", "solar", "distant", "cool", "fresh"] as const;
const nouns = ["orbit", "river", "cloud", "forest", "ocean", "star", "stone", "leaf", "moon", "wave", "trail", "sky", "brook", "ridge", "spark", "dawn"] as const;

export const PUBLIC_HANDLE_PATTERN = /^[a-z]+-[a-z]+-[0-9]{6}$/;

export function generatePublicHandle(): string {
  const adjective = adjectives[randomInt(adjectives.length)];
  const noun = nouns[randomInt(nouns.length)];
  const suffix = randomInt(1_000_000).toString().padStart(6, "0");
  return `${adjective}-${noun}-${suffix}`;
}
