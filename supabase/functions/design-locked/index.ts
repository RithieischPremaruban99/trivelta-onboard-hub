// Edge Function: design-locked
// Fires when a client locks their design in Trivelta Studio.
// 1. Reads studio_config from onboarding_forms
// 2. Finds the client's Notion page (by stored ID or DB query)
// 3. Appends a 7-section "Studio Config" block to the Notion page
// 4. Stores notion_page_id + studio_locked_at back in clients table

import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  ADVANCED_FIELD_GROUPS,
  FIELD_LABELS,
  DEFAULT_TCM_PALETTE,
  type TCMPalette,
} from "../_shared/tcm-palette.ts";
import {
  getStrings,
  DEFAULT_STRINGS,
  type Language,
} from "../_shared/tcm-strings.ts";
import { makeCorsHeaders } from "../_shared/cors.ts";

const NOTION_DB_ID = "31aac1484e348067977dda1128916077";
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VER = "2022-06-28";
// Notion limits: 100 blocks per append request, 2000 chars per rich_text entry
const BLOCK_CHUNK = 90;
const RT_CHUNK = 1990;

/* ── Types ────────────────────────────────────────────────────────────────── */

interface RequestBody {
  client_id: string;
  submitted_by?: "admin" | "client_owner";
  submitter_email?: string | null;
}

interface StudioIcons {
  appNameLogo?: string;
  topLeftAppIcon?: string;
  [key: string]: string | undefined;
}

interface StudioConfig {
  // New format (Phase 5+)
  palette?: Record<string, string>;
  language?: string;
  appName?: string;
  appLabels?: Record<string, string>;
  icons?: StudioIcons;
  // Internal-only (excluded from Notion)
  manualOverrides?: string[];
  brandPromptHistory?: string[];
  // Legacy format (pre-Phase 5)
  colors?: Record<string, string>;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function isDataUri(s: string): boolean {
  return s.startsWith("data:");
}

/** Split a long string into chunks of ≤ RT_CHUNK chars for Notion rich_text arrays */
function splitRichText(content: string): Array<{ text: { content: string } }> {
  const chunks: Array<{ text: { content: string } }> = [];
  for (let i = 0; i < content.length; i += RT_CHUNK) {
    chunks.push({ text: { content: content.slice(i, i + RT_CHUNK) } });
  }
  return chunks.length > 0 ? chunks : [{ text: { content: "" } }];
}

/* ── Notion block helpers ─────────────────────────────────────────────────── */

type RichTextEntry = {
  text: { content: string; link?: { url: string } | null };
  annotations?: { italic?: boolean; bold?: boolean; code?: boolean; color?: string };
};

function rt(content: string, annotations?: RichTextEntry["annotations"]): RichTextEntry[] {
  const entry: RichTextEntry = { text: { content } };
  if (annotations) entry.annotations = annotations;
  return [entry];
}

function rtLink(content: string, url: string): RichTextEntry[] {
  return [{ text: { content, link: { url } } }];
}

function heading1(content: string) {
  return { type: "heading_1", heading_1: { rich_text: rt(content) } };
}

function heading2(content: string) {
  return { type: "heading_2", heading_2: { rich_text: rt(content) } };
}

function heading3(content: string) {
  return { type: "heading_3", heading_3: { rich_text: rt(content) } };
}

function divider() {
  return { type: "divider", divider: {} };
}

function paragraph(richText: RichTextEntry[]) {
  return { type: "paragraph", paragraph: { rich_text: richText } };
}

function callout(content: string, emoji: string, color: string) {
  return {
    type: "callout",
    callout: { rich_text: rt(content), icon: { emoji }, color },
  };
}

function bulletedListItem(richText: RichTextEntry[]) {
  return { type: "bulleted_list_item", bulleted_list_item: { rich_text: richText } };
}

function codeBlock(content: string, language = "json") {
  return {
    type: "code",
    code: {
      language,
      rich_text: splitRichText(content),
    },
  };
}

/* ── Section builders ─────────────────────────────────────────────────────── */

/** SECTION 1: Client Metadata */
function buildSection1(
  clientName: string,
  clientId: string,
  lockedAt: string,
  amName: string | null,
  submittedBy: string,
  submitterEmail: string | null,
): object[] {
  const dateHuman = new Date(lockedAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

  const submitterLine = submittedBy === "admin"
    ? `Admin override - submitted by ${submitterEmail ?? "Trivelta admin"}`
    : `Client (${submitterEmail ?? "primary contact"})`;

  return [
    heading2("1. Client Metadata"),
    bulletedListItem(rt(`Client Name: ${clientName}`)),
    bulletedListItem(rt(`Client ID: ${clientId}`)),
    bulletedListItem(rt(`Lock Timestamp: ${dateHuman}`)),
    bulletedListItem(rt(`Account Manager: ${amName ?? "Not assigned"}`)),
    bulletedListItem(rt(`Submitted By: ${submitterLine}`)),
  ];
}

/** SECTION 2: App Configuration */
function buildSection2(config: StudioConfig): object[] {
  const icons = config.icons ?? {};
  const logoUrl = icons.appNameLogo && !isDataUri(icons.appNameLogo) ? icons.appNameLogo : null;
  const iconUrl = icons.topLeftAppIcon && !isDataUri(icons.topLeftAppIcon) ? icons.topLeftAppIcon : null;

  const blocks: object[] = [heading2("2. App Configuration")];

  blocks.push(bulletedListItem(rt(`Language Code: ${config.language ?? "en"}`)));
  blocks.push(bulletedListItem(rt(`App Name: ${config.appName ?? "Not set"}`)));

  if (logoUrl) {
    blocks.push(bulletedListItem([
      { text: { content: "Logo URL: " } },
      ...rtLink(logoUrl, logoUrl),
    ] as RichTextEntry[]));
  } else {
    blocks.push(bulletedListItem(rt("Logo URL: Not uploaded")));
  }

  if (iconUrl) {
    blocks.push(bulletedListItem([
      { text: { content: "App Icon URL: " } },
      ...rtLink(iconUrl, iconUrl),
    ] as RichTextEntry[]));
  } else {
    blocks.push(bulletedListItem(rt("App Icon URL: Not uploaded")));
  }

  return blocks;
}

/** SECTION 3: App Labels Overrides */
function buildSection3(config: StudioConfig): object[] {
  const blocks: object[] = [heading2("3. App Labels Overrides")];
  const appLabels = config.appLabels;

  if (appLabels && Object.keys(appLabels).length > 0) {
    for (const [key, value] of Object.entries(appLabels)) {
      blocks.push(bulletedListItem(rt(`${key} → ${value}`)));
    }
  } else {
    blocks.push(paragraph(rt(`No label overrides - TCM defaults apply for language ${config.language ?? "en"}.`, { italic: true })));
  }

  return blocks;
}

/** SECTION 4: TCM Strings Full Package */
function buildSection4(language: string): object[] {
  const lang = (language ?? "en") as Language;
  const strings = getStrings(lang);
  const entries = Object.entries(strings).sort(([a], [b]) => a.localeCompare(b));

  const blocks: object[] = [
    heading2(`4. TCM Strings (${lang.toUpperCase()})`),
    paragraph(rt("Complete language package for this client's chosen language.", { italic: true })),
    heading3("Human Readable"),
  ];

  // Notion limit: a single table block can have at most 100 children (rows).
  // We reserve 1 row for the header and cap data rows per table at 90 for safety.
  const MAX_DATA_ROWS_PER_TABLE = 90;

  // Group entries by semantic prefix (e.g. "sport.", "casino.") so a chunk
  // boundary doesn't split a logical section. Keys without a "." form a
  // "(general)" group. Within each group, entries keep alphabetical order.
  const prefixGroups = new Map<string, Array<[string, unknown]>>();
  for (const [key, value] of entries) {
    const dotIdx = key.indexOf(".");
    const prefix = dotIdx > 0 ? key.slice(0, dotIdx) : "(general)";
    if (!prefixGroups.has(prefix)) prefixGroups.set(prefix, []);
    prefixGroups.get(prefix)!.push([key, value]);
  }

  // Pack prefix groups into chunks of ≤ MAX_DATA_ROWS_PER_TABLE rows.
  // If a single prefix exceeds the cap, it is split sequentially.
  const chunks: Array<Array<[string, unknown]>> = [];
  let current: Array<[string, unknown]> = [];
  for (const group of prefixGroups.values()) {
    if (group.length > MAX_DATA_ROWS_PER_TABLE) {
      if (current.length > 0) {
        chunks.push(current);
        current = [];
      }
      for (let i = 0; i < group.length; i += MAX_DATA_ROWS_PER_TABLE) {
        chunks.push(group.slice(i, i + MAX_DATA_ROWS_PER_TABLE));
      }
      continue;
    }
    if (current.length + group.length > MAX_DATA_ROWS_PER_TABLE) {
      chunks.push(current);
      current = [];
    }
    current.push(...group);
  }
  if (current.length > 0) chunks.push(current);

  // Emit one heading + table per chunk.
  chunks.forEach((chunk, idx) => {
    const partLabel = chunks.length > 1 ? ` (Part ${idx + 1} of ${chunks.length})` : "";
    blocks.push(heading3(`Strings${partLabel} - ${chunk.length} entries`));

    const tableRows: object[] = [
      {
        type: "table_row",
        table_row: { cells: [rt("String Key"), rt("Value")] },
      },
      ...chunk.map(([key, value]) => ({
        type: "table_row",
        table_row: { cells: [rt(key, { code: true }), rt(String(value))] },
      })),
    ];

    blocks.push({
      type: "table",
      table: {
        table_width: 2,
        has_column_header: true,
        has_row_header: false,
        children: tableRows,
      },
    });
  });

  blocks.push(heading3("JSON Export"));

  const jsonObj: Record<string, string> = {};
  for (const [key, value] of entries) {
    jsonObj[key] = String(value);
  }
  blocks.push(codeBlock(JSON.stringify(jsonObj, null, 2)));

  return blocks;
}

/** SECTION 5: TCM Color Configuration - Human Readable */
function buildSection5(palette: Record<string, string>): object[] {
  const blocks: object[] = [
    heading2("5. TCM Color Configuration (Human Readable)"),
    paragraph(rt("All 344 color fields organized by functional group.", { italic: true })),
  ];

  for (const [groupName, fields] of Object.entries(ADVANCED_FIELD_GROUPS)) {
    const fieldCount = fields.length;
    blocks.push(heading3(`${groupName} (${fieldCount})`));

    for (const fieldName of fields) {
      const label = FIELD_LABELS[fieldName] ?? String(fieldName);
      const value = palette[fieldName] ?? (DEFAULT_TCM_PALETTE as Record<string, string>)[fieldName] ?? "";
      blocks.push(
        paragraph([
          { text: { content: label + ": " }, annotations: { bold: true } },
          { text: { content: value }, annotations: { code: true } },
        ] as RichTextEntry[])
      );
    }
  }

  return blocks;
}

/** SECTION 6: TCM Color Configuration - JSON */
function buildSection6(palette: Record<string, string>): object[] {
  // Build the full 344-field palette (merge with defaults for any missing fields)
  const fullPalette: Record<string, string> = {
    ...(DEFAULT_TCM_PALETTE as unknown as Record<string, string>),
    ...palette,
  };

  // Sort by key for readability
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(fullPalette).sort()) {
    sorted[key] = fullPalette[key];
  }

  return [
    heading2("6. TCM Color Configuration (JSON)"),
    paragraph(rt("Complete palette as JSON for direct paste into TCM runtime config.", { italic: true })),
    codeBlock(JSON.stringify(sorted, null, 2)),
  ];
}

/** SECTION 7: Raw Studio Config Dump */
function buildSection7(config: StudioConfig): object[] {
  // Exclude manualOverrides and brandPromptHistory (internal-only)
  const dump: Record<string, unknown> = {};
  if (config.palette) dump.palette = config.palette;
  if (config.language) dump.language = config.language;
  if (config.appName) dump.appName = config.appName;
  if (config.appLabels) dump.appLabels = config.appLabels;
  if (config.icons) dump.icons = config.icons;

  return [
    heading2("7. Full Studio Config (Raw)"),
    paragraph(rt("Complete studio_config for this client. Excludes internal-only fields (manualOverrides, brandPromptHistory).", { italic: true })),
    codeBlock(JSON.stringify(dump, null, 2)),
  ];
}

/** Build the complete block list for the Notion page append */
function buildAllBlocks(
  config: StudioConfig,
  lockedAt: string,
  clientName: string,
  clientId: string,
  amName: string | null,
  submittedBy: string,
  submitterEmail: string | null,
): object[] {
  const date = new Date(lockedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Resolve palette - handle new format, legacy, or empty
  let palette: Record<string, string> = {};
  if (config.palette && Object.keys(config.palette).length > 0) {
    palette = config.palette as Record<string, string>;
  } else if (config.colors && Object.keys(config.colors).length > 0) {
    palette = config.colors as Record<string, string>;
  }

  const language = config.language ?? "en";

  const blocks: object[] = [
    divider(),
    heading1("🎨 Studio Config - Design Locked"),
    paragraph(rt(`Locked on ${date} via Trivelta Studio`, { italic: true })),
    callout(
      "Client has locked their platform design. Colors, strings, and brand assets are finalised below.",
      "✅",
      "green_background",
    ),
    divider(),
    ...buildSection1(clientName, clientId, lockedAt, amName, submittedBy, submitterEmail),
    divider(),
    ...buildSection2(config),
    divider(),
    ...buildSection3(config),
    divider(),
    ...buildSection4(language),
    divider(),
    ...buildSection5(palette),
    divider(),
    ...buildSection6(palette),
    divider(),
    ...buildSection7(config),
  ];

  return blocks;
}

/* ── Notion API calls ─────────────────────────────────────────────────────── */

async function isNotionPageAccessible(pageId: string, token: string): Promise<boolean> {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
  });

  if (!res.ok) {
    console.log(`[design-locked] Cached page ${pageId} returned ${res.status} - treating as stale`);
    return false;
  }

  const data = await res.json();
  if (data.archived === true || data.in_trash === true) {
    console.log(`[design-locked] Cached page ${pageId} is archived/in_trash - treating as stale`);
    return false;
  }

  return true;
}

async function findNotionPageId(clientName: string, notionToken: string): Promise<string | null> {
  const resp = await fetch(`${NOTION_API}/databases/${NOTION_DB_ID}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VER,
    },
    body: JSON.stringify({
      filter: { property: "Client Name", title: { equals: clientName } },
      page_size: 1,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    console.error("[design-locked] Notion DB query failed:", resp.status, body);
    return null;
  }

  const data = await resp.json();
  return data.results?.[0]?.id ?? null;
}

async function appendBlocksToPage(
  pageId: string,
  blocks: object[],
  notionToken: string,
): Promise<void> {
  for (let i = 0; i < blocks.length; i += BLOCK_CHUNK) {
    const chunk = blocks.slice(i, i + BLOCK_CHUNK);
    const resp = await fetch(`${NOTION_API}/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VER,
      },
      body: JSON.stringify({ children: chunk }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Notion append blocks failed (${resp.status}): ${body}`);
    }
    console.log(`[design-locked] Appended blocks ${i + 1}-${Math.min(i + BLOCK_CHUNK, blocks.length)} of ${blocks.length}`);
  }
}

async function appendToNotesProperty(
  pageId: string,
  appendText: string,
  notionToken: string,
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VER,
  };

  const getResp = await fetch(`${NOTION_API}/pages/${pageId}`, { method: "GET", headers });
  let existingNotes = "";
  if (getResp.ok) {
    const pageData = await getResp.json();
    const notesRt = pageData.properties?.["Notes"]?.rich_text;
    if (Array.isArray(notesRt)) {
      existingNotes = notesRt.map((r: { plain_text?: string }) => r.plain_text ?? "").join("");
    }
  } else {
    console.warn("[design-locked] Could not GET page notes, will overwrite");
  }

  const newNotes = existingNotes
    ? `${existingNotes}\n\n${appendText}`.slice(0, 2000)
    : appendText.slice(0, 2000);

  const patchResp = await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      properties: { Notes: { rich_text: rt(newNotes) } },
    }),
  });

  if (!patchResp.ok) {
    const body = await patchResp.text();
    console.error("[design-locked] Failed to update Notes:", body);
  }
}

/**
 * Create a minimal Notion page for a client who locked their design before
 * submitting the onboarding form. A proper SOP page will be created by
 * handle-submission when the form is submitted - this page exists solely so
 * the design config can be appended now.
 */
async function createNotionPage(
  clientName: string,
  country: string | null,
  driveLink: string | null,
  notionToken: string,
): Promise<string | null> {
  const properties: Record<string, unknown> = {
    "Client Name": { title: [{ text: { content: clientName } }] },
    Status: { status: { name: "Onboarding" } },
  };
  if (country) properties["Country"] = { select: { name: country } };
  if (driveLink) properties["Drive"] = { url: driveLink };

  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const children = [
    {
      type: "callout",
      callout: {
        rich_text: [{ text: { content: `⚠️ Studio design locked on ${date} - onboarding form not yet submitted. This page was auto-created by design-locked. Full SOP checklist will be added when the client submits their onboarding form.` } }],
        icon: { emoji: "⚠️" },
        color: "yellow_background",
      },
    },
  ];

  try {
    const resp = await fetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VER,
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB_ID },
        properties,
        children,
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error(`[design-locked] Failed to create Notion page (${resp.status}):`, errBody);
      return null;
    }

    const page = await resp.json();
    console.log("[design-locked] Created new Notion page on-the-fly:", page.id);
    return page.id as string;
  } catch (e) {
    console.error("[design-locked] Network error creating Notion page:", e);
    return null;
  }
}

/* ── Main handler ────────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  const cors = makeCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
    if (!NOTION_TOKEN) throw new Error("NOTION_TOKEN not configured");

    // Verify JWT and extract caller identity (verify_jwt = true in config.toml)
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body: RequestBody = await req.json();
    const { client_id, submitted_by = "client_owner", submitter_email = null } = body;
    if (!client_id) throw new Error("client_id is required");

    // Authorization: verify caller has permission to lock this client's design
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: canLock, error: authzErr } = await (supabase as any).rpc("can_lock_design", {
      p_user_id: user.id,
      p_client_id: client_id,
    });
    if (authzErr || !canLock) {
      console.warn(`[design-locked] Unauthorized lock attempt by ${user.id} for client ${client_id}`);
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const fnStart = Date.now();
    console.log(`[design-locked] Triggered for client_id: ${client_id} at ${new Date().toISOString()}`);
    console.log(`[design-locked] Submitted by: ${submitted_by} (${submitter_email ?? "unknown"})`);
    console.log(`[design-locked] NOTION_TOKEN present: ${!!NOTION_TOKEN}`);

    // 1. Read client record
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("name, notion_page_id, country, drive_link")
      .eq("id", client_id)
      .single();

    if (clientErr || !client) {
      throw new Error(`Client not found: ${clientErr?.message}`);
    }

    // 2. Fetch AM name via RPC
    let amName: string | null = null;
    const { data: welcomeRows } = await supabase.rpc("get_client_welcome_info", {
      _client_id: client_id,
    });
    if (Array.isArray(welcomeRows) && welcomeRows.length > 0) {
      amName = (welcomeRows[0] as { am_name?: string }).am_name ?? null;
    }

    // 3. Read studio_config + studio_locked_at from onboarding_forms
    const { data: form, error: formErr } = await supabase
      .from("onboarding_forms")
      .select("studio_config, studio_locked_at")
      .eq("client_id", client_id)
      .single();

    if (formErr || !form) {
      throw new Error(`Onboarding form not found: ${formErr?.message}`);
    }

    const studioConfig = (form.studio_config ?? {}) as StudioConfig;
    const lockedAt: string = form.studio_locked_at ?? new Date().toISOString();

    console.log(`[design-locked] Loaded studio_config: palette=${!!studioConfig.palette}, legacy_colors=${!!studioConfig.colors}, appName=${studioConfig.appName}, language=${studioConfig.language}`);
    console.log(`[design-locked] Has logo URL: ${!!studioConfig.icons?.appNameLogo}`);
    console.log(`[design-locked] Manual overrides count: ${studioConfig.manualOverrides?.length ?? 0}`);

    // 4. Find Notion page ID (use cached or look up by client name)
    let notionPageId: string | null = client.notion_page_id ?? null;
    console.log(`[design-locked] Cached notion_page_id from clients table: ${notionPageId ?? "NOT_SET"}`);

    // Health-check: verify cached page is still accessible (not archived/trashed)
    if (notionPageId) {
      const accessible = await isNotionPageAccessible(notionPageId, NOTION_TOKEN);
      if (!accessible) {
        console.log(`[design-locked] Cached page stale - clearing and creating fresh`);
        notionPageId = null;
        await supabase.from("clients").update({ notion_page_id: null }).eq("id", client_id);
      }
    }

    if (!notionPageId) {
      console.log("[design-locked] notion_page_id not cached, querying Notion DB...");
      notionPageId = await findNotionPageId(client.name, NOTION_TOKEN);

      if (notionPageId) {
        await supabase.from("clients").update({ notion_page_id: notionPageId }).eq("id", client_id);
        console.log("[design-locked] Cached notion_page_id:", notionPageId);
      }
    }

    if (!notionPageId) {
      console.log(`[design-locked] No Notion page for "${client.name}" - creating one on-the-fly (form not yet submitted)`);
      notionPageId = await createNotionPage(client.name, client.country ?? null, client.drive_link ?? null, NOTION_TOKEN);
      if (notionPageId) {
        await supabase.from("clients").update({ notion_page_id: notionPageId }).eq("id", client_id);
        console.log("[design-locked] On-the-fly page created and cached:", notionPageId);
      } else {
        throw new Error(`Failed to create Notion page on-the-fly for client "${client.name}"`);
      }
    }

    // 5. Build blocks and append to Notion (Notion sync errors don't fail the lock)
    try {
      const blocks = buildAllBlocks(studioConfig, lockedAt, client.name, client_id, amName, submitted_by, submitter_email);
      console.log(`[design-locked] About to sync to Notion. Page ID: ${notionPageId}, blocks: ${blocks.length}`);
      await appendBlocksToPage(notionPageId, blocks, NOTION_TOKEN);

      const date = new Date(lockedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      await appendToNotesProperty(notionPageId, `Studio design locked on ${date}.`, NOTION_TOKEN);

      console.log("[design-locked] Notion sync complete for client", client.name);
    } catch (notionErr) {
      console.error("[design-locked] Notion sync failed (non-fatal):", {
        error: String(notionErr),
        client_id,
        notion_page_id: notionPageId,
      });
    }

    // 6. Update clients.studio_locked_at
    await supabase.from("clients").update({ studio_locked_at: lockedAt }).eq("id", client_id);

    const elapsedMs = Date.now() - fnStart;
    console.log(`[design-locked] Complete for client ${client.name}. Duration: ${elapsedMs}ms`);

    return new Response(JSON.stringify({ success: true, notion_page_id: notionPageId }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[design-locked] Error:", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
