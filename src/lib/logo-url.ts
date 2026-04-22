/**
 * Returns a Logo.dev URL for a given provider URL.
 * fallback=monogram renders a clean initial letter if the logo isn't indexed.
 */
const LOGO_DEV_TOKEN = "pk_Z8EtuP3gQRqYlGYnfgPTZg";

export function getLogoUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return `https://img.logo.dev/${hostname}?size=64&format=png&fallback=monogram&token=${LOGO_DEV_TOKEN}`;
  } catch {
    return null;
  }
}
