/**
 * Returns a Logo.dev URL for a given provider URL.
 * fallback=monogram renders a clean initial letter if the logo isn't indexed.
 */
export function getLogoUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return `https://img.logo.dev/${hostname}?size=64&format=png&fallback=monogram`;
  } catch {
    return null;
  }
}
