# Trivelta Onboarding Hub – Komplettes Projekt-Audit

> Dieses Dokument richtet sich an Leser **ohne jegliches Vorwissen** über das Projekt. Es erklärt, **was** das System ist, **wie** es aufgebaut ist, **welche** Geschäftsprozesse es abbildet und **wo** die wichtigsten Schalthebel sitzen. Sprache: Deutsch. Code-Begriffe (Spalten, Funktionen, Routen) bleiben Englisch.

---

## 1. Was ist dieses Projekt?

**Trivelta Onboarding Hub** ist eine interne Web-Plattform der Firma **Trivelta**, mit der neue iGaming-Kunden (Sportsbooks, Casinos, Affiliates) durch den gesamten Onboarding-Prozess geführt werden – von der ersten Akquise (Prospect) bis zum Live-Gang der Plattform.

Kerngedanke: Statt PDFs, E-Mails und Notion-Seiten manuell hin- und herzuschicken, läuft alles in einem geführten Self-Service-Flow ab. Trivelta-Mitarbeiter (Admins, Account Executives, Account Manager) verwalten Kunden, der Kunde selbst füllt Formulare aus, lädt Logos hoch und designt seine Marke per KI-Wizard.

### Hauptbestandteile auf einen Blick
1. **Prospect-Phase** – ein potenzieller Kunde (Lead) bekommt einen Token-Link, füllt grundlegende Daten aus.
2. **Konvertierung Prospect → Client** – Trivelta-Staff macht aus dem Lead einen aktiven Kunden.
3. **Onboarding-Formular** – der Kunde befüllt detaillierte Daten (Firma, Zahlungsanbieter, KYC, Marketing-Stack).
4. **Studio (Branding-Wizard)** – der Kunde generiert per KI eine Farbpalette, Logo, Landing Pages für seine Plattform.
5. **Admin-Bereich** – Trivelta steuert Zugänge, schaltet Studio-Features frei, lockt/unlockt Designs.
6. **Notion-Sync** – Kundendaten werden automatisch in eine Notion-Datenbank gespiegelt.

---

## 2. Tech-Stack

| Schicht | Technologie |
|---|---|
| Frontend-Framework | **TanStack Start v1** (React 19, Vite 7, file-based Routing) |
| Styling | **Tailwind CSS v4** mit semantischen Tokens in `src/styles.css` (oklch) |
| UI-Komponenten | **shadcn/ui** + Radix UI |
| Backend (Datenbank, Auth, Storage) | **Lovable Cloud** = Supabase im Hintergrund |
| Server-Logik | **Supabase Edge Functions** (Deno) für KI-Generierung, Webhooks, Notion-Sync |
| KI-Modelle | **Lovable AI Gateway** (Google Gemini 2.5 Pro/Flash, GPT-5) – keine eigenen API-Keys nötig |
| Hosting | Cloudflare Workers (über Vite-Plugin) |
| Externe Integrationen | Notion API, Google Drive (Landing-Page-Upload) |

---

## 3. Rollenmodell (Authentifizierung & Berechtigungen)

Es gibt **vier App-Rollen** (`app_role` Enum), gespeichert in einer separaten Tabelle `user_roles` (niemals auf `profiles` – das wäre ein Sicherheitsrisiko):

| Rolle | Wer | Was darf sie |
|---|---|---|
| `admin` | Trivelta-Geschäftsführung / Senior Staff | Alles – CRUD auf alle Tabellen, Rollen verwalten, alle Clients löschen |
| `account_executive` (AE) | Trivelta Sales | Wie Admin, plus: kann neue Clients/Prospects anlegen, Studio-Features freischalten |
| `account_manager` (AM) | Trivelta Account Management | Sieht/verwaltet **nur zugewiesene** Clients (über `client_account_managers`) und Prospects (über `prospect_account_managers`) |
| `client` | Externer Kunde | Sieht **nur den eigenen** Client-Datensatz (über `primary_contact_email` Match oder `team_members`-Eintrag) |

**Berechtigungs-Helper:**
- `src/hooks/usePermissions.ts` – derived flags (`canCreateClient`, `canSubmitStudio`, `canUnlockStudio`, …) basierend auf Rolle + Zuweisung.
- `src/lib/auth-context.tsx` – globaler Auth-Provider, lädt Session + Rolle, hat einen Self-Heal-Mechanismus über `role_assignments` (Email-basierte Pre-Assignment-Tabelle).

**Sicherheit:** Jede Tabelle hat **Row-Level Security (RLS)** aktiviert. Policies nutzen die SECURITY-DEFINER-Funktion `has_role(user_id, role)`, um rekursive RLS-Probleme zu vermeiden.

---

## 4. Datenmodell (die wichtigsten Tabellen)

### Lead-/Kunden-Lebenszyklus
- **`prospects`** – Leads mit Token-Link. Felder u. a.: `legal_company_name`, `primary_contact_email`, `access_token`, `token_expires_at`, `company_details` (jsonb), `payment_providers`, `kyc_compliance`, `marketing_stack`, `form_progress`, `converted_to_client_id`.
- **`prospect_account_managers`** – Welcher AM betreut welchen Prospect (Email-basiert).
- **`clients`** – Aktive Kunden. Wichtige Felder:
  - `status` (Enum `client_status`: `onboarding`, `active`, …)
  - `studio_access` (Bool) – darf der Kunde Studio überhaupt sehen?
  - `studio_access_locked` (Bool) – ist das Studio admin-seitig hart gesperrt?
  - `studio_features` (jsonb) – Feature-Flags pro Kunde: `ai_chat`, `logo_editor`, `color_editor`, `asset_library`, `animation_tools`, `landing_page_generator`
  - `onboarding_phase`, `contract_signed_at`, `go_live_date`, `next_renewal_date`, `health_score`
- **`client_account_managers`** – Mehrere AMs pro Client (n:m).
- **`team_members`** – Zusätzliche Personen auf Kundenseite (`client_role`: `client_primary` oder `client_member`).

### Onboarding-Daten
- **`onboarding_forms`** – Pro Client genau eine Zeile mit:
  - `data` (jsonb) – das komplette ausgefüllte Onboarding-Formular
  - `studio_config` (jsonb) – die generierte Marke (Palette, Logo, Brand-Context, Prompt-History)
  - `studio_locked` / `studio_locked_at` – ist das Design eingefroren? (z. B. nach Final-Submit)
  - `submitted_at`, `notion_sync_pending`
- **`form_submissions`** – Audit-Snapshots jeder finalen Submission (`data_snapshot` jsonb).
- **`onboarding_tasks`** – Pro Client generierte To-Do-Liste, geseedet aus `sop_task_template`. Felder: `phase`, `task`, `owner` (`CLIENT` oder `TRIVELTA`), `completed`.

### Audit & Logs
- **`client_activity_log`** – Append-only Log aller Aktionen (Wer, Was, Wann, Details als jsonb). Wird über die SECURITY-DEFINER-RPC `log_client_activity` befüllt – verhindert, dass Clients ihre Identität fälschen.

### Auth & Rollen
- **`user_roles`** – `(user_id, role)` Paare, der Single Source of Truth für Berechtigungen.
- **`role_assignments`** – Email-basierte Pre-Allocation (z. B. neue Mitarbeiter werden nach Sign-up automatisch geseedet).
- **`profiles`** – Anzeigename + E-Mail für UI.

---

## 5. Routen-Struktur (Frontend)

TanStack Start nutzt **flat dot-separated** File-based Routing in `src/routes/`.

### Öffentliche Routen
- `/` (`index.tsx`) – Landing
- `/login` – Auth (Supabase Email + Google OAuth)
- `/prospect/$token` – Prospect-Self-Service (über Token, kein Login nötig)
- `/prospect/welcome/$token` – Welcome-Screen für Prospects

### Trivelta-Staff
- `/admin` – Admin-Dashboard (Client-Liste mit Filtern, Drawer mit Details)
- `/admin/prospects/$id/edit` – Prospect-Bearbeitung
- `/dashboard` – Eingangs-Dashboard nach Login

### Kunden-Onboarding (`/onboarding/$clientId/...`)
- `index` – Übersicht der Onboarding-Phasen
- `welcome` – Begrüßung
- `auth` – Login/Sign-up für Client
- `form` – Detail-Onboarding-Formular
- `studio-intro` – Erklärung was Studio ist
- `studio` – Read-only Studio-Ansicht (bei `studio_locked=true`)
- `studio-locked` / `studio-unlocked` – Status-Screens
- `studio-preview` – Live-Preview der generierten Marke (Betting-App-Mockup)
- `wizard` – **Der Brand-Generierungs-Wizard** (Hauptbestandteil, siehe §6)
- `success` – Final-Screen

### Sonstige
- `/my-onboarding` – Redirect-Helper für Clients zu ihrem eigenen `clientId`
- `/studio-preview/$clientId` – Admin-Preview der Marke

---

## 6. Der Studio-Wizard (Herzstück der Brand-Generierung)

**Datei:** `src/components/studio/wizard/WizardLayout.tsx` (~330 Zeilen)

Der Kunde durchläuft einen 4-5-Schritte-Wizard, dessen Ergebnis eine vollständige Marke (Farbpalette, Logo, Tonalität) ist, die in `onboarding_forms.studio_config` gespeichert wird.

### Pfade
Der Wizard verzweigt nach **Schritt 2** in zwei Pfade:

**Pfad A – „Fresh" (5 Schritte):**
1. Country-Picker (Zielmarkt, Single oder Multi-Market)
2. Brand-Identity-Choice (Fresh vs. Logo)
3. **Personality-Picker** (z. B. „Challenger", „Mass Market", „Premium", „Modern Crypto")
4. Brief-Input (Freitext-Beschreibung der Marke)
5. Three-Options (KI generiert 3 Varianten, Kunde wählt eine)

**Pfad B – „Logo" (4 Schritte, überspringt Personality):**
1. Country-Picker
2. Brand-Identity-Choice
3. Brief + Logo-Upload
4. Three-Options (Logo-basierte Generierung)

### State-Management
- Wizard-State (`WizardState`) liegt im Client-State + wird via `loadWizardState`/`saveWizardState` (`src/lib/wizard-state.ts`) **lokal in `localStorage`** persistiert (pro `clientId`). Das erlaubt Refresh ohne Datenverlust mitten im Wizard.
- Bei `?regenerate=true` wird der Wizard mit existierenden Daten aus `studio_config.brandContext` **vorbefüllt** – der Kunde kann eine bestehende Marke neu generieren ohne alles neu einzugeben.

### Lock-Mechanismus
- Wenn `onboarding_forms.studio_locked = true`:
  - **Self-Service-Kunden** werden weggeleitet (`/onboarding/$clientId/studio`) mit Toast „Brand ist gesperrt".
  - **Admins** sehen eine gelbe Warnbox („Re-generating überschreibt das gelockte Design") und dürfen weitermachen.

### Legacy-Migration
- Marken, die **vor** der Einführung von `brandContext` erstellt wurden, haben nur `palette`, kein `brandContext`. Beim Re-generate erkennt der Wizard das (`isLegacyBrandRegenerate`) und zeigt eine blaue Info-Box: „Bitte Markt und Personality erneut bestätigen."

---

## 7. Edge Functions (Backend-Logik)

Liegen in `supabase/functions/`. Laufen als Deno-Edge-Funktionen.

| Function | Zweck |
|---|---|
| **`generate-palette`** | Das Schwergewicht (~2.400 Zeilen). KI-Generierung der kompletten Farbpalette via Gemini/GPT. Enthält: `BRAND_PERSONALITIES` (Personality → Color-Family-Mapping), `detectTargetFields` (welche Felder will der User ändern?), Post-Validation-Refinement-Filter (verhindert dass die KI Felder außerhalb des Scope ändert), `PRIMARY HUE HIERARCHY` Mandate (Hierarchie der Hauptfarben). |
| **`generate-logo`** | Logo-Generierung über AI Image Models. |
| **`generate-landing-pages`** | Generiert HTML/CSS für Landing-Pages basierend auf der Marke. |
| **`upload-landing-pages-to-drive`** | Lädt generierte Landing-Pages zu Google Drive hoch. |
| **`handle-submission`** | Verarbeitet finale Form-Submissions, schreibt Snapshot in `form_submissions`, triggert Notion-Sync. |
| **`prospect-submitted`** / **`prospect-submitted-v2`** | Webhook-/Trigger-Logik wenn ein Prospect submitted (v2 ist die aktuelle Version, v1 für Legacy). |
| **`convert-prospect-to-client`** | Wandelt einen Prospect-Datensatz in einen vollwertigen Client um (legt `clients`, `onboarding_forms`, `onboarding_tasks` an). |
| **`contract-signed`** | Notification + Status-Update wenn Vertrag unterschrieben. |
| **`design-locked`** | Wird aufgerufen wenn der Kunde seine Marke final lockt. |
| **`go-live`** | Trigger für Plattform-Go-Live (setzt `clients.platform_live = true`, `go_live_date`). |
| **`invite-am`** | Invite-Flow für neue Account Manager. |
| **`_shared/`** | Geteilte Helper: `cors.ts`, `notion-clients.ts`, `tcm-palette.ts`, `tcm-strings.ts`, `jurisdiction-meta.ts`. |

### Wichtig: KI ohne API-Keys
Alle KI-Calls (Text + Image) gehen über das **Lovable AI Gateway** mit dem `LOVABLE_API_KEY` (server-seitig vorinstalliert). Es ist also **keine** OpenAI-/Google-API-Key-Verwaltung nötig.

---

## 8. Studio-Features (Per-Client Feature-Flags)

In `src/lib/studio-features.ts` definiert, gespeichert pro Client in `clients.studio_features` (jsonb).

| Feature | Bedeutung |
|---|---|
| `landing_page_generator` | KI-generierte Landing-Pages (Default an) |
| `ai_chat` | AI-Chat-Panel zum iterativen Anpassen der Marke |
| `logo_editor` | Logo-Editor-Tools |
| `color_editor` | Quick-Edit für einzelne Farbfelder |
| `asset_library` | Asset-Bibliothek |
| `animation_tools` | Animationen |

**Hook:** `useStudioFeatures(clientId)` mit Staff-Bypass (Trivelta-Mitarbeiter sehen alle Features unabhängig vom Kunden-Flag).
**Verwaltet von:** Admin / AE über `StudioFeatureAccessDialog`.

---

## 9. Lock-Logik (Wann ist was gesperrt?)

Es gibt **zwei** verschiedene Lock-Konzepte:

### `clients.studio_access_locked`
Hartes Admin-Lock. Wenn `true`, kann der Kunde Studio gar nicht erreichen, auch wenn `studio_access=true`. Wird typischerweise nach Vertragsbeendigung oder bei Eskalationen gesetzt.

### `onboarding_forms.studio_locked`
Soft-Lock auf das Design. Wenn `true`:
- Alle Color-Felder (`StudioColorField`) sind read-only.
- Quick-Edit-Panel ist read-only (`useStudio().locked`).
- Wizard-Re-Generate ist für Self-Service-User blockiert, für Admins mit Warnung möglich.
- Wird gesetzt wenn der Kunde finale Submission macht (`design-locked` Edge Function) oder Admin manuell lockt.

**Unlock:** Über AM/Admin (`canUnlockStudio` in `usePermissions`).

---

## 10. Aktivitäts-Logging

Jede signifikante Aktion (Studio-Submit, Lock/Unlock, Feature-Toggle, Status-Wechsel) wird über `logActivity()` (`src/lib/activity-log.ts`) in `client_activity_log` geschrieben.

**Wichtig:** Die RPC `log_client_activity` ist SECURITY DEFINER – sie löst die Identität (`actor_user_id`, `actor_email`, `actor_role`) **server-seitig** aus `auth.uid()` auf. Der Client kann also **nicht** als jemand anders loggen.

---

## 11. Notion-Sync

Klienten- und Prospect-Daten werden in eine externe Notion-Datenbank gespiegelt:
- Felder `notion_page_id`, `notion_sync_pending`, `notion_sync_error`, `notion_sync_attempted_at` auf `clients`, `onboarding_forms`, `prospects`.
- Sync-Logik in `_shared/notion-clients.ts`, getriggert durch `prospect-submitted-v2` und `handle-submission`.
- Bei Fehlern bleibt `notion_sync_pending=true` → Retry möglich.

---

## 12. Design-System

- **`src/styles.css`** – Definiert alle semantischen Tokens in `oklch` (Farben, Schatten, Gradients).
- **Regel:** Keine direkten Tailwind-Farben (`text-white`, `bg-blue-500`) in Komponenten. Immer Tokens (`text-foreground`, `bg-primary`, …).
- **Komponenten-Variants:** Über `class-variance-authority` (cva) in `button.tsx` & Co.
- **Branding:** `TriveltaLogo`, `TriveltaIcon`, `TriveltaNav` – konsistente Markendarstellung.

---

## 13. Auffälligkeiten und potenzielle Schwachstellen

### Beobachtungen aus dem Audit
1. **`studio_locked_at` existiert auf zwei Tabellen** (`clients` und `onboarding_forms`). Die kanonische Quelle ist `onboarding_forms.studio_locked_at` – die Spalte auf `clients` wirkt redundant und sollte verifiziert oder entfernt werden.
2. **Doppelte Status-Felder:** `clients.status`, `clients.onboarding_phase`, `clients.platform_live`, `clients.contract_signed_at` – Status-Maschine ist über mehrere Felder verteilt; eine zentrale State-Machine wäre wartungsfreundlicher.
3. **Legacy-Brand-Format ohne `brandContext`:** Alte Kunden (z. B. KMK Entertainment vor heutigem Update) haben `palette` aber kein `brandContext`. Re-Generate funktioniert, prefill ist aber lückenhaft (Kunde muss Markt/Personality neu wählen). Eine Migration würde das beheben.
4. **`generate-palette` ist sehr groß (~2.400 Zeilen).** Refactoring-Kandidat: Personality-Map, Validator, Prompt-Builder, KI-Call in separate Module aufteilen.
5. **Mehrere überlappende RLS-Policies** für AMs (z. B. `AMs read assigned clients` + `AMs (multi) read assigned clients`). Funktioniert, ist aber schwerer zu reasonen. Konsolidierung empfohlen.
6. **`prospect-submitted` v1 + v2 koexistieren.** Wenn v2 stabil ist, sollte v1 deprecated/gelöscht werden.

### Sicherheits-Hinweise (positiv)
- ✅ Rollen in separater Tabelle (`user_roles`), nicht auf `profiles`.
- ✅ SECURITY DEFINER `has_role()` verhindert RLS-Recursion.
- ✅ Activity-Log über RPC, Identität server-seitig aufgelöst.
- ✅ Service-Role-Key nur in Edge Functions, nie im Client.
- ✅ Prospect-Token mit Ablauf (`token_expires_at`).

---

## 14. Wo finde ich was? (Cheat-Sheet)

| Ich will… | Schau in… |
|---|---|
| Eine neue Route hinzufügen | `src/routes/` (flat dot-separated naming) |
| Eine bestehende Studio-Komponente ändern | `src/components/studio/` |
| Den Wizard-Flow anpassen | `src/components/studio/wizard/WizardLayout.tsx` + `Step1`–`Step4` |
| KI-Prompts für Palette ändern | `supabase/functions/generate-palette/index.ts` |
| Berechtigungen anpassen | `src/hooks/usePermissions.ts` + DB-RLS-Policies |
| Studio-Features pro Client togglen | Admin-UI: `StudioFeatureAccessDialog` (`src/components/admin/`) |
| Onboarding-Tasks anpassen | DB: `sop_task_template` |
| Design-Tokens anpassen | `src/styles.css` |
| Globale Auth-Logik | `src/lib/auth-context.tsx` |
| Supabase-Client (Browser) | `src/integrations/supabase/client.ts` (NIE editieren – auto-generiert) |
| Supabase-Typen | `src/integrations/supabase/types.ts` (NIE editieren – auto-generiert) |

---

## 15. Aktuelle Zahlen (Schnappschuss)

- **Migrationen:** 76+ SQL-Files in `supabase/migrations/`
- **Edge Functions:** 13 deployte Funktionen
- **Routen (Pages):** 22 Top-Level-Routen
- **Hauptkomponenten Studio:** 11 + 5 Wizard-Steps
- **Größte Edge Function:** `generate-palette` (~2.367 Zeilen)
- **Deployment-Ziel:** Cloudflare Workers (über `@cloudflare/vite-plugin`)

---

## 16. Glossar

- **Prospect** – Lead, noch kein Kunde. Hat Token-Link statt Login.
- **Client** – Aktiver Kunde mit Login.
- **Studio** – Branding-Bereich der App (Palette, Logo, Landing Pages).
- **Wizard** – Geführter Flow zur Brand-Generierung.
- **AM / AE** – Account Manager / Account Executive (Trivelta-Mitarbeiter).
- **Brand-Context** – Gespeicherte Eingabe-Parameter der letzten Generierung (Land, Personality, Plattformtyp).
- **Personality** – Markenpersönlichkeit (Challenger, Mass Market, Premium, …) – steuert Farbfamilien.
- **Lock** – Einfrieren des Studios; verhindert weitere Änderungen.
- **Lovable Cloud** – Trivelta-interne Bezeichnung für die Supabase-basierte Backend-Infrastruktur.

---

*Erstellt: 2026-05-08 · Stand: aktueller `main`-Branch.*
