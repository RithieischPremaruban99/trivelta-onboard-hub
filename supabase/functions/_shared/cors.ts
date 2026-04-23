/**
 * Shared CORS helper for Supabase edge functions.
 *
 * Allowlist (evaluated per-request):
 *  - Hardcoded production domains (safe even when env vars are absent)
 *  - SITE_URL / APP_URL env vars (Supabase Dashboard → Settings → API)
 *  - Any *.lovable.app origin (Lovable preview + production deployments)
 *  - Any *.supabase.co / *.supabase.green origin (Studio + preview)
 *  - localhost:5173 / localhost:3000 for local dev
 *
 * If the incoming origin matches, we echo it back (required for
 * credentialled requests). If it doesn't match we return the primary
 * production origin rather than localhost so browser errors are obvious.
 */

const PRODUCTION_ORIGINS = [
  "https://trivelta-onboard-hub.lovable.app",
  "https://suite.trivelta.com",
];

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];

function buildAllowlist(): string[] {
  return [
    ...PRODUCTION_ORIGINS,
    ...DEV_ORIGINS,
    Deno.env.get("SITE_URL") ?? "",
    Deno.env.get("APP_URL") ?? "",
  ].filter(Boolean);
}

function isAllowed(origin: string): boolean {
  // Lovable preview/production URLs  (*.lovable.app)
  if (/^https:\/\/[^/]+\.lovable\.app$/.test(origin)) return true;
  // Supabase Studio / preview functions
  if (/^https?:\/\/[^/]+\.supabase\.(co|green)$/.test(origin)) return true;
  return buildAllowlist().includes(origin);
}

export function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("Origin") ?? req.headers.get("origin") ?? "";
  if (origin && isAllowed(origin)) return origin;
  // Fall back to primary production origin — never localhost in production
  return PRODUCTION_ORIGINS[0];
}

export function makeCorsHeaders(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
