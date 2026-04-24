# Trivelta Onboard Hub — Codebase Audit Extract

Generated: 2026-04-23  
Scope: Read-only extraction. No files modified, no migrations run, no APIs called.  
All secrets redacted.

---

## Section 1: Repository Overview & Dependency Manifest

### `package.json` (selected fields)

```json
// package.json
{
  "name": "trivelta-onboard-hub",
  "private": true,
  "scripts": {
    "dev": "lovable-tsr dev",
    "build": "lovable-tsr build",
    "serve": "lovable-tsr serve",
    "lint": "eslint ."
  },
  "dependencies": {
    "@lovable.dev/vite-tanstack-config": "*",
    "@tanstack/react-router": "^1.x",
    "@tanstack/react-start": "^1.x",
    "@supabase/supabase-js": "^2",
    "react": "^19",
    "react-dom": "^19",
    "@react-pdf/renderer": "*",
    "jszip": "*",
    "lottie-react": "*",
    "zod": "*",
    "react-hook-form": "*",
    "@hookform/resolvers": "*",
    "sonner": "*",
    "@radix-ui/react-*": "*",
    "tailwindcss": "^4"
  }
}
```

**Key observations:**
- Build tooling: `@lovable.dev/vite-tanstack-config` wraps Vite + TanStack Start. `vite.config.ts` is a one-liner: `export default defineConfig();`.
- Router: TanStack Router with file-based routing under `src/routes/`.
- No `.nvmrc` or `engines` field detected.
- PDF generation: `@react-pdf/renderer`.
- ZIP generation for landing-page downloads: `jszip`.
- Animation rendering: `lottie-react`.
- UI: Radix UI primitives, Tailwind CSS v4, `sonner` toasts.

---

## Section 2: Environment Variables

### `.env.example` (variable names only; values are placeholders)

```
SUPABASE_PUBLISHABLE_KEY=[REDACTED]
SUPABASE_URL=[REDACTED]
VITE_SUPABASE_PROJECT_ID=[REDACTED]
VITE_SUPABASE_PUBLISHABLE_KEY=[REDACTED]
VITE_SUPABASE_URL=[REDACTED]
VITE_LOGO_DEV_TOKEN=[REDACTED]
```

### Frontend (`import.meta.env.*`) — found in `src/`

| Variable | Used in |
|---|---|
| `VITE_SUPABASE_URL` | `src/routes/onboarding.$clientId.studio.tsx`, `src/integrations/supabase/client.ts` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same files as above |
| `import.meta.env.DEV` | Dev-mode guard (e.g., debug logging) |

### Edge Functions (`Deno.env.get(...)`) — found in `supabase/functions/`

| Secret | Used by |
|---|---|
| `ANTHROPIC_API_KEY` | `generate-landing-pages`, `generate-logo` |
| `IDEOGRAM_API_KEY` | `generate-logo` |
| `NOTION_TOKEN` | `handle-submission`, `design-locked`, `prospect-submitted`, `convert-prospect-to-client` |
| `SUPABASE_URL` | All edge functions (service client) |
| `SUPABASE_SERVICE_ROLE_KEY` | All edge functions that write privileged data |
| `SUPABASE_ANON_KEY` | Some edge functions |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | `upload-landing-pages-to-drive` (UNUSED) |
| `APP_URL` / `SITE_URL` | Invite/magic-link generation |

---

## Section 3: Database Schema

### Tables (from `src/integrations/supabase/types.ts`)

#### `clients`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `status` | `client_status` enum | `onboarding \| active \| churned` |
| `country` | text? | |
| `platform_url` | text? | |
| `drive_link` | text? | Google Drive folder |
| `notion_page_id` | text? | |
| `primary_contact_email` | text? | |
| `assigned_am_id` | uuid? | Legacy single-AM field (deprecated in favour of `client_account_managers` junction) |
| `studio_access` | boolean | Whether client has Studio access |
| `studio_access_locked` | boolean | AM locks Studio while implementing |
| `studio_access_granted_at` | timestamptz? | |
| `studio_access_granted_by` | text? | |
| `studio_features` | jsonb? | Feature flags per client (migration `20260422230000`) |
| `studio_locked_at` | timestamptz? | Denormalised from `onboarding_forms` |
| `platform_live` | boolean | Added `20260421000001` |
| `landing_pages_submitted_at` | timestamptz? | Added `20260424081749` |
| `created_by` | uuid? | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `onboarding_forms`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `client_id` | uuid FK → clients (isOneToOne: true) | |
| `data` | jsonb | Form field values (FormShape) |
| `studio_config` | jsonb | StudioSavedConfig blob (palette, icons, labels, language, etc.) |
| `studio_locked` | boolean | |
| `studio_locked_at` | timestamptz? | |
| `notion_sync_pending` | boolean | Retry flag if design-locked Notion call failed |
| `submitted_at` | timestamptz? | Set on onboarding form submission |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `team_members`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `client_id` | uuid FK → clients | |
| `email` | text | |
| `name` | text? | |
| `client_role` | `client_member_role` enum | `client_owner \| client_member` |
| `created_at` | timestamptz | |

#### `client_account_managers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `client_id` | uuid FK → clients | |
| `am_email` | text? | Primary lookup key (pre-auth support) |
| `am_user_id` | uuid? | Populated after AM signs in |
| `created_at` | timestamptz | |

#### `prospects`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `legal_company_name` | text | |
| `primary_contact_email` | text | |
| `primary_contact_name` | text? | |
| `primary_contact_phone` | text? | |
| `access_token` | text? | Magic link token (nullified on conversion) |
| `token_expires_at` | timestamptz | |
| `form_progress` | int? | |
| `company_details` | jsonb? | |
| `payment_providers` | jsonb? | |
| `kyc_compliance` | jsonb? | |
| `marketing_stack` | jsonb? | |
| `technical_requirements` | jsonb? | |
| `optional_features` | jsonb? | |
| `submitted_at` | timestamptz? | |
| `update_requested_at` | timestamptz? | |
| `update_request_reason` | text? | |
| `last_accessed_at` | timestamptz? | |
| `notion_page_id` | text? | |
| `contract_status` | text? | |
| `converted_at` | timestamptz? | |
| `converted_to_client_id` | uuid? FK → clients | |
| `assigned_account_manager` | text? | Legacy single-AM field |
| `created_by` | text | |
| `created_at` | timestamptz? | |
| `updated_at` | timestamptz? | |

#### `prospect_account_managers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `prospect_id` | uuid FK → prospects | |
| `am_email` | text | |
| `assigned_at` | timestamptz? | |

#### `role_assignments`
| Column | Type | Notes |
|---|---|---|
| `email` | text PK | |
| `role` | `app_role` enum | |
| `name` | text? | |
| `notion_user_id` | text? | Added `20260419000010` |

#### `user_roles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `role` | `app_role` enum | |

#### `onboarding_tasks`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `client_id` | uuid FK → clients | |
| `task` | text | |
| `phase` | int | 1–6 matching SOP phases |
| `owner` | text | |
| `completed` | boolean | |
| `completed_at` | timestamptz? | |
| `sort_order` | int | |

#### Other tables
- `profiles` — user profile (email, name, user_id). Used for display; auth is via `auth.users`.
- `sop_task_template` — master SOP task definitions (phase, task, owner, sort_order).
- `form_submissions` — snapshot archive of submitted onboarding form data.
- `client_activity_log` — audit trail (action, actor_email, actor_role, actor_user_id, details jsonb).

### Enums

```sql
app_role: "admin" | "account_manager" | "account_executive" | "client"
client_member_role: "client_owner" | "client_member"
client_status: "onboarding" | "active" | "churned"
```

### Storage Buckets

| Bucket | Public | Purpose |
|---|---|---|
| `onboarding-media` | false | Logo/icon/animation uploads during onboarding form |
| `studio-assets` | false | Lottie animations uploaded in Studio |
| `landing-page-assets` | true | Logos uploaded in Landing Page Generator; embedded by generated HTML |

---

## Section 4: Database Functions & RLS

### SECURITY DEFINER RPCs

```sql
-- get_prospect_by_token(p_token text) → SETOF prospects
-- Returns one row matching access_token AND token_expires_at > now().
-- Granted to: anon, authenticated

-- update_prospect_by_token(p_token text, p_fields jsonb) → void
-- Column-level allowlist enforced. Form data locked when submitted AND no update_requested_at.
-- RAISES invalid_token / form_locked. Granted to: anon, authenticated

-- can_lock_design(p_user_id uuid, p_client_id uuid) → boolean
-- Returns true for admin/AE (any client) or AM assigned to p_client_id.
-- Granted to: authenticated

-- log_client_activity(p_client_id, p_action, p_details, p_prospect_id) → void
-- Derives actor identity from auth.uid() server-side — callers cannot forge it.
-- Granted to: authenticated

-- get_client_welcome_info(_client_id uuid) → TABLE(...)
-- Returns {client_name, am_name, am_email, am_title, progress_pct}.
-- Joins client_account_managers → role_assignments by email (does not require AM to have auth.users row).

-- is_client_owner(_client_id uuid) → boolean
-- Checks team_members table for client_role = 'client_owner'.

-- is_am_for_client(_client_id uuid) → boolean
-- SECURITY DEFINER helper to avoid RLS recursion in client_account_managers policies.

-- is_assigned_am(_client_id uuid) → boolean
-- Checks both am_user_id = auth.uid() AND am_email = current_user_email().

-- is_client_team_member(_client_id uuid) → boolean
-- Checks team_members.

-- client_has_studio_feature(p_client_id uuid, p_feature text) → boolean
-- Reads studio_features jsonb column.

-- current_user_email() → text
-- Returns auth.users.email for auth.uid().

-- register_onboarding_visitor(_client_id uuid) → void
-- Called at form load; tracks first-visit timing.

-- has_role(_role app_role, _user_id uuid) → boolean
-- Reads user_roles table.
```

### Key RLS Patterns

- `clients`: Staff (admin/AE/AM) see all. Clients see only rows where `is_client_team_member()`.
- `onboarding_forms`: Same as clients; client_owner can INSERT/UPDATE when form not yet submitted.
- `team_members`: Clients see their own client's members; staff see all.
- `client_account_managers`: Uses `is_am_for_client()` helper to avoid infinite recursion.
- `prospects`: Direct-table RLS policies removed in `20260422220000`. Access is exclusively via `get_prospect_by_token` / `update_prospect_by_token` SECURITY DEFINER RPCs.
- `client_activity_log`: Staff-only INSERT (with `log_client_activity` RPC for identity guarantees).

---

## Section 5: Edge Functions

### `supabase/config.toml` — JWT Verification

| Function | `verify_jwt` |
|---|---|
| `notify-submission` | true |
| `generate-palette` | true |
| `generate-logo` | true |
| `design-locked` | true |
| `prospect-submitted` | **false** |
| `convert-prospect-to-client` | true |
| `invite-am` | true |
| `generate-landing-pages` | **false** |
| `upload-landing-pages-to-drive` | false (UNUSED) |

**Note:** `generate-landing-pages` and `prospect-submitted` have `verify_jwt = false`. `generate-landing-pages` performs its own auth check inside the function via `callerClient.auth.getUser()`. `prospect-submitted` validates the prospect_token against the database directly.

### `handle-submission/index.ts`

```typescript
// supabase/functions/handle-submission/index.ts
// Fired after client submits onboarding form.
// Creates a Notion page in the client tracker database with full SOP checklist.

const NOTION_DB_ID = "31aac1484e348067977dda1128916077";

// Builds AM → notion_user_id map from role_assignments table
// Uses: SUPABASE_SERVICE_ROLE_KEY, NOTION_TOKEN
// NOTE: No explicit auth check on caller — relies on JWT being valid at invocation.
// SOP checklist: 6 phases, ~27 to-do items, Phase 2 item "Submit Onboarding Form" pre-checked.
```

### `generate-landing-pages/index.ts`

```typescript
// supabase/functions/generate-landing-pages/index.ts
// verify_jwt = false — performs own auth check:
//   const { data: { user }, error } = await callerClient.auth.getUser();
//   if (!user) return 401

// MODEL: "claude-haiku-4-5-20251001"
// 4 parallel Anthropic calls with 60s AbortController timeout per call
// max_tokens: landing=1500, terms=4000, privacy=2500, rg=2500
// Template engine: {{PLACEHOLDER}} split/join substitution (see templates.ts)

// Placeholders: BRAND_NAME, LEGAL_COMPANY, LOGO_URL, PRIMARY_COLOR,
//   PRIMARY_LIGHT, PRIMARY_BG_TINT, PRIMARY_BORDER_TINT, PRIMARY_BORDER_STRONG,
//   DOMAIN, PLATFORM_URL, SUPPORT_EMAIL, COUNTRY, JURISDICTION_FULL,
//   TAGLINE, DESCRIPTION, TERMS_CONTENT, PRIVACY_CONTENT, RG_CONTENT, RG_HELPLINES_HTML

// Error handling: AbortError → 504, other → 500; per-call .catch() wrapping
```

### `design-locked/index.ts`

```typescript
// supabase/functions/design-locked/index.ts
// Auth check: callerClient.auth.getUser() + can_lock_design() RPC
// Finds or creates Notion page for client.
// Appends 7-section studio config block:
//   1. Client metadata (name, AM, date)
//   2. App config (language, app name, colour mode)
//   3. Label overrides (custom button/nav strings)
//   4. TCM strings (full multi-language string table)
//   5. Human-readable colour list
//   6. JSON colour dump
//   7. Raw studio_config JSON
// Notion API limit: 100 blocks per request — batched accordingly.
// Updates: clients.studio_locked_at, onboarding_forms.studio_locked = true
// NOTION_TOKEN required; non-fatal if Notion call fails (sets notion_sync_pending = true)
```

### `convert-prospect-to-client/index.ts`

```typescript
// supabase/functions/convert-prospect-to-client/index.ts
// Auth: admin / AE / AM only
// 1. Creates clients row
// 2. Copies AM assignments from prospect_account_managers → client_account_managers
// 3. Upserts onboarding_forms with prospect data pre-filled
// 4. Nullifies prospects.access_token
// 5. Appends "Contract Signed" Notion block to prospect's page
// 6. Generates magic-link invite via auth.admin.generateLink
```

### `prospect-submitted/index.ts`

```typescript
// supabase/functions/prospect-submitted/index.ts
// verify_jwt = false
// Validates body.prospect_token against DB directly (token match + expiry check)
// Token mismatch → 403
// Finds or creates Notion page; appends Pre-Onboarding blocks
// Uses SUPABASE_SERVICE_ROLE_KEY
```

### `invite-am/index.ts`

```typescript
// supabase/functions/invite-am/index.ts
// Admin/AE only
// auth.admin.inviteUserByEmail()
// Upserts user_roles and role_assignments
```

### `generate-logo/index.ts`

```typescript
// supabase/functions/generate-logo/index.ts
// ANTHROPIC_MODEL = "claude-haiku-4-5-20251001", max_tokens=150 (brand name extraction)
// 3 parallel Ideogram v3 API calls (IDEOGRAM_API_KEY)
// Style variants: icon+wordmark (1x1), wordmark-only (16x9), abstract mark (1x1)
// NOTE: No explicit auth check on caller.
```

### `upload-landing-pages-to-drive/index.ts`

```typescript
// supabase/functions/upload-landing-pages-to-drive/index.ts
// UNUSED AS OF 2026-04-23 — replaced by manual drag-drop flow.
// Uses GOOGLE_SERVICE_ACCOUNT_KEY for Google OAuth JWT.
```

---

## Section 6: Frontend Studio Components

### `src/lib/studio-features.ts`

```typescript
// src/lib/studio-features.ts
export const STUDIO_FEATURES = [
  "landing_page_generator",
  "ai_chat",
  "color_editor",
  "animation_tools",
  "logo_editor",
  "asset_library",
] as const;

export const DEFAULT_STUDIO_FEATURES: StudioFeatures = {
  landing_page_generator: true,  // on by default
  ai_chat: false,
  color_editor: false,
  animation_tools: false,
  logo_editor: false,
  asset_library: false,
};
```

### `src/hooks/useStudioFeatures.ts`

```typescript
// src/hooks/useStudioFeatures.ts
export function useStudioFeatures(clientId: string | undefined) {
  // Reads clients.studio_features (cast needed — types not yet regenerated)
  // Staff bypass: role === "admin" | "account_executive" | "account_manager" → ALL features return true
  const hasFeature = (feature: StudioFeature): boolean => {
    if (isStaff) return true;
    return features[feature];
  };
  return { features, hasFeature, isStaff, loading };
}
```

### `src/routes/onboarding.$clientId.studio.tsx` — isLandingPageOnlyMode detection

```typescript
// src/routes/onboarding.$clientId.studio.tsx — StudioPage (lines ~1625–1643)

const landingPagesCompleted = Boolean(
  (clientRes.data as { landing_pages_submitted_at?: string | null } | null)
    ?.landing_pages_submitted_at,
);
const otherEnabled = enabledFeatureCount > 1; // anything besides landing_page_generator

if (
  studioFeatures.landing_page_generator &&
  (enabledFeatureCount === 1 || !landingPagesCompleted) &&
  !(landingPagesCompleted && otherEnabled)
) {
  setIsLandingPageOnlyMode(true);
}
```

**Effect:** When in landing-page-only mode, the full Studio shell is replaced by `LandingPageFullPageShell`, which renders only the `LandingPageGenerator` without palette/color/lock controls.

### `src/routes/onboarding.$clientId.studio.tsx` — setReady block

```typescript
// StudioPage useEffect (simplified)
const [isAssignedAM, setIsAssignedAM] = useState(false);

const [formRes, clientRes, camRes] = await Promise.all([
  supabase.from("onboarding_forms").select("submitted_at, studio_config, studio_locked, studio_locked_at")...,
  supabase.from("clients").select("studio_access, studio_access_locked, studio_features, landing_pages_submitted_at")...,
  supabase.from("client_account_managers").select("am_email").eq("client_id", clientId).eq("am_email", user.email)...,
]);

if (!data?.submitted_at) {
  navigate({ to: "/onboarding/$clientId/form", ... });
  return;
}

// 3-tier config migration:
// Phase 3+: saved.palette → TCMPalette
// Legacy:   saved.colors → migrateLegacyThemeColors()
// Very old: raw StudioThemeColors object → migrateLegacyThemeColors()

setReady(true); // triggers render of StudioProvider + StudioInner or LandingPageFullPageShell
```

### `src/components/studio/LandingPageGenerator.tsx`

```typescript
// src/components/studio/LandingPageGenerator.tsx
// Props: { clientId: string; layout?: "embedded" | "fullpage" }
// - "fullpage": used by isLandingPageOnlyMode shell and StudioInner canvas; full sidebar + preview
// - "embedded": used inside StudioInner accordion (compact mode)
// ctaLabel: "Submit for Review" (fullpage) | "Generate Pages" (embedded)

// Pre-fill on mount: reads clients.primary_contact_email + landing_pages_submitted_at
//   → if landing_pages_submitted_at set: jump to confirmedUpload/success screen

// Generation: supabase.functions.invoke("generate-landing-pages", { body: {...} })
//   → returns { pages: { index, terms, privacy, rg } }

// Download: JSZip → 4 .html files + README.md → <clientName>-landing-pages-YYYY-MM-DD.zip

// Required fields: legalCompanyName, brandName, primaryDomain, supportEmail,
//                  licenseJurisdiction, brandPrimaryColor, logo (logoUrl)

// Jurisdictions: Nigeria, South Africa (x2), Kenya, Ghana, Tanzania, Uganda,
//                Mexico, Curaçao, Malta, Other

// RG helplines: auto-populated per jurisdiction from hardcoded RG_HELPLINES map
```

### `src/routes/onboarding.$clientId.success.tsx` — hasLandingPageCTA block

```typescript
// src/routes/onboarding.$clientId.success.tsx (lines ~75–78)

const sf = clientRes.data?.studio_features as Record<string, boolean> | null;
if (sf?.landing_page_generator) setHasLandingPageCTA(true);

// hasLandingPageCTA = true → renders "Enter Trivelta AI Studio" full-page promo layout
//   showing Claude × Trivelta strategic partnership branding, 4-step "what happens inside" list,
//   CTA to /onboarding/$clientId/studio, PDF download secondary.
//
// hasLandingPageCTA = false → original "You're all set" layout (3 cards: review, setup, go live)
//   CTA to /dashboard, PDF download secondary.
```

---

## Section 7: Frontend Auth Flows

### Client Onboarding Auth (`onboarding.$clientId.auth.tsx`)

```typescript
// Magic-link OTP flow
// emailRedirectTo: `${window.location.origin}/onboarding/${clientId}/form`
// After auth: checks onboarding_forms.submitted_at + clients.studio_features
// Routing:
//   submitted + studio_features.landing_page_generator → /studio
//   submitted + studio_access → /studio-unlocked
//   submitted (no studio) → /success
//   not submitted → /form
```

### Prospect Token Auth (`prospect.$token.tsx`)

```typescript
// No Supabase auth — token-gated via SECURITY DEFINER RPC
const { data, error } = await supabase.rpc("get_prospect_by_token", { p_token: token });

// Expiry check: token_expires_at < now() → "expired" state
// Welcome redirect: localStorage key `prospect-welcome-seen-${token}` → /prospect/welcome/$token
// All saves/submits use supabase.rpc("update_prospect_by_token", { p_token, p_fields })
// Submit: then supabase.functions.invoke("prospect-submitted", { body: { prospect_token: token, ... } })
```

### Staff Admin Auth

- JWT-authenticated via `useAuth()` context (Supabase session).
- Role checked via `user_roles` table: `admin | account_executive | account_manager | client`.
- Staff bypass in `useStudioFeatures`: all features return `true` regardless of client config.

---

## Section 8: Supabase Client API Usage Map

### `supabase.from(...)` calls per file

| File | Table(s) accessed |
|---|---|
| `src/routes/admin.tsx` | `clients`, `onboarding_forms`, `user_roles`, `role_assignments`, `onboarding_tasks` |
| `src/routes/onboarding.$clientId.form.tsx` | `onboarding_forms`, `clients` |
| `src/lib/auth-context.tsx` | `user_roles` |
| `src/components/studio/LandingPageGenerator.tsx` | `clients` |
| `src/routes/onboarding.$clientId.studio.tsx` | `onboarding_forms`, `clients`, `client_account_managers` |
| `src/lib/onboarding-context.tsx` | (via RPC `get_client_welcome_info`) |
| `src/components/studio/LogoUploadField.tsx` | Storage (`landing-page-assets` bucket) |
| `src/routes/studio-preview.$clientId.tsx` | `onboarding_forms`, `clients` |
| `src/routes/dashboard.tsx` | `clients` |
| `src/routes/admin_.prospects.$id.edit.tsx` | `prospects` |
| `src/lib/activity-log.ts` | (via RPC `log_client_activity`) |
| `src/integrations/supabase/auth-middleware.ts` | (auth session check) |

### `supabase.rpc(...)` calls

| RPC | Called from |
|---|---|
| `get_prospect_by_token` | `prospect.$token.tsx` |
| `update_prospect_by_token` | `prospect.$token.tsx` (autosave, submit, requestUpdate) |
| `register_onboarding_visitor` | `onboarding.$clientId.form.tsx` (on mount) |

### `supabase.functions.invoke(...)` calls

| Function | Called from |
|---|---|
| `generate-landing-pages` | `LandingPageGenerator.tsx` |
| `generate-logo` | `AIChatPanel.tsx` |
| `prospect-submitted` | `prospect.$token.tsx` (on submit) |
| `design-locked` | `dashboard.tsx` (admin re-trigger), `onboarding.$clientId.studio.tsx` (lock action) |
| `convert-prospect-to-client` | `admin.tsx` |
| `invite-am` | `admin.tsx` |
| `handle-submission` | `onboarding.$clientId.form.tsx` (fire-and-forget after upsert) |

### Realtime / Presence

```typescript
// src/routes/onboarding.$clientId.form.tsx (lines ~381–390)
const ch = supabase.channel(`onboarding-form:${clientId}`, { config: { presence: { key: user.id } } });
ch.on("presence", { event: "sync" }, () => { /* show other-user-present banner */ });
ch.subscribe(async (status) => {
  if (status === "SUBSCRIBED") await ch.track({ user_id: user.id, email: user.email });
});
```

### `supabase.storage.*` calls

- `studio-assets` bucket: animation upload in `onboarding.$clientId.studio.tsx` (`handleAnimationUpload`)
- `landing-page-assets` bucket: logo upload in `LogoUploadField.tsx`

---

## Section 9: Build & Config

### `vite.config.ts`

```typescript
// vite.config.ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
export default defineConfig();
// All plugins (tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare build target,
// componentTagger dev, VITE_* env injection, @ alias, React/TanStack dedupe) are
// provided by the Lovable wrapper. No custom plugins added.
```

### `supabase/config.toml`

```toml
project_id = "[REDACTED]"

[functions.generate-landing-pages]
verify_jwt = false   # auth handled inside function

[functions.prospect-submitted]
verify_jwt = false   # token-gated inside function

# All other named functions: verify_jwt = true
```

### Route file sizes (lines)

| File | Lines |
|---|---|
| `admin.tsx` | 2334 |
| `onboarding.$clientId.form.tsx` | 2004 |
| `onboarding.$clientId.studio.tsx` | 1848 |
| `dashboard.tsx` | 1097 |
| `onboarding.$clientId.studio-preview.tsx` | 518 |
| `studio-preview.$clientId.tsx` | 500 |
| `onboarding.$clientId.success.tsx` | 488 |
| `prospect.$token.tsx` | 269 |
| `login.tsx` | 268 |
| `onboarding.$clientId.studio-intro.tsx` | 248 |
| `onboarding.$clientId.index.tsx` | 240 |
| `admin_.prospects.$id.edit.tsx` | 214 |
| `onboarding.$clientId.studio-unlocked.tsx` | 205 |
| `onboarding.$clientId.studio-locked.tsx` | 198 |
| `prospect_.welcome.$token.tsx` | 194 |
| `onboarding.$clientId.auth.tsx` | 188 |
| `onboarding.$clientId.welcome.tsx` | 184 |

### Studio component sizes (lines)

| File | Lines |
|---|---|
| `BettingAppPreview.tsx` | 3074 |
| `LandingPageGenerator.tsx` | 1633 |
| `AIChatPanel.tsx` | 491 |
| `LogoUploadField.tsx` | 211 |
| `PremiumColorPicker.tsx` | 150 |
| `StudioColorField.tsx` | 139 |
| `AccordionSection.tsx` | 108 |
| `AdvancedModePanel.tsx` | 87 |
| `FormField.tsx` | 39 |
| `QuickEditPanel.tsx` | 20 |

---

## Section 10: Code Quality Markers

### `as any` type casts

**Count: 34** across `src/`. Concentrated in files that query columns added by migrations after the last `types.ts` regeneration (`studio_features`, `landing_pages_submitted_at`, `studio_access_locked`). Cast pattern:

```typescript
(supabase as any).from("clients").select("studio_features, landing_pages_submitted_at")
```

This is a tracked technical debt — the types file (`src/integrations/supabase/types.ts`) does include `studio_features` and `landing_pages_submitted_at` in the Row types (confirmed in Section 3), suggesting the casts were added before a types regeneration and not cleaned up.

### TODO / FIXME / HACK comments

**Count: 0** — no `TODO`, `FIXME`, or `HACK` inline comments found in `src/`.

### `console.log` / debug statements

**Total markers (TODO+FIXME+HACK+console.*): ~35**  
Notable debug `console.log` blocks in `LandingPageGenerator.tsx` (lines ~584–588):

```typescript
console.log("[landing-gen] Session present:", !!session);
console.log("[landing-gen] User ID:", authUser?.id);
console.log("[landing-gen] User email:", authUser?.email);
console.log("[landing-gen] Token length:", session?.access_token?.length ?? 0);
console.log("[landing-gen] Token first 50:", session?.access_token?.substring(0, 50));
```

These log the first 50 characters of the JWT access token to the browser console — a minor information-exposure concern in production.

### `studio_access` column usage

Referenced in: `types.ts` (typed), `usePermissions.ts` (permission check), `onboarding.$clientId.index.tsx` (redirect logic), `dashboard.tsx` (AM toggle UI). Well-typed; no `as any` needed.

---

## Section 11: CI / GitHub Actions

**NOT FOUND.** No `.github/` directory exists. No CI configuration files found anywhere in the repository.

---

## Section 12: Tests

**NOT FOUND.** No `*.test.*` or `*.spec.*` files exist anywhere in the repository (excluding `node_modules`). No test runner is configured in `package.json`.

---

## Section 13: Security Findings Summary

### Critical Issues — RESOLVED

1. **Prospect USING(true) RLS** (resolved in `20260422220000`): Early migrations added `"Public can read prospect by token"` and `"Public can update prospect by token"` policies with `USING(true)`, allowing any user to read or update any prospect row. Fixed by dropping both policies and replacing with `get_prospect_by_token()` / `update_prospect_by_token()` SECURITY DEFINER RPCs that enforce token match and expiry server-side.

2. **Activity log forge** (resolved in `20260422220000`): An open `"Authenticated insert own activity"` policy allowed any authenticated user to insert arbitrary actor identity. Fixed by restricting direct INSERT to staff roles only and creating `log_client_activity()` SECURITY DEFINER RPC that derives actor from `auth.uid()`.

3. **Design lock bypass** (resolved in `20260422220000`): `design-locked` edge function authorization was not enforced at the DB level. Fixed by creating `can_lock_design()` SECURITY DEFINER RPC called at function entry.

4. **`client_account_managers` RLS recursion** (resolved in `20260419000005`): Policy referenced itself, causing infinite recursion. Fixed by creating `is_am_for_client()` SECURITY DEFINER helper.

### Issues — STILL PRESENT

5. **`handle-submission` — no explicit caller auth check**: The function has `verify_jwt = true` in config (not listed in `config.toml`, implying default). However, the function body does not call `callerClient.auth.getUser()` to confirm the caller's identity or role. Any authenticated user can POST to this function and cause it to create a Notion page and mark an onboarding form as submitted. The DB-level `upsert` in `form.tsx` is the authoritative submission path; the edge function call is fire-and-forget.

6. **`generate-logo` — no explicit caller auth check**: `verify_jwt = true` in config but no `auth.getUser()` call inside the function. Any holder of a valid JWT can trigger Ideogram API calls and Anthropic API calls at Trivelta's expense.

7. **JWT token logged to console**: `LandingPageGenerator.tsx` lines ~584–588 log the first 50 characters of `session.access_token` to the browser console. Low severity but should be removed before production.

8. **`as any` casts (34 instances)**: Many database columns added after the last types regeneration are accessed via `(supabase as any)`. The `types.ts` file appears to be up-to-date, so these casts are stale and should be removed to restore compile-time type safety.

9. **Direct table upsert bypasses `submit_onboarding_form()` RPC**: `onboarding.$clientId.form.tsx` submits directly via `supabase.from("onboarding_forms").upsert(...)` rather than via the `submit_onboarding_form()` RPC. An `enforce_owner_submit_trigger` exists at the DB level, but the RPC path's ownership enforcement is not exercised by the frontend.

10. **`generate-landing-pages` `verify_jwt = false`**: The function performs its own auth check (`callerClient.auth.getUser()`), which is correct. However, the anon key is accepted as a bearer token (passed via `apikey` header from `onboarding.$clientId.studio.tsx`), so the function is callable by any browser with a valid anon key. The internal `auth.getUser()` check will reject unauthenticated callers, but the function is publicly reachable.

---

## Section 14: Migration Timeline Summary

| Date range | Key changes |
|---|---|
| 2026-04-18 | Initial schema: `clients`, `onboarding_forms`, `team_members`, `user_roles`, `role_assignments`, `profiles`. Basic RLS. Storage bucket `onboarding-media`. |
| 2026-04-18 (evening) | `client_account_managers` junction table. `get_client_welcome_info()` RPC. Media storage + form submissions. |
| 2026-04-19 (00:00–) | `fixes.sql`: submit RPC owner check. Auto-register member trigger. RLS fixes (`is_assigned_am` email fallback). Studio config column on `onboarding_forms`. CAM recursion fix. Studio lock columns. Clients Notion/Studio columns. Multi-AM RPC. Studio access control. `role_assignments.notion_user_id`. `notion_sync_pending`. Studio storage bucket. |
| 2026-04-19 (daytime) | Various Lovable-generated UUIDs: prospect-related columns, `sop_task_template`, `onboarding_tasks`, `client_activity_log`. |
| 2026-04-20 | Add Jay as admin. Studio access v2. |
| 2026-04-21 | `platform_live` column. |
| 2026-04-22 | `prospects` table + full RLS (later revoked). `studio_access_granted_at/by`. `account_manager` role added to enum. Prospect delete policy. Phase P4 columns. `prospect_account_managers` junction. `access_token` nullable. Update-request columns. |
| 2026-04-22 (22:00) | **Security audit**: remove `USING(true)` prospect policies; `get_prospect_by_token` + `update_prospect_by_token` + `can_lock_design` + `log_client_activity` SECURITY DEFINER RPCs. |
| 2026-04-22 (23:00) | `clients.studio_features` jsonb column + `client_has_studio_feature()` RPC. |
| 2026-04-23 | `landing-page-assets` storage bucket. Re-apply security audit (GRANT statements added). |
| 2026-04-24 | `clients.landing_pages_submitted_at` column. |
