/**
 * Returns a logo URL for a given provider URL.
 * - Custom overrides (CUSTOM_LOGOS) take precedence — used for providers
 *   not indexed by Logo.dev (e.g. Surt).
 * - Falls back to Logo.dev with a public client-safe token.
 * - fallback=monogram renders a clean initial letter if the logo isn't indexed.
 */

const LOGO_DEV_TOKEN = "pk_Z8EtuP3gQRqYlGYnfgPTZg";

const CUSTOM_LOGOS: Record<string, string> = {
  "surt.com": "/logos/surt.png",
};

export function getLogoUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");

    if (CUSTOM_LOGOS[hostname]) {
      return CUSTOM_LOGOS[hostname];
    }

    return `https://img.logo.dev/${hostname}?token=${LOGO_DEV_TOKEN}&size=64&format=png&fallback=monogram`;
  } catch {
    return null;
  }
}
