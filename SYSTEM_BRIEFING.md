# Trivelta Onboard Hub — System Briefing

> Generated: 2026-04-23. Scope: read-only analysis. No files modified, no migrations run, no external APIs called.
> Prepared by: Claude Sonnet 4.6 (claude-sonnet-4-6).

---

## Table of Contents

1. [Part 1: Executive State](#part-1-executive-state)
2. [Part 2: Confirmed Architecture](#part-2-confirmed-architecture)
   - [2a. Auth Model](#2a-auth-model)
   - [2b. Authorization (RLS + Role Checks)](#2b-authorization-rls--role-checks)
   - [2c. Edge Function Inventory](#2c-edge-function-inventory)
   - [2d. Landing Page Generator Pipeline](#2d-landing-page-generator-pipeline)
   - [2e. Routing Decision Tree](#2e-routing-decision-tree)
3. [Part 3: Data Model Truth](#part-3-data-model-truth)
   - [3a. Final Schema State](#3a-final-schema-state)
   - [3b. The studio_features Problem](#3b-the-studio_features-problem)
   - [3c. Legacy vs New Flags](#3c-legacy-vs-new-flags)
4. [Part 4: External Dependencies](#part-4-external-dependencies)
   - [4a. Anthropic API](#4a-anthropic-api)
   - [4b. Notion Integration](#4b-notion-integration)
   - [4c. Other External Services](#4c-other-external-services)
5. [Part 5: Known Gaps and Risks](#part-5-known-gaps-and-risks)
6. [Part 6: Build Doc Claims vs Reality](#part-6-build-doc-claims-vs-reality)
7. [Part 7: Deployment Reality](#part-7-deployment-reality)
8. [Part 8: Open Questions for Reviewer](#part-8-open-questions-for-reviewer)
9. [Part 9: Methodology](#part-9-methodology)

---

## Part 1: Executive State

### Git state

```
# git log --oneline -1
6d3b64f82a1bdc66ff63765d9b7a112d404e95eb 2026-04-24 fix(pdf): defer URL.revokeObjectURL to prevent download failure (RithieischPremaruban99)

# git status --short
?? AUDIT_EXTRACT.md
```

**1. Deployable state?**
Yes. The only untracked file is `AUDIT_EXTRACT.md` (a read-only analysis artifact, not source code). The build completes cleanly (`npm run build` exits 0, outputs `dist/` with full SSR bundle in 3.83 s). TypeScript reports zero errors (`npx tsc --noEmit` exits 0 with no output). ESLint emits ~30 `prettier/prettier` formatting errors across 6 files (see Part 7) but none are blocking.

**2. Last commit?**
2026-04-24. Commit `6d3b64f` by RithieischPremaruban99: defers `URL.revokeObjectURL` after the `<a>` click in the ZIP download path to prevent the download failing before the browser can fetch the blob. Single-file change in `LandingPageGenerator.tsx`.

**3. Most dangerous thing?**

```tsx
// src/components/studio/LandingPageGenerator.tsx  lines 587-588
console.log("[landing-gen] Token length:", session?.access_token?.length ?? 0);
console.log("[landing-gen] Token first 50:", session?.access_token?.substring(0, 50));
```

A Supabase JWT prefix (50 chars of the bearer token) is logged to the browser console on every generate click. Any user with devtools open, any browser extension that exfiltrates console output, or any automated screenshot service captures a partial token. The prefix is sufficient for an attacker to narrow brute-force of the full token in some configurations. This was added as debug code and was never removed.

**4. Gap between build docs and reality (top 5)?**
The only markdown file in the repo is the previously-generated `AUDIT_EXTRACT.md`. There is no `README.md`, `BUILD.md`, `CHANGELOG.md`, or `docs/` directory. All five drift items are therefore missing documentation claims rather than contradicted claims:
1. **Setup instructions missing** — no README explaining environment variables required (ANTHROPIC_API_KEY, NOTION_TOKEN, IDEOGRAM_API_KEY, SUPABASE_*).
2. **Edge function deployment procedure undocumented** — no reference to `supabase functions deploy` or which functions require service-role secrets.
3. **Studio feature flag schema undocumented** — the `studio_features` JSONB default was added in two duplicate migrations (20260422230000 and 20260423114354) with no canonical reference.
4. **Prospect token security model undocumented** — the two `anon`-accessible SECURITY DEFINER RPCs (`get_prospect_by_token`, `update_prospect_by_token`) have no documentation explaining what they are intentionally permitting.
5. **The `generate-logo` and `generate-palette` functions are publicly callable** — no documentation acknowledges this design choice or mitigating controls.

**5. Most likely demo breakage in 24 hours?**
`generate-palette` and `generate-logo` have **zero authentication checks** (see Part 2c). The functions are reachable by any unauthenticated POST to `https://<project>.supabase.co/functions/v1/generate-palette`. If the AI Studio demo involves the color/logo generation flow, any third party who discovers the URL (e.g., via the browser network tab) can deplete `ANTHROPIC_API_KEY` and `IDEOGRAM_API_KEY` credits before or during the demo.

---

## Part 2: Confirmed Architecture

### 2a. Auth Model

**`prospect.$token.tsx` — token validation RPC**

```tsx
// src/routes/prospect.$token.tsx  lines 49-63
const { data, error } = await (supabase as any).rpc("get_prospect_by_token", {
  p_token: token,
});
const row = Array.isArray(data) ? data[0] : data;
if (error || !row) {
  setState("invalid");
  return;
}
if (new Date(row.token_expires_at as string) < new Date()) {
  setState("expired");
  return;
}
```

Token lookup is done via a SECURITY DEFINER RPC callable by `anon`. The expiry check is done in JavaScript on top of what the RPC already enforces in SQL. All subsequent writes also go through `update_prospect_by_token` (same pattern — SECURITY DEFINER, no Supabase auth session required).

**`onboarding.$clientId.auth.tsx` — OTP signIn call**

```tsx
// src/routes/onboarding.$clientId.auth.tsx  lines 77-84
const { error } = await supabase.auth.signInWithOtp({
  email: email.trim().toLowerCase(),
  options: {
    emailRedirectTo: `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/onboarding/${clientId}/form`,
  },
});
```

Any email can request an OTP. The OTP links to `/onboarding/${clientId}/form`. After sign-in the `useEffect` at line 35 checks whether the form is submitted and redirects to studio or success. Clients are scoped by `team_members` RLS, not by auth itself.

**`auth-context.tsx` — role fetch**

```tsx
// src/lib/auth-context.tsx  lines 48-53
const fetchRole = async (userId: string) => {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as AppRole);
  const best = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;
  setRole(best);
};
```

Role priority order: `admin > account_executive > account_manager > client`. Role is fetched from `user_roles` via RLS-restricted SELECT (user can only read own roles). Error from the Supabase call is not captured; a failed fetch silently sets `role = null`.

**`__root.tsx` — auth gate**

```tsx
// src/routes/__root.tsx  lines 95-102
function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
```

There is **no route-level auth gate** at the root. `AuthProvider` wraps the tree but enforces nothing. Individual routes must implement their own guards (most do via `useAuth()` / `useOnboardingCtx()` hooks).

**verify_jwt settings**

No `config.toml` files exist under `supabase/functions/`. Supabase defaults to `verify_jwt = true` when no config.toml is present. However, `generate-landing-pages`, `upload-landing-pages-to-drive`, `design-locked`, `convert-prospect-to-client`, and `invite-am` each implement an internal `auth.getUser()` check manually. `generate-logo`, `generate-palette`, `handle-submission`, and `prospect-submitted` do **not** implement any auth check.

**Publicly reachable endpoints (no auth required):**

| Endpoint | Mechanism |
|---|---|
| `GET /onboarding/:clientId/` | Welcome gate — calls `get_client_welcome_info` as `anon` |
| `POST /functions/v1/generate-logo` | No verify_jwt config, no internal auth check |
| `POST /functions/v1/generate-palette` | No verify_jwt config, no internal auth check |
| `POST /functions/v1/handle-submission` | No verify_jwt config, no internal auth check |
| `POST /functions/v1/prospect-submitted` | No verify_jwt config; internal token-match check only |
| RPC `get_prospect_by_token(text)` | GRANT TO anon — callable without session |
| RPC `update_prospect_by_token(text, jsonb)` | GRANT TO anon — callable without session |
| RPC `get_client_welcome_info(uuid)` | GRANT TO anon — callable without session |

---

### 2b. Authorization (RLS + Role Checks)

**Table | RLS Enabled | Who Reads | Who Writes**

| Table | RLS | Read | Write |
|---|---|---|---|
| `profiles` | YES | Any `authenticated` | Owner (`auth.uid() = user_id`) |
| `user_roles` | YES | Own row; `admin` reads all; `account_executive` reads all; `account_manager` reads all | `admin` only |
| `role_assignments` | YES | `admin`, `account_executive` | `admin`, `account_executive` |
| `clients` | YES | `admin`/`AE` all; `account_manager` assigned; `client_member` own | `admin`/`AE` all; `account_manager` assigned; staff for `studio_access_locked` |
| `onboarding_forms` | YES | `admin`/`AE` all; `account_manager` assigned; `team_member` own | `admin`/`AE` all; `account_manager` (multi) assigned; `team_member` own |
| `onboarding_tasks` | YES | `admin`/`AE` all; `account_manager` assigned; `client` primary_contact | `admin`/`AE` all; `account_manager` assigned; `client` CLIENT-owned tasks only |
| `onboarding_submissions` | YES | `admin`; `client_member` own | No direct client insert (enforced by policy `WITH CHECK (false)`) |
| `team_members` | YES | `admin`/`AE` all; `account_manager` assigned; `client_member` own row by email | `admin`/`AE`; `client_owner` |
| `client_memberships` | YES | `admin`/`AE`; `account_manager` assigned; own row | `admin`/`AE`; `client_owner` |
| `client_account_managers` | YES | `admin`/`AE` all; `account_manager` own assignments | `admin`/`AE` |
| `sop_task_template` | YES | Any `authenticated` | `admin`/`AE` |
| `form_submissions` | YES | `admin`/`AE` all; `account_manager` assigned; `team_member` own | `admin`/`AE` only |
| `prospects` | YES | `admin`/`AE`/`account_manager` staff; `anon` with valid unexpired token | Staff; `anon` with valid token UPDATE |
| `prospect_account_managers` | YES | `admin`/`AE` all; AM own rows | `admin`/`AE`; AM can insert |
| `client_activity_log` | YES | `admin`/`AE` all; `account_manager` own client/prospect | `admin`/`AE`/`account_manager` (policy); `log_client_activity` SECURITY DEFINER RPC preferred |
| `onboarding_submissions` (migration table) | YES | `admin`; `client_member` | No direct insert |
| Storage: `onboarding-media` | YES | Authenticated team member | Authenticated team member |
| Storage: `studio-assets` | YES | Authenticated only (CDN bypasses) | Authenticated |
| Storage: `landing-page-assets` | YES | `anon` public read; own folder authenticated; staff all | Authenticated (folder-scoped for clients) |

**Notable GRANT EXECUTE ON FUNCTION … TO anon:**
- `get_client_welcome_info(uuid)` — TO anon, authenticated (migrations 20260418195324, 20260419000001, 20260419084756)
- `get_prospect_by_token(text)` — TO anon, authenticated (migration 20260423155435)
- `update_prospect_by_token(text, jsonb)` — TO anon, authenticated (migration 20260423155435)

**Key submission enforcement chain:**
`submit_onboarding_form()` SECURITY DEFINER RPC checks `is_client_owner()` before writing `submitted_at`. Belt-and-suspenders: `enforce_owner_submit_trigger` fires BEFORE UPDATE on `onboarding_forms` and blocks non-owner writes to `submitted_at`.

---

### 2c. Edge Function Inventory

| Function | verify_jwt config | Internal auth check | External APIs | Tables read | Tables written | ~LOC |
|---|---|---|---|---|---|---|
| `generate-landing-pages` | none (defaults true) | YES — `callerClient.auth.getUser()` | Anthropic (4 parallel calls) | none | none | 335 |
| `generate-logo` | none (defaults true) | **NO** | Anthropic (1 call), Ideogram (3 parallel) | none | none | 298 |
| `generate-palette` | none (defaults true) | **NO** | Anthropic (streaming, 1 call) | none | none | 930 |
| `handle-submission` | none (defaults true) | **NO** | Notion API | `role_assignments`, `client_account_managers` | none (Notion only) | 358 |
| `prospect-submitted` | none (defaults true) | Token match only (no Supabase auth) | Notion API | `prospects` | `prospects` (notion_page_id) | 471 |
| `design-locked` | none (defaults true) | YES — `callerClient.auth.getUser()` + `can_lock_design()` | Notion API | `onboarding_forms`, `clients`, `role_assignments`, `client_account_managers` | `clients` (notion_page_id, studio_locked_at) | 763 |
| `convert-prospect-to-client` | none (defaults true) | YES — `callerClient.auth.getUser()` + role check | Notion API | `prospects`, `clients`, `client_account_managers`, `prospect_account_managers` | `prospects`, `clients`, `client_account_managers`, `team_members` | 296 |
| `invite-am` | none (defaults true) | YES — `callerClient.auth.getUser()` + admin/AE role check | Supabase Auth admin API | `user_roles` | `user_roles`, `role_assignments` | 103 |
| `upload-landing-pages-to-drive` | none (defaults true) | YES — `callerClient.auth.getUser()` | Google Drive API (OAuth2) | `clients` | none | 273 |

**Functions with no auth check (`generate-logo`, `generate-palette`, `handle-submission`):**

`generate-logo` and `generate-palette` accept arbitrary POST requests from the internet. An attacker can enumerate these via any Supabase project discovery (the anon key is embedded in the client bundle). They can then send unlimited requests that consume `ANTHROPIC_API_KEY` and `IDEOGRAM_API_KEY` credits with no rate limiting, no IP blocking, and no attribution. The only cost barrier is Anthropic/Ideogram rate limits. `handle-submission` accepts arbitrary Notion-write requests — an attacker can create arbitrary Notion pages in the client tracker database (NOTION_DB_ID `31aac...`) by POSTing a valid-looking payload with any `client_name`; no Supabase auth session is required.

---

### 2d. Landing Page Generator Pipeline

#### Step 1: User fills form → state shape built

```tsx
// src/components/studio/LandingPageGenerator.tsx  lines 62-74 (LandingPageFormState)
interface LandingPageFormState {
  legalCompanyName: string; brandName: string; primaryDomain: string;
  platformSubdomain: string; supportEmail: string; supportHelpline: string;
  licenseJurisdiction: string; licenseNumber: string; rgHelplines: string;
  brandPrimaryColor: string; brandAccentColor: string;
}
// logoUrl is separate state (string | null)
```

Required fields: `legalCompanyName`, `brandName`, `primaryDomain`, `supportEmail`, `licenseJurisdiction`, `brandPrimaryColor`, plus `logoUrl`. Jurisdiction selection auto-populates `rgHelplines` from a hardcoded `RG_HELPLINES` constant.

#### Step 2: `handleGenerate()` → payload construction

```tsx
// src/components/studio/LandingPageGenerator.tsx  lines 582-609
const { data: { session } } = await supabase.auth.getSession();
// DEBUG LINES (security risk):
console.log("[landing-gen] Token first 50:", session?.access_token?.substring(0, 50));

const { data, error } = await supabase.functions.invoke("generate-landing-pages", {
  body: {
    legalCompanyName: form.legalCompanyName, brandName: form.brandName,
    primaryDomain: form.primaryDomain, platformSubdomain: form.platformSubdomain || undefined,
    supportEmail: form.supportEmail, licenseJurisdiction: form.licenseJurisdiction,
    licenseNumber: form.licenseNumber || undefined, rgHelplines: form.rgHelplines || undefined,
    brandPrimaryColor: form.brandPrimaryColor, brandAccentColor: form.brandAccentColor || undefined,
    brandLogoUrl: logoUrl!,
  },
});
```

Invoked via `supabase.functions.invoke` which automatically attaches the user's JWT as `Authorization` header.

#### Step 3: Edge function receives → validation

```ts
// supabase/functions/generate-landing-pages/index.ts  lines 222-235
const authHeader = req.headers.get("Authorization") ?? "";
const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY,
  { global: { headers: { Authorization: authHeader } } });
const { data: { user }, error: authError } = await callerClient.auth.getUser();
if (authError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, ... });
}
```

Auth check only: authenticated user required. No role check, no check that the user is associated with the client whose data is being generated. Any authenticated user (including a `client` role from any other client) can call this endpoint with arbitrary brand details.

#### Step 4: Claude API calls → model, count, prompts

**Model:** `claude-haiku-4-5-20251001`
**Parallel calls:** 4 (`Promise.all`)
**Timeout:** 60 seconds shared `AbortController` across all 4 calls.

**System prompt (all 4 calls share the same system prompt):**
```
// supabase/functions/generate-landing-pages/index.ts  line 151
"You MUST return ONLY valid JSON. No markdown fences. No preamble. No explanations. Start your response with { and end with }."
```

**User prompt 1 — landing (max_tokens: 1500):**
```
Generate brand-specific landing content for this iGaming operator:
Brand: ${input.brandName}
Jurisdiction: ${input.licenseJurisdiction}
Return ONLY this JSON: { "tagline": "...", "description": "...", "country_short": "..." }
```

**User prompt 2 — terms (max_tokens: 4000):**
```
Generate Terms & Conditions HTML body for this iGaming operator:
Brand: ${input.brandName}, Legal entity: ${input.legalCompanyName},
Jurisdiction: ${input.licenseJurisdiction}, License number: ${input.licenseNumber ?? "not yet assigned"},
Domain: ${input.primaryDomain}
Return ONLY this JSON: { "terms_content": "<h2>1. Introduction</h2>..." ~1200 words T&C }
```

**User prompt 3 — privacy (max_tokens: 2500):**
```
Generate Privacy Policy HTML body for this iGaming operator:
Brand: ${input.brandName}, Legal entity: ${input.legalCompanyName},
Jurisdiction: ${input.licenseJurisdiction}, Support email: ${input.supportEmail}
Return ONLY this JSON: { "privacy_content": "..." ~700 words privacy policy }
```

**User prompt 4 — rg (max_tokens: 2500):**
```
Generate Responsible Gambling content for this iGaming operator:
Brand: ${input.brandName}, Jurisdiction: ${input.licenseJurisdiction},
RG helplines override: ${input.rgHelplines ?? "(use jurisdiction defaults)"}
Return ONLY this JSON: { "rg_content": "...", "rg_helplines_html": "..." }
```

#### Step 5: Response handling → failure modes

```ts
// supabase/functions/generate-landing-pages/index.ts  lines 250-281
const [landingRaw, termsRaw, privacyRaw, rgRaw] = await Promise.all([
  callAnthropic(...).catch((e) => { throw new Error(`landing call failed: ${e.message}`); }),
  callAnthropic(...).catch((e) => { throw new Error(`terms call failed: ${e.message}`); }),
  callAnthropic(...).catch((e) => { throw new Error(`privacy call failed: ${e.message}`); }),
  callAnthropic(...).catch((e) => { throw new Error(`rg call failed: ${e.message}`); }),
]);
```

If any single call fails, `Promise.all` rejects and the entire generation fails. Partial results are discarded. `AbortError` returns HTTP 504; other errors return HTTP 500 with the raw error message.

#### Step 6: Template substitution → where templates live

Templates are imported from `./templates.ts` in the same function directory:
```ts
// supabase/functions/generate-landing-pages/index.ts  lines 16-21
import { INDEX_TEMPLATE, TERMS_TEMPLATE, PRIVACY_TEMPLATE, RG_TEMPLATE } from "./templates.ts";
```

Substitution is a simple split-join replacement, not a regex:
```ts
// supabase/functions/generate-landing-pages/index.ts  lines 82-88
function render(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}
```

Placeholders follow `{{KEY}}` convention. AI-generated HTML content is injected unescaped into the template — no XSS sanitization. Variables substituted: `BRAND_NAME`, `LEGAL_COMPANY`, `LOGO_URL`, `PRIMARY_COLOR`, `PRIMARY_LIGHT`, `PRIMARY_BG_TINT`, `PRIMARY_BORDER_TINT`, `PRIMARY_BORDER_STRONG`, `DOMAIN`, `PLATFORM_URL`, `SUPPORT_EMAIL`, `COUNTRY`, `JURISDICTION_FULL`, `TAGLINE`, `DESCRIPTION`, `TERMS_CONTENT`, `PRIVACY_CONTENT`, `RG_CONTENT`, `RG_HELPLINES_HTML`.

#### Step 7: Response to client → shape

```ts
// supabase/functions/generate-landing-pages/index.ts  lines 318-327
const pages = {
  index: render(INDEX_TEMPLATE, vars),
  terms: render(TERMS_TEMPLATE, vars),
  privacy: render(PRIVACY_TEMPLATE, vars),
  rg: render(RG_TEMPLATE, vars),
};
return new Response(JSON.stringify({ pages }), {
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});
```

Shape: `{ pages: { index: string, terms: string, privacy: string, rg: string } }`.

#### Step 8: Client renders preview

```tsx
// src/components/studio/LandingPageGenerator.tsx  lines 903-912
<iframe
  srcDoc={page}
  className={cn("w-full rounded-lg border-0 bg-white", iframeHeight)}
  sandbox="allow-same-origin"
  title={`${label} preview`}
/>
```

`srcDoc` with `sandbox="allow-same-origin"`. Scripts in generated HTML are blocked. No `allow-scripts` in sandbox — JavaScript in generated pages will not execute in preview.

#### Step 9: JSZip download logic

```tsx
// src/components/studio/LandingPageGenerator.tsx  lines 631-662
const zip = new JSZip();
zip.file("index.html", pages.index);
zip.file("terms.html", pages.terms);
zip.file("privacy.html", pages.privacy);
zip.file("responsible-gambling.html", pages.rg);
zip.file("README.md", `# ${form.brandName} Landing Pages\n\n...`);

const blob = await zip.generateAsync({ type: "blob" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `${form.brandName.toLowerCase().replace(/\s+/g, "-")}-landing-pages-${
  new Date().toISOString().split("T")[0]
}.zip`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);   // deferred after click per last commit fix
```

#### Step 10: Drive upload confirmation → DB write

Drive upload is manual (user drags ZIP to Google Drive). Confirmation button writes:

```tsx
// src/components/studio/LandingPageGenerator.tsx  lines 1488-1491
await (supabase as any)
  .from("clients")
  .update({ landing_pages_submitted_at: new Date().toISOString() })
  .eq("id", clientId);
```

No `.select()` — no error surfaced to the user if the update fails (only a `console.warn`). Activity log RPC is called separately, also fire-and-forget. On next login, `landing_pages_submitted_at` is checked to skip the generator and show the success screen.

**Complete failure mode catalogue:**

| Failure | Behaviour |
|---|---|
| Any one of 4 Claude calls fails | Entire generation fails, error toast |
| AbortController fires at 60 s | HTTP 504, "AI generation timed out" toast |
| `logoUrl` null at submit | Client-side validation blocks — canGenerate = false |
| `brandLogoUrl` is an invalid/expired URL | Claude ignores it; generated HTML has broken `<img>` |
| `session` is null at generate time | Throws "session expired" error before calling edge fn |
| Edge fn auth fails | HTTP 401 "Unauthorized" — shown as error alert |
| JSON parse fails on any Claude response | HTTP 500 with raw error message |
| DB update for `landing_pages_submitted_at` fails | Silent — `console.warn` only; no toast |
| Drive link not configured | Alert shown: "Drive folder not configured" |

---

### 2e. Routing Decision Tree

**Key decision blocks:**

```tsx
// src/routes/onboarding.$clientId.index.tsx  lines 43-77 (WelcomeGate auto-redirect)
if (formRes.data?.submitted_at) {
  const sf = clientRes.data?.studio_features as Record<string, boolean> | null;
  if (sf?.landing_page_generator) {
    navigate({ to: "/onboarding/$clientId/studio", ... });
  } else if (clientRes.data?.studio_access) {
    navigate({ to: "/onboarding/$clientId/studio-unlocked", ... });
  } else {
    navigate({ to: "/onboarding/$clientId/success", ... });
  }
} else {
  // check localStorage "client-welcome-seen-{clientId}"
  navigate({ to: "/onboarding/$clientId/welcome" or "/form" });
}
```

```tsx
// src/routes/onboarding.$clientId.studio.tsx  lines 1625-1642 (setReady block)
const landingPagesCompleted = Boolean(clientRes.data?.landing_pages_submitted_at);
const otherEnabled = enabledFeatureCount > 1;
if (
  studioFeatures.landing_page_generator &&
  (enabledFeatureCount === 1 || !landingPagesCompleted) &&
  !(landingPagesCompleted && otherEnabled)
) {
  setIsLandingPageOnlyMode(true);
}
```

```tsx
// src/routes/onboarding.$clientId.success.tsx  lines 75-77 (hasLandingPageCTA)
const sf = clientRes.data?.studio_features as Record<string, boolean> | null;
if (sf?.landing_page_generator) setHasLandingPageCTA(true);
```

**ASCII Decision Tree — from magic link click to final destination:**

```
User lands on /onboarding/:clientId/
  │
  ├─[NOT authenticated]──────────────────────────────────────────────────────┐
  │   Shows WelcomeGate (AM card + "Begin Onboarding" button)               │
  │   → Click → /onboarding/:clientId/auth                                  │
  │       → User enters email → OTP sent                                    │
  │       → User clicks magic link → signed in                              │
  │       → auth.tsx useEffect fires (post-sign-in redirect):               │
  │           formRes.submitted_at?                                          │
  │             YES:                                                         │
  │               sf?.landing_page_generator?                                │
  │                 YES → /onboarding/:clientId/studio ────────────────────►│
  │                 NO:                                                      │
  │                   studio_access?                                         │
  │                     YES → /onboarding/:clientId/studio-unlocked ───────►│
  │                     NO  → /onboarding/:clientId/success ───────────────►│
  │             NO → /onboarding/:clientId/form                             │
  │                                                                         │
  ├─[Authenticated, re-visit]─────────────────────────────────────────────┐ │
  │   WelcomeGate useEffect fires immediately:                            │ │
  │   formRes.submitted_at?                                               │ │
  │     YES: sf?.landing_page_generator? → studio                        │ │
  │          studio_access? → studio-unlocked                            │ │
  │          else → success                                              │ │
  │     NO: localStorage "client-welcome-seen-{clientId}"?               │ │
  │           seen → /form                                               │ │
  │           not seen → /welcome → sets flag → /form                   │ │
  └───────────────────────────────────────────────────────────────────────┘ │
                                                                             │
/onboarding/:clientId/form ◄──────────────────────────────────────────────┐ │
  │ form useEffect (lines 264-317):                                       │ │
  │   formRes.submitted_at?                                               │ │
  │     YES: hasStudio = studio_access || studio_features.landing_page_generator
  │           hasStudio → /studio                                         │ │
  │           else    → /success                                          │ │
  │     NO: seenWelcome flag check → /welcome or show form                │ │
  │ Realtime sync active while form visible                               │ │
  │ Submit → submit_onboarding_form() RPC (owner only)                    │ │
  │   → handle-submission edge fn → Notion page created                   │ │
  │   → navigate:                                                         │ │
  │       studioAccessRef = studio_access || landing_page_generator        │ │
  │         YES → /studio                                                  │ │
  │         NO  → /success                                                 │ │
  └───────────────────────────────────────────────────────────────────────┘ │
                                                                             │
/onboarding/:clientId/studio ◄───────────────────────────────────────────────┘
  │ useEffect (lines 1520-1646):
  │   formRes.submitted_at?  NO → redirect to /form
  │   studio_access_locked?  YES → show "Studio Temporarily Unavailable"
  │   hasAccess = studio_access; hasFeatureAccess = (enabledFeatures > 0)
  │   !hasAccess && !hasFeatureAccess && !isAdminOrAM → redirect to /success
  │   enabledFeatureCount === 0 → redirect to /success
  │   isLandingPageOnlyMode?
  │     YES (only landing_page_generator, pages not submitted)
  │         → renders LandingPageGenerator (fullpage layout)
  │           → generates pages → downloads ZIP → confirms upload
  │           → sets landing_pages_submitted_at
  │             → otherFeaturesEnabled? YES → show "Explore Studio" button
  │                                    NO  → show sign-out
  │     NO  → renders full Studio (AI chat, color editor, logo, etc.)
  │
  └─ Admin/AE/AM role → bypasses all client gates; sees full Studio

/onboarding/:clientId/success
  │ useEffect: formRes.submitted_at? NO → /form
  │   sf?.landing_page_generator?
  │     YES → renders Step 2 layout with LandingPageGenerator (embedded)
  │     NO  → renders standard success / PDF download

/onboarding/:clientId/studio-unlocked
  │ studio_access === true, landing_page_generator === false
  │ Shows "Studio is being set up" intermediate page
```

---

## Part 3: Data Model Truth

### 3a. Final Schema State

**`public.profiles`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() |
| user_id | UUID | NOT NULL | — (FK → auth.users.id ON DELETE CASCADE) |
| email | TEXT | NOT NULL | — |
| name | TEXT | NULL | — |
| created_at | TIMESTAMPTZ | NOT NULL | now() |
| updated_at | TIMESTAMPTZ | NOT NULL | now() |

**`public.user_roles`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | UUID | NOT NULL | gen_random_uuid() |
| user_id | UUID | NOT NULL | — (FK → auth.users.id ON DELETE CASCADE) |
| role | app_role ENUM | NOT NULL | — |

UNIQUE (user_id, role).

**`public.role_assignments`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| email | TEXT | NOT NULL (PK) | — |
| role | app_role ENUM | NOT NULL | — |
| name | TEXT | NULL | — |
| notion_user_id | TEXT | NULL | — |

**`public.clients`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | UUID | NOT NULL PK | gen_random_uuid() |
| name | TEXT | NOT NULL | — |
| country | TEXT | NULL | — |
| platform_url | TEXT | NULL | — |
| drive_link | TEXT | NULL | — |
| status | client_status ENUM | NOT NULL | 'onboarding' |
| assigned_am_id | UUID | NULL | — (FK → auth.users ON DELETE SET NULL) — legacy |
| primary_contact_email | TEXT | NULL | — |
| created_at | TIMESTAMPTZ | NOT NULL | now() |
| updated_at | TIMESTAMPTZ | NOT NULL | now() |
| created_by | UUID | NULL | set by trigger from auth.uid() |
| notion_page_id | TEXT | NULL | — |
| studio_locked_at | TIMESTAMPTZ | NULL | — |
| studio_access_locked | BOOLEAN | NOT NULL | false |
| studio_access | BOOLEAN | NOT NULL | false |
| studio_access_granted_at | TIMESTAMPTZ | NULL | — |
| studio_access_granted_by | UUID | NULL | — (FK → auth.users) |
| platform_live | BOOLEAN | NOT NULL | false |
| studio_features | JSONB | NULL | `{"landing_page_generator":true,"ai_chat":false,...}` |
| landing_pages_submitted_at | TIMESTAMPTZ | NULL | — |

Note: `studio_access` added as `DEFAULT false` (nullable) in 20260420000002, then added again as `NOT NULL DEFAULT false` in 20260420123553 — the latter migration uses `ADD COLUMN IF NOT EXISTS` so the second runs as a no-op if the column already exists. Final state: `NOT NULL DEFAULT false`.

**`public.onboarding_forms`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | UUID | NOT NULL PK | gen_random_uuid() |
| client_id | UUID | NOT NULL | — (FK → clients ON DELETE CASCADE) |
| data | JSONB | NOT NULL | '{}' |
| submitted_at | TIMESTAMPTZ | NULL | — |
| created_at | TIMESTAMPTZ | NOT NULL | now() |
| updated_at | TIMESTAMPTZ | NOT NULL | now() |
| studio_config | JSONB | NULL | '{}' (added twice: 20260419000004 as nullable, 20260419154811 as NOT NULL DEFAULT '{}') |
| studio_locked | BOOLEAN | NOT NULL | false |
| studio_locked_at | TIMESTAMPTZ | NULL | — |
| notion_sync_pending | BOOLEAN | NOT NULL | false |

UNIQUE (client_id). REPLICA IDENTITY FULL. Realtime enabled.

**`public.onboarding_tasks`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | UUID | NOT NULL PK | gen_random_uuid() |
| client_id | UUID | NOT NULL | — (FK → clients ON DELETE CASCADE) |
| phase | INT | NOT NULL | — |
| task | TEXT | NOT NULL | — |
| owner | TEXT | NOT NULL | — ('INTERNAL' or 'CLIENT') |
| sort_order | INT | NOT NULL | 0 |
| completed | BOOLEAN | NOT NULL | false |
| completed_at | TIMESTAMPTZ | NULL | — |
| created_at | TIMESTAMPTZ | NOT NULL | now() |

**`public.team_members`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | UUID | NOT NULL PK | gen_random_uuid() |
| client_id | UUID | NOT NULL | — (FK → clients ON DELETE CASCADE) |
| email | TEXT | NOT NULL | — |
| name | TEXT | NULL | — |
| created_at | TIMESTAMPTZ | NOT NULL | now() |
| client_role | client_member_role ENUM | NOT NULL | 'client_member' |

UNIQUE (client_id, email) — added in 20260419000002 / 20260419090717 (both present, second is no-op).

**`public.client_memberships`** (legacy — superseded by team_members)

Created in 20260418184023, never explicitly dropped. Has `client_role` as `client_role` ENUM. Largely superseded by `team_members` and `client_account_managers`.

**`public.client_account_managers`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | UUID | NOT NULL PK | gen_random_uuid() |
| client_id | UUID | NOT NULL | — (FK → clients ON DELETE CASCADE) |
| am_user_id | UUID | NULL | — |
| am_email | TEXT | NULL | — |
| created_at | TIMESTAMPTZ | NOT NULL | now() |

Constraint: `cam_user_or_email CHECK (am_user_id IS NOT NULL OR am_email IS NOT NULL)`.

**`public.prospects`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | UUID | NOT NULL PK | gen_random_uuid() |
| legal_company_name | TEXT | NOT NULL | — |
| primary_contact_email | TEXT | NOT NULL | — |
| primary_contact_name | TEXT | NULL | — |
| primary_contact_phone | TEXT | NULL | — |
| access_token | TEXT | NULL (was NOT NULL, dropped in 20260422000007/20260422124543) | — |
| token_expires_at | TIMESTAMPTZ | NOT NULL | now() + interval '30 days' |
| company_details | JSONB | NULL | '{}' |
| payment_providers | JSONB | NULL | '{}' |
| kyc_compliance | JSONB | NULL | '{}' |
| marketing_stack | JSONB | NULL | '{}' |
| technical_requirements | JSONB | NULL | '{}' |
| optional_features | JSONB | NULL | '{}' |
| contract_status | TEXT | NULL | 'in_discussion' |
| form_progress | INT | NULL | 0 |
| created_by | UUID | NOT NULL | — (FK → auth.users) |
| assigned_account_manager | TEXT | NULL | — |
| converted_to_client_id | UUID | NULL | — (FK → clients) |
| converted_at | TIMESTAMPTZ | NULL | — |
| notion_page_id | TEXT | NULL | — |
| created_at | TIMESTAMPTZ | NULL | now() |
| updated_at | TIMESTAMPTZ | NULL | now() |
| last_accessed_at | TIMESTAMPTZ | NULL | — |
| submitted_at | TIMESTAMPTZ | NULL | — |
| update_requested_at | TIMESTAMPTZ | NULL | — |
| update_request_reason | TEXT | NULL | — |

Note: The `prospects` table was created in TWO separate migrations (20260422000001 and 20260422093104) — both use `CREATE TABLE` (not `IF NOT EXISTS`). The second would fail at runtime if applied sequentially to a clean DB. The second migration (20260422093104) appears to be a Lovable-generated duplicate of the first. Supabase applies migrations sequentially so one would error; it is possible only one was applied to production.

**`public.prospect_account_managers`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | UUID | NOT NULL PK | gen_random_uuid() |
| prospect_id | UUID | NOT NULL | — (FK → prospects ON DELETE CASCADE) |
| am_email | TEXT | NOT NULL | — |
| assigned_at | TIMESTAMPTZ | NULL | now() |

UNIQUE (prospect_id, am_email). Created twice (20260422000006 and 20260422122410) — same `IF NOT EXISTS` safety issue.

**`public.client_activity_log`**

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | UUID | NOT NULL PK | gen_random_uuid() |
| client_id | UUID | NULL | — |
| prospect_id | UUID | NULL | — |
| actor_user_id | UUID | NULL | — |
| actor_email | TEXT | NULL | — |
| actor_role | TEXT | NULL | — |
| action | TEXT | NOT NULL | — |
| details | JSONB | NOT NULL | '{}' |
| created_at | TIMESTAMPTZ | NOT NULL | now() |

Created in two migrations (20260422000003 and 20260422120312); same duplication risk.

**Storage buckets (final state):**
- `onboarding-media` — public, 10 MB limit, PNG/JPEG/WEBP/JSON
- `studio-assets` — public CDN; storage RLS restricts listing to authenticated
- `landing-page-assets` — public CDN; anon can read; uploads scoped to `auth.uid()` folder

---

### 3b. The `studio_features` Problem

**All occurrences in `src/`:**

```tsx
// src/integrations/supabase/types.ts  line 104
studio_features: Json | null
// Type at this point: Json | null (aliased any, no keys)
```

```tsx
// src/routes/onboarding.$clientId.index.tsx  lines 56-57
const sf = clientRes.data?.studio_features as Record<string, boolean> | null;
if (sf?.landing_page_generator) { ... }
// Could silently return false/undefined if key is absent or DB returns NULL
```

```tsx
// src/routes/onboarding.$clientId.auth.tsx  lines 52-56
const sf = clientRes.data?.studio_features as Record<string, boolean> | null;
if (sf?.landing_page_generator) { ... }
else if (clientRes.data?.studio_access) { ... }
```

```tsx
// src/routes/onboarding.$clientId.form.tsx  lines 283-285
const hasStudio = clientRes.data?.studio_access ?? false;
const hasLandingPageGen = (clientRes.data?.studio_features as Record<string, boolean> | null)?.landing_page_generator === true;
const routeToStudio = hasStudio || hasLandingPageGen;
```

```tsx
// src/routes/onboarding.$clientId.studio.tsx  lines 1595-1601
const studioFeatures: StudioFeatures = {
  ...DEFAULT_STUDIO_FEATURES,
  ...((clientRes.data as { studio_features?: Partial<StudioFeatures> })
    ?.studio_features ?? {}),
};
// If studio_features is null, spread of null is a no-op — safe here
// If studio_features has unexpected keys, they pass through silently
```

```tsx
// src/routes/onboarding.$clientId.success.tsx  lines 75-76
const sf = clientRes.data?.studio_features as Record<string, boolean> | null;
if (sf?.landing_page_generator) setHasLandingPageCTA(true);
```

```tsx
// src/components/studio/LandingPageGenerator.tsx  line 436
const { features: studioFeatures } = useStudioFeatures(clientId);
// useStudioFeatures returns DEFAULT_STUDIO_FEATURES on fetch failure - safe
```

```tsx
// src/routes/admin.tsx  lines 107, 717
studio_features: StudioFeatures | null;
currentFeatures: c.studio_features ?? DEFAULT_STUDIO_FEATURES,
// Only place with proper null coalescing to DEFAULT_STUDIO_FEATURES
```

**Places that could silently return `undefined/false`:**
- `onboarding.$clientId.index.tsx:57` — if `studio_features` is a JSONB that arrived as `null` from the DB, `sf?.landing_page_generator` is `undefined`, falsy — client is silently sent to `studio-unlocked` or `success` even if they should see the generator.
- `onboarding.$clientId.auth.tsx:53` — same pattern.
- `onboarding.$clientId.success.tsx:76` — `sf?.landing_page_generator` falsy → `hasLandingPageCTA` stays false → client does not see the Step 2 CTA.

The migration default is `landing_page_generator: true` for all new clients, but for clients created before the migration (or if `studio_features` is ever explicitly set to `null`), these checks silently fail.

**Proposed TypeScript interface (NOT implementing):**

```ts
// Proposed — do not implement
interface StudioFeatures {
  landing_page_generator: boolean;
  ai_chat: boolean;
  color_editor: boolean;
  animation_tools: boolean;
  logo_editor: boolean;
  asset_library: boolean;
}
// Every access should go through a type-guarded getter that returns DEFAULT_STUDIO_FEATURES
// when the column is null, rather than casting to Record<string, boolean> | null at each callsite.
function parseStudioFeatures(raw: unknown): StudioFeatures {
  if (!raw || typeof raw !== 'object') return DEFAULT_STUDIO_FEATURES;
  return { ...DEFAULT_STUDIO_FEATURES, ...(raw as Partial<StudioFeatures>) };
}
```

---

### 3c. Legacy vs New Flags

**Occurrences categorised by check pattern:**

**BOTH `studio_access` AND `landing_page_generator` checked (correct post-Bug-6-fix pattern):**

| File | Lines | Pattern |
|---|---|---|
| `onboarding.$clientId.index.tsx` | 51,56,60 | Checks `sf?.landing_page_generator` first, then `studio_access` fallback |
| `onboarding.$clientId.auth.tsx` | 47,52,56 | Same two-check pattern |
| `onboarding.$clientId.studio.tsx` | 1530,1583,1607 | Reads both; `hasAccess = studio_access`; `hasFeatureAccess = enabledFeatures > 0` |

**ONLY `studio_access` checked (pre-fix / Bug 6 risk):**

| File | Lines | Context |
|---|---|---|
| `onboarding.$clientId.form.tsx` | 283,505,509 | `hasStudio = clientRes.data?.studio_access ?? false` used at line 285 to set `routeToStudio`; `hasLandingPageGen` checked separately at 284, ORed together — CORRECT on closer read |
| `onboarding.$clientId.form.tsx` | 505-509 | `studioAccess` state is polled on save, set from `studio_access` only — landing_page_generator is NOT checked here; if `studio_access = false` and `landing_page_generator = true`, the Studio button in the form sidebar (`studio_access` prop at line 784) will not show |
| `onboarding.$clientId.studio-unlocked.tsx` | 53,61 | Checks only `studio_access`; `landing_page_generator` never read — this route is only shown when `studio_access = true` and `landing_page_generator = false`, which is correct by routing logic |
| `dashboard.tsx` | 521,562,601 | Dashboard cards use only `studio_access` — `studio_features` never read in dashboard |

**ONLY `landing_page_generator` checked:**

| File | Lines | Context |
|---|---|---|
| `onboarding.$clientId.success.tsx` | 75-76 | Only reads `landing_page_generator` to decide whether to show LPG CTA |
| `hooks/useStudioFeatures.ts` | 31-35 | Reads all `studio_features` keys; does not look at `studio_access` |

**Summary of residual Bug 6 risk:**
The `studioAccess` state in `onboarding.$clientId.form.tsx` (lines 505-509) is derived from `studio_access` only — not `landing_page_generator`. This means the Studio banner/button in the **form** sidebar will NOT appear for a client who has `landing_page_generator = true` but `studio_access = false`, unless they are routing through the redirect path (which correctly ORs the two flags). The form's sidebar button is therefore one place where the bug may still manifest visually even though routing is correct.

---

## Part 4: External Dependencies

### 4a. Anthropic API

**Used in:** `generate-landing-pages`, `generate-logo`, `generate-palette`

**`generate-landing-pages`:**
- Model: `claude-haiku-4-5-20251001` (line 59)
- Parallel calls: 4 (one for each page type)
- max_tokens: landing=1500, terms=4000, privacy=2500, rg=2500
- Timeout: 60 seconds (shared AbortController)
- Error handling: each `.catch()` wraps to a labeled error; any failure rejects the whole `Promise.all`

System prompt (verbatim):
```
You MUST return ONLY valid JSON. No markdown fences. No preamble. No explanations. Start your response with { and end with }.
```

**`generate-logo`:**
- Model: `claude-haiku-4-5-20251001` (constant `ANTHROPIC_MODEL`)
- Calls: 1 (brand intent extraction before 3 Ideogram calls)
- max_tokens: 512 (inferred — not shown in excerpt)
- No AbortController/timeout on Anthropic call

**`generate-palette`:**
- Model: selectable at runtime from body (`claude-sonnet-4-5` or similar based on `isRefine` flag); uses `@anthropic-ai/sdk` streaming via Server-Sent Events
- Calls: 1 streaming call; retry call possible on JSON parse failure
- No AbortController/timeout

---

### 4b. Notion Integration

**Functions using Notion:** `handle-submission`, `prospect-submitted`, `design-locked`, `convert-prospect-to-client`

**All target the same database:** `NOTION_DB_ID = "31aac1484e348067977dda1128916077"`

**`handle-submission` — Notion call (full):**

```ts
// supabase/functions/handle-submission/index.ts  lines 329-337
const res = await fetch(NOTION_API, {
  method: "POST",
  headers: notionHeaders,
  body: JSON.stringify({
    parent: { database_id: NOTION_DB_ID },
    properties,
    children,
  }),
});
```

Triggered by: frontend calling `supabase.functions.invoke("handle-submission", {...})` after `submit_onboarding_form()` succeeds. No Supabase auth on the edge function — any POST with a valid-looking payload body creates a Notion page. Creates one Notion page per submission with properties (Client Name, Status, Primary Contact, Contact Email, Website, Country, Drive, PSPs, Account Manager) and SOP todo blocks for Phases 1–6.

**`prospect-submitted` — triggered when prospect submits their form:**
Validates token in-function (does not use Supabase RLS). Looks up or creates a Notion page for the prospect, then appends a "Pre-Onboarding" block section with all filled fields.

**`design-locked` — triggered when client locks Studio config:**
Reads `studio_config` from `onboarding_forms`, builds palette/language/app-name blocks, appends to existing Notion page (or creates one if none exists). Updates `clients.studio_locked_at` and `clients.notion_page_id`.

All Notion calls are raw `fetch()` — no timeout, no AbortController.

---

### 4c. Other External Services

| Service | Function / File | Line(s) | Purpose |
|---|---|---|---|
| Ideogram API (`api.ideogram.ai`) | `generate-logo/index.ts` | 182 | Logo image generation — 3 parallel calls |
| Google Drive (OAuth2 + Drive API v3) | `upload-landing-pages-to-drive/index.ts` | 95,117,156 | Exchange service account token; upload ZIP file to client's Drive folder |
| Supabase Auth Admin API | `invite-am/index.ts` | 64 | `inviteUserByEmail` — sends magic link to AM |
| Notion API | `handle-submission`, `prospect-submitted`, `design-locked`, `convert-prospect-to-client` | various | CRM page creation/update |
| Anthropic API | `generate-landing-pages`, `generate-logo`, `generate-palette` | various | Content/design generation |

No Resend, SendGrid, Stripe, or Twilio integration found anywhere in the codebase.

---

## Part 5: Known Gaps and Risks

| # | Severity | Category | File:line | What's wrong | Impact |
|---|---|---|---|---|---|
| 1 | HIGH | Information Disclosure | `src/components/studio/LandingPageGenerator.tsx:588` | `console.log("[landing-gen] Token first 50:", session?.access_token?.substring(0, 50))` — first 50 characters of the JWT printed to browser console on every generate click | Browser devtools, browser extensions, or session recording tools can capture the token prefix. Although 50 chars is not the full token, it reveals the JWT structure and could assist targeted attacks. Left from a debugging session. |
| 2 | CRITICAL | No Auth on Edge Functions | `supabase/functions/generate-logo/index.ts:210`, `supabase/functions/generate-palette/index.ts:679` | Neither `generate-logo` nor `generate-palette` have `verify_jwt` config.toml AND have no internal `auth.getUser()` check. | Any unauthenticated HTTP POST can call these endpoints, consuming `ANTHROPIC_API_KEY` and `IDEOGRAM_API_KEY` without attribution or rate limiting. `handle-submission` (line 222) has the same issue: unauthenticated callers can create arbitrary Notion pages in the production database. |
| 3 | MEDIUM | Anon RLS grants | Multiple migrations | `GRANT EXECUTE ON FUNCTION get_client_welcome_info(uuid) TO anon` — any anonymous caller can enumerate client names and AM contact details for any `client_id` UUID | Welcome gate is intentionally public (marketing UX requirement) but it leaks AM email addresses and client names to anyone who can enumerate UUIDs. |
| 3b | LOW | Anon RLS grants | `migration 20260422133231` | "Anon can read prospects with valid token" and "Anon can update prospects with valid token" were added but NOT dropped by the security audit migration (which only dropped the "Public can read/update" policies). The later `20260423155435` migration also does not drop these. These anon direct-table policies may coexist with the SECURITY DEFINER RPCs. | Anon can still SELECT/UPDATE prospects where token is non-null and not expired — bypassing the RPC's `update_requested_at` lock logic. |
| 4 | MEDIUM | `as any` casts in routing | `src/routes/onboarding.$clientId.studio.tsx:1528`, `src/routes/onboarding.$clientId.success.tsx:59`, `src/routes/prospect.$token.tsx:49,67,120,168` | `(supabase as any).rpc(...)` and `(supabase as any).from(...)` bypass generated type checking for tables/columns not yet in `types.ts` | Typos in column names fail silently at runtime; query results are untyped. |
| 5 | LOW | Swallowed errors | Multiple | 16 `} catch {` blocks with no body in src/ (see grep results in Part 9). Key examples: `onboarding.$clientId.studio.tsx:86,93,100` (localStorage reads), `studio.tsx:651,736,756,1832` (palette/config saves). `prospect.$token.tsx:80` (localStorage — intentional). | Silent failures in studio save paths mean data loss (unsaved palette/config) shows no error to the user. |
| 6 | MEDIUM | fetch() calls without timeout | `supabase/functions/handle-submission/index.ts:329`, `prospect-submitted/index.ts:243-332`, `design-locked/index.ts:444-569` | Multiple `fetch()` calls to Notion API with no AbortController, no timeout. Supabase edge functions have a default 60s wall-clock limit but individual fetch calls can hang for up to that limit. | If Notion API is slow/down, the edge function hangs for ~60s before the platform kills it. No retry logic; the caller gets a timeout error with no information about partial completion. |
| 7 | LOW | `studio_features` null-unsafe access | `src/routes/onboarding.$clientId.index.tsx:56`, `onboarding.$clientId.auth.tsx:52`, `onboarding.$clientId.success.tsx:75` | `clientRes.data?.studio_features as Record<string, boolean> | null` — if JSONB is `null` (pre-backfill clients or explicitly nulled), `sf?.landing_page_generator` evaluates to `undefined` (falsy) rather than the intended default `true` | Client is routed to `success` or `studio-unlocked` instead of the LPG studio. Backfill in the migration sets `null` rows to the default JSON, but RLS or permission errors during the Supabase query could also result in `data` being `null`. |
| 8 | LOW | Nullable column dereferencing without check | `src/components/studio/LandingPageGenerator.tsx:457-465` | `clientData?.landing_pages_submitted_at` and `clientData?.primary_contact_email` accessed with `?.` — safe. But `(supabase as any).from("clients").update({landing_pages_submitted_at:...})` at line 1489 has no `.error` check and only a `console.warn` on catch | DB update failure for `landing_pages_submitted_at` is invisible to the user; client is shown the success screen but the DB record is not updated; they will be shown the generator again on next login. |
| 9 | LOW | Supabase queries with no error handling | `src/components/studio/LandingPageGenerator.tsx:485-491` | `supabase.from("clients").select("drive_link").eq("id", clientId).single().then(({ data }) => setDriveLink(data?.drive_link ?? null))` — `.error` is destructured away; if the query fails, `driveLink` stays `null` silently → the "Open Trivelta Drive Folder" button is replaced by an alert | Low impact on functionality but creates confusing UX if Drive link exists but query fails. |

---

## Part 6: Build Doc Claims vs Reality

The only markdown file in the repository root is `AUDIT_EXTRACT.md` (the previous audit report, not build documentation). There are no `README.md`, `BUILD.md`, `CHANGELOG.md`, or `docs/` files at any level of the project tree (excluding `node_modules`).

**Claims that cannot be verified (no docs to compare against):**
- Environment variables required for deployment — MISSING documentation
- Supabase project setup instructions — MISSING
- Edge function deploy commands — MISSING
- Node version / runtime requirements — MISSING (`package.json` has no `engines` field)
- Migration apply order / production DB state — MISSING

**From `AUDIT_EXTRACT.md` (the only .md file found):**
The existing `AUDIT_EXTRACT.md` documents build tooling (`@lovable.dev/vite-tanstack-config`), key dependencies, and migration state as of 2026-04-23. This briefing supersedes it. Notable claimed items from that document:

- Build tooling: `lovable-tsr build` wrapping Vite + TanStack Start — CONFIRMED (build succeeds)
- Router: TanStack Router with file-based routing — CONFIRMED
- No `.nvmrc` or `engines` field — CONFIRMED
- `jszip` for ZIP generation — CONFIRMED
- `@react-pdf/renderer` for PDF generation — CONFIRMED

---

## Part 7: Deployment Reality

**CI/CD pipeline:**

No `.github/` workflows, no `.gitlab-ci.yml`, no `.lovable` config files found (only `node_modules/.github/` from dependencies).

The project uses `@lovable.dev/vite-tanstack-config` as the build wrapper. Deployment appears to be handled by the Lovable platform (lovable.dev) with no custom CI pipeline. There is no Vercel, Netlify, or Fly.io config present.

**`npx tsc --noEmit 2>&1 | head -40`:**
```
(no output — exit code 0)
```

**`npm run lint 2>&1 | head -40`:**
```
> lint
> eslint .

/Users/plateau-trivelta/trivelta-onboard-hub/src/components/AppShell.tsx
  29:32  error  Replace `⏎············role·===·"account_manager"·||⏎···········` with `·role·===·"account_manager"·||`  prettier/prettier
  74:21  error  Replace `⏎··········product="Suite"...`  prettier/prettier

/Users/plateau-trivelta/trivelta-onboard-hub/src/components/admin/StudioFeatureAccessDialog.tsx
   91:79  error  Delete `⏎···········`  prettier/prettier
  131:18  error  Replace `...`  prettier/prettier

/Users/plateau-trivelta/trivelta-onboard-hub/src/components/form/FieldInfo.tsx
    6:9   error  Replace `⏎··Tooltip,·...`  prettier/prettier
   12:9   error  Replace `⏎··Sheet,·...`  prettier/prettier
   24:23  error  Replace `...`  prettier/prettier
   55:24  error  Replace `...`  prettier/prettier
   90:87  error  Replace `{f.title}` ...  prettier/prettier
   91:85  error  Replace `{f.description}` ...  prettier/prettier
  123:1   error  Delete `⏎`  prettier/prettier
  134:53  error  Replace `...`  prettier/prettier

/Users/plateau-trivelta/trivelta-onboard-hub/src/components/onboarding/OnboardingLoadingScreen.tsx
  11:1   error  Delete `⏎`  prettier/prettier
  26:15  error  Delete `⏎`  prettier/prettier

/Users/plateau-trivelta/trivelta-onboard-hub/src/components/prospect/ProspectField.tsx
   95:91  error  Insert `·with·your`  prettier/prettier
   96:14  error  Delete `·with·your`  prettier/prettier
  ...

/Users/plateau-trivelta/trivelta-onboard-hub/src/components/prospect/ProspectFormContent.tsx
   51:17  warning  Fast refresh only works when a file only exports components.  react-refresh/only-export-components
  129:1   error  Delete `⏎`  prettier/prettier
  223:1   error  Delete `⏎`  prettier/prettier
  303:16  error  Replace `...`  prettier/prettier
```

All errors are `prettier/prettier` formatting (whitespace/newline). Zero semantic ESLint errors. One `react-refresh/only-export-components` warning in `ProspectFormContent.tsx`. Exit code non-zero (errors present).

**`npm run build 2>&1 | tail -20`:**
```
dist/server/assets/prospect._token-CKdS1T-o.js                           8.34 kB
dist/server/assets/checkbox-BTHCJrvW.js                                  9.05 kB
dist/server/assets/onboarding._clientId.studio-unlocked-dHCBtvi6.js      9.09 kB
dist/server/assets/login-hiGkxyNB.js                                    10.29 kB
dist/server/assets/onboarding._clientId.studio-intro-CztBa7wW.js        10.30 kB
dist/server/assets/onboarding._clientId.studio-locked-DSwCfBth.js       10.32 kB
dist/server/assets/onboarding._clientId.index-BAvnAUGf.js               11.65 kB
dist/server/assets/studio-preview._clientId-BjZ7YA33.js                 17.11 kB
dist/server/assets/onboarding._clientId.studio-preview-CLVrdiMX.js      18.68 kB
dist/server/assets/onboarding._clientId.success-BSMESvx4.js             23.43 kB
dist/server/assets/FieldInfo-DV-OfES_.js                                23.76 kB
dist/server/assets/ProspectFormContent-BmPW5Z5P.js                      32.42 kB
dist/server/assets/dashboard-CrqRZEPY.js                                44.44 kB
dist/server/assets/onboarding._clientId.studio-DYUxz8x7.js              65.32 kB
dist/server/assets/onboarding._clientId.form-CaOh7sBr.js                86.84 kB
dist/server/assets/admin-CDgE1rSz.js                                   131.40 kB
dist/server/assets/worker-entry-CtDGFBD1.js                            733.03 kB
dist/server/assets/router-C27exygg.js                                2,636.28 kB
dist/server/assets/pdf-builder-uy25H9dj.js                           3,654.14 kB
✓ built in 3.83s
```

Build succeeds. `pdf-builder` chunk is 3.65 MB (uncompressed) — likely `@react-pdf/renderer` bundled in full.

---

## Part 8: Open Questions for Reviewer

1. **`prospects` table created twice** — migrations `20260422000001_add_prospects.sql` and `20260422093104_67590f1b...sql` both contain `CREATE TABLE prospects` without `IF NOT EXISTS`. How was this applied to production? Which is the canonical migration? The second migration includes `SUPABASE_URL` reference format (`public.clients`) suggesting it may be the Lovable-generated re-creation. If both were applied, the second would have errored — was there a manual cleanup?

2. **`generate-logo` and `generate-palette` have no auth** — is this intentional? These are called from within the authenticated Studio route, but there is no server-side enforcement. Was this a deliberate trade-off for performance (avoiding an extra auth round-trip for the streaming palette endpoint) or an oversight?

3. **`handle-submission` has no auth** — the edge function is called from the authenticated form submission flow, but any POST to the endpoint creates a Notion page. Is the exposure considered acceptable because NOTION_TOKEN is the only secret required (not a Supabase secret)?

4. **`anon` prospect policies vs SECURITY DEFINER RPCs** — migration `20260422133231` added `"Anon can read prospects with valid token"` (direct table access). The subsequent security audit replaced `"Public can..."` policies but the "Anon can..." policies from 20260422133231 appear to have never been explicitly dropped. Are these policies still live in production? If so, anon callers can bypass the RPC's form-lock logic.

5. **`studio_features` column NULL state for pre-migration clients** — the migration backfills `WHERE studio_features IS NULL`, but if a client was created between the first and second (duplicate) `studio_features` migration (20260422230000 vs 20260423114354), could they have `studio_features = NULL`? The `useStudioFeatures` hook handles `null` correctly (returns `DEFAULT_STUDIO_FEATURES`), but the three route-level callsites cast to `Record<string, boolean> | null` directly.

6. **`invite-am` `role_assignments.upsert` uses `onConflict: "user_id"`** — `role_assignments` has PK on `email`, not `user_id`. The `user_id` column was added to `role_assignments` in migration `20260419000010` but the original schema has no `user_id` column. This upsert would error if the `user_id` column is absent. Is `role_assignments.user_id` definitely present in production?

7. **`landing-page-assets` bucket** created in two migrations (`20260423120000` and `20260423135516`) with different (but non-conflicting) policies — the second uses `ON CONFLICT DO UPDATE SET public = true`. Both migrations add overlapping policies (different names: "Clients can upload own landing page assets" vs "Users can upload landing page assets"). Were both applied? If so, there are duplicate policies on the same table with different names for the same operation.

8. **`generate-palette` model selection** — the function accepts a `model` parameter in the request body and uses it directly for the Anthropic call. There is no allowlist of permitted models. Any caller (authenticated or not — the function has no auth) could specify any model string including expensive ones like `claude-opus-4-5`.

9. **`studio_access_locked` update policy** — the policy "Staff can update studio_access_locked" allows admin/AM/AE to UPDATE the entire `clients` row (not just the `studio_access_locked` column). This means an AM can update any `clients` column for their assigned client, including `primary_contact_email`, `drive_link`, and `studio_access`. Is the column-level restriction intended?

10. **`client_memberships` table** — created in migration `20260418184023_client_roles.sql` and never dropped. The app exclusively uses `team_members` for client role lookups (all helpers use `is_client_team_member`, `is_client_owner`). `client_memberships` data may be stale or inconsistent with `team_members`. Is it safe to treat this table as deprecated dead data?

---

## Part 9: Methodology

### Files read (full paths)

- `/Users/plateau-trivelta/trivelta-onboard-hub/src/routes/prospect.$token.tsx`
- `/Users/plateau-trivelta/trivelta-onboard-hub/src/routes/onboarding.$clientId.auth.tsx`
- `/Users/plateau-trivelta/trivelta-onboard-hub/src/lib/auth-context.tsx`
- `/Users/plateau-trivelta/trivelta-onboard-hub/src/routes/__root.tsx`
- `/Users/plateau-trivelta/trivelta-onboard-hub/src/routes/onboarding.$clientId.index.tsx`
- `/Users/plateau-trivelta/trivelta-onboard-hub/src/routes/onboarding.$clientId.success.tsx` (partial)
- `/Users/plateau-trivelta/trivelta-onboard-hub/src/routes/onboarding.$clientId.form.tsx` (partial, lines 264–317)
- `/Users/plateau-trivelta/trivelta-onboard-hub/src/routes/onboarding.$clientId.studio.tsx` (partial, lines 1520–1650)
- `/Users/plateau-trivelta/trivelta-onboard-hub/src/components/studio/LandingPageGenerator.tsx`
- `/Users/plateau-trivelta/trivelta-onboard-hub/src/hooks/useStudioFeatures.ts`
- `/Users/plateau-trivelta/trivelta-onboard-hub/AUDIT_EXTRACT.md` (partial)
- `/Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/generate-landing-pages/index.ts`
- `/Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/handle-submission/index.ts`
- `/Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/prospect-submitted/index.ts`
- `/Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/design-locked/index.ts` (partial, lines 1–80 + auth section)
- `/Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/generate-logo/index.ts` (partial)
- `/Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/generate-palette/index.ts` (partial, lines 679–930)
- `/Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/invite-am/index.ts`
- `/Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/upload-landing-pages-to-drive/index.ts` (partial, lines 170–220)
- `/Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/convert-prospect-to-client/index.ts` (partial, lines 85–124)
- All 60 migration files under `/Users/plateau-trivelta/trivelta-onboard-hub/supabase/migrations/`

### Shell commands run (exact)

```bash
git -C /Users/plateau-trivelta/trivelta-onboard-hub log --oneline -1 --format="%H %ad %s (%an)" --date=short
git -C /Users/plateau-trivelta/trivelta-onboard-hub status --short
ls /Users/plateau-trivelta/trivelta-onboard-hub/supabase/migrations/
ls /Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/
find /Users/plateau-trivelta/trivelta-onboard-hub -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"
find /Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions -name "config.toml"
for dir in .../supabase/functions/*/; do fname=$(basename "$dir"); cat "$dir/config.toml"; done
for dir in .../supabase/functions/*/; do wc -l "$dir/index.ts"; done
for f in [migration files]; do cat "$f"; done  # run in multiple batches covering all 60 migrations
grep -rn "studio_features" /Users/plateau-trivelta/trivelta-onboard-hub/src/ --include="*.tsx" --include="*.ts"
grep -rn "landing_page_generator" /Users/plateau-trivelta/trivelta-onboard-hub/src/ --include="*.tsx" --include="*.ts"
grep -rn "landing_page_generator" /Users/plateau-trivelta/trivelta-onboard-hub/supabase/ --include="*.sql" --include="*.ts"
grep -rn "studio_access" /Users/plateau-trivelta/trivelta-onboard-hub/src/ --include="*.tsx" --include="*.ts"
grep -rn "studio_access" /Users/plateau-trivelta/trivelta-onboard-hub/supabase/ --include="*.sql" --include="*.ts"
grep -rn "console\.log" /Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/ --include="*.ts"
grep -rn "console\.log" /Users/plateau-trivelta/trivelta-onboard-hub/src/ --include="*.tsx" --include="*.ts" | grep -i "token|jwt|session|auth"
grep -rn "} catch {" /Users/plateau-trivelta/trivelta-onboard-hub/src/ --include="*.tsx" --include="*.ts"
grep -rn "catch (e)" /Users/plateau-trivelta/trivelta-onboard-hub/src/ --include="*.tsx" --include="*.ts"
grep -rn "catch (err)" /Users/plateau-trivelta/trivelta-onboard-hub/src/ --include="*.tsx" --include="*.ts"
grep -rn "GRANT.*anon|anon.*GRANT" /Users/plateau-trivelta/trivelta-onboard-hub/supabase/migrations/ --include="*.sql"
grep -rn "fetch(" /Users/plateau-trivelta/trivelta-onboard-hub/supabase/functions/ --include="*.ts"
grep -rn "resend|stripe|twilio|google|drive|gmail" [...] -i
grep -n "verify_jwt|auth.getUser|Authorization|anon" [per-function]
grep -n "AbortController|AbortSignal|timeout|setTimeout" [per-function]
grep -rn "as any" /Users/plateau-trivelta/trivelta-onboard-hub/src/routes/ --include="*.tsx"
find /Users/plateau-trivelta/trivelta-onboard-hub -name "*.yml" -path "*/.github/*"
find /Users/plateau-trivelta/trivelta-onboard-hub -name ".lovable*"
npx tsc --noEmit 2>&1 | head -40
npm run lint 2>&1 | head -40
npm run build 2>&1 | tail -20
```

### Files attempted but not found / partially skipped

- All `supabase/functions/*/config.toml` — none exist; Supabase defaults apply
- `supabase/functions/generate-landing-pages/templates.ts` — referenced by index.ts; not read (contents are the HTML templates, not needed for behavioral analysis)
- `supabase/functions/_shared/tcm-palette.ts`, `tcm-strings.ts`, `cors.ts` — shared helpers; not read directly (behavior inferred from callers)
- `src/routes/onboarding.$clientId.studio.tsx` lines 1–1519 — only lines 1520–1650 read for the `setReady` block; the full 1800+ line file was not read in full
- `src/integrations/supabase/types.ts` — only searched via grep; not read in full
- `src/lib/studio-features.ts` — not read (DEFAULT_STUDIO_FEATURES inferred from migration default JSON)
- `.github/` directory — does not exist at project root (only in `node_modules/`)

### Anything skipped and why

- `node_modules/` — excluded from all searches as standard
- `dist/` — build output, not source
- Full contents of `generate-palette/index.ts` lines 1–678 (the prompt building and Anthropic streaming setup) — the behavioral summary was derived from the visible lines 679–930 and the auth grep; the full prompt was not quoted verbatim as it is ~400 lines of TCMPalette field iteration
- `src/routes/admin.tsx` full file — only searched via grep; the admin route manages studio_features via `StudioFeatureAccessDialog` (confirmed from grep), not required for the core security analysis
