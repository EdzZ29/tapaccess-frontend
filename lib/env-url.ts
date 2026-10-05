/**
 * Tolerant URL setting: "cards.example.com/" → "https://cards.example.com".
 * Falls back when the value is missing or still not a valid URL, so a small
 * typo in an environment variable can't crash every page.
 */
export function envUrl(value: string | undefined, fallback: string): string {
  const v = value?.trim().replace(/\/+$/, "");
  if (!v) return fallback;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return fallback;
  }
}
