/**
 * Prospect token helpers — no external dependencies.
 * Uses Web Crypto API (available in all modern browsers and Deno).
 */

/**
 * Generate a 32-character URL-safe random token.
 * Uses base64url encoding of 24 random bytes (24 bytes → 32 base64url chars exactly).
 */
export function generateProspectToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Build the full prospect magic-link URL from a token.
 */
export function buildProspectUrl(token: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/prospect/${token}`;
}
