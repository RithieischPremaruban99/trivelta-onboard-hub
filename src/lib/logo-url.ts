/**
 * Returns a Logo.dev URL for a given provider URL.
 * Requires VITE_LOGO_DEV_TOKEN to be set — returns null (monogram fallback) if missing.
 * fallback=monogram renders a clean initial letter if the logo isn't indexed.
 */
export function getLogoUrl(url: string): string | null {
  try {
    const token = import.meta.env.VITE_LOGO_DEV_TOKEN;
    if (!token) {
      console.warn("[logo-url] VITE_LOGO_DEV_TOKEN not set — logos will not load");
      return null;
    }
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return `https://img.logo.dev/${hostname}?token=${token}&size=64&format=png&fallback=monogram`;
  } catch {
    return null;
  }
}
