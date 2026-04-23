/**
 * Shared CORS helper for Supabase edge functions.
 *
 * Instead of `"Access-Control-Allow-Origin": "*"`, we echo back the caller's
 * origin when it matches an allowed list. This prevents cross-origin credential
 * leakage from other sites.
 *
 * Allowed list (evaluated at function startup):
 *   - SITE_URL env var (set in Supabase Dashboard -> Settings -> API -> Site URL)
 *   - APP_URL env var  (optional secondary override)
 *   - localhost:5173 / localhost:3000 for local dev
 *   - Any *.supabase.co / *.supabase.green origin (Supabase Studio + preview)
 */

const configuredOrigins = [
  Deno.env.get("SITE_URL"),
  Deno.env.get("APP_URL"),
  "http://localhost:5173",
  "http://localhost:3000",
].filter((o): o is string => !!o);

function isAllowed(origin: string): boolean {
  if (origin.match(/^https?:\/\/[^/]+\.supabase\.(co|green)$/)) return true;
  return configuredOrigins.some((allowed) => origin === allowed);
}

export function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("Origin") ?? "";
  if (origin && isAllowed(origin)) return origin;
  // Fall back to the first configured origin (never bare "*")
  return configuredOrigins[0] ?? "";
}

export function makeCorsHeaders(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}
