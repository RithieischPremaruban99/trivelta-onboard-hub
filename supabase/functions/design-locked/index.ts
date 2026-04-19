// Edge Function: design-locked
// Fires when a client locks their design in Trivelta Studio.
// 1. Reads studio_config from onboarding_forms
// 2. Finds the client's Notion page (by stored ID or DB query)
// 3. Appends a "Studio Config" section to the Notion page
// 4. Updates the Notes property to include lock confirmation
// 5. Stores notion_page_id + studio_locked_at back in clients table

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NOTION_DB_ID = "31aac1484e348067977dda1128916077";
const NOTION_API   = "https://api.notion.com/v1";
const NOTION_VER   = "2022-06-28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ── Types ────────────────────────────────────────────────────────────────── */

interface RequestBody {
  client_id: string;
}

interface StudioColors {
  primaryBg?: string;
  primary?: string;
  secondary?: string;
  primaryButton?: string;
  primaryButtonGradient?: string;
  wonGradient1?: string;
  wonGradient2?: string;
  boxGradient1?: string;
  boxGradient2?: string;
  headerGradient1?: string;
  headerGradient2?: string;
  lightText?: string;
  placeholderText?: string;
  [key: string]: string | undefined;
}

interface StudioIcons {
  appNameLogo?: string;
  topLeftAppIcon?: string;
  [key: string]: string | undefined;
}

interface StudioConfig {
  colors?: StudioColors;
  icons?: StudioIcons;
}

/* ── rgba → hex conversion ────────────────────────────────────────────────── */

function rgbaToHex(rgba: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return rgba;
  const r = parseInt(m[1]).toString(16).padStart(2, "0");
  const g = parseInt(m[2]).toString(16).padStart(2, "0");
  const b = parseInt(m[3]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function isDataUri(s: string): boolean {
  return s.startsWith("data:");
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
    callout: {
      rich_text: rt(content),
      icon: { emoji },
      color,
    },
  };
}

function bulletedListItem(richText: RichTextEntry[]) {
  return { type: "bulleted_list_item", bulleted_list_item: { rich_text: richText } };
}

/* ── Build color table rows ───────────────────────────────────────────────── */

// Color key → human-readable label
const COLOR_LABELS: Record<string, string> = {
  primaryBg:             "Background",
  primary:               "Primary",
  secondary:             "Secondary",
  primaryButton:         "Button",
  primaryButtonGradient: "Button Gradient",
  wonGradient1:          "Win Gradient 1",
  wonGradient2:          "Win Gradient 2",
  boxGradient1:          "Box Gradient 1",
  boxGradient2:          "Box Gradient 2",
  headerGradient1:       "Header Gradient 1",
  headerGradient2:       "Header Gradient 2",
  lightText:             "Light Text",
  placeholderText:       "Placeholder Text",
};

const COLOR_ORDER = [
  "primaryBg", "primary", "secondary",
  "primaryButton", "primaryButtonGradient",
  "wonGradient1", "wonGradient2",
  "boxGradient1", "boxGradient2",
  "headerGradient1", "headerGradient2",
  "lightText", "placeholderText",
];

function buildColorTableBlocks(colors: StudioColors): object[] {
  const rows: object[] = [];

  // Header row
  rows.push({
    type: "table_row",
    table_row: {
      cells: [
        rt("Color"),
        rt("Hex"),
        rt("RGBA"),
      ],
    },
  });

  for (const key of COLOR_ORDER) {
    const val = colors[key];
    if (!val) continue;
    const label = COLOR_LABELS[key] ?? key;
    const hex = rgbaToHex(val);
    rows.push({
      type: "table_row",
      table_row: {
        cells: [
          rt(label),
          rt(hex),
          rt(val, { code: true }),
        ],
      },
    });
  }

  const table = {
    type: "table",
    table: {
      table_width: 3,
      has_column_header: true,
      has_row_header: false,
      children: rows,
    },
  };

  return [table];
}

/* ── Build the full append block list ────────────────────────────────────── */

function buildDesignLockedBlocks(
  config: StudioConfig,
  lockedAt: string,
): object[] {
  const date = new Date(lockedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const blocks: object[] = [
    divider(),
    heading2("🎨 Studio Config – Design Locked"),
    paragraph(rt(`Locked on ${date} via Trivelta Studio`, { italic: true })),
    callout(
      "Client has locked their platform design. Colors and brand assets are finalised below.",
      "✅",
      "green_background",
    ),
  ];

  // Colors section
  if (config.colors && Object.keys(config.colors).length > 0) {
    blocks.push(heading3("Colors"));
    blocks.push(...buildColorTableBlocks(config.colors));
  }

  // Brand Assets section
  const hasLogo = config.icons?.appNameLogo && !isDataUri(config.icons.appNameLogo);
  const hasIcon = config.icons?.topLeftAppIcon && !isDataUri(config.icons.topLeftAppIcon);

  if (hasLogo || hasIcon) {
    blocks.push(heading3("Brand Assets"));
    if (hasLogo) {
      blocks.push(bulletedListItem(
        rtLink("App Name Logo", config.icons!.appNameLogo!),
      ));
    }
    if (hasIcon) {
      blocks.push(bulletedListItem(
        rtLink("Top-Left App Icon", config.icons!.topLeftAppIcon!),
      ));
    }
  }

  return blocks;
}

/* ── Notion: look up page by client name ─────────────────────────────────── */

async function findNotionPageId(
  clientName: string,
  notionToken: string,
): Promise<string | null> {
  const resp = await fetch(`${NOTION_API}/databases/${NOTION_DB_ID}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VER,
    },
    body: JSON.stringify({
      filter: {
        property: "Client Name",
        title: { equals: clientName },
      },
      page_size: 1,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    console.error("[design-locked] Notion DB query failed:", resp.status, body);
    return null;
  }

  const data = await resp.json();
  const page = data.results?.[0];
  return page?.id ?? null;
}

/* ── Notion: append blocks to page ──────────────────────────────────────── */

async function appendBlocksToPage(
  pageId: string,
  blocks: object[],
  notionToken: string,
): Promise<void> {
  // Notion limit: 100 blocks per request
  const CHUNK = 100;
  for (let i = 0; i < blocks.length; i += CHUNK) {
    const chunk = blocks.slice(i, i + CHUNK);
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
  }
}

/* ── Notion: get + update Notes property ───────────────────────────────── */

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

  // GET current notes
  const getResp = await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: "GET",
    headers,
  });

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
      properties: {
        Notes: { rich_text: rt(newNotes) },
      },
    }),
  });

  if (!patchResp.ok) {
    const body = await patchResp.text();
    console.error("[design-locked] Failed to update Notes:", body);
  }
}

/* ── Main handler ────────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
    if (!NOTION_TOKEN) throw new Error("NOTION_TOKEN not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body: RequestBody = await req.json();
    const { client_id } = body;
    if (!client_id) throw new Error("client_id is required");

    // 1. Read client record
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("name, notion_page_id")
      .eq("id", client_id)
      .single();

    if (clientErr || !client) {
      throw new Error(`Client not found: ${clientErr?.message}`);
    }

    // 2. Read studio_config + studio_locked_at from onboarding_forms
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

    // 3. Find Notion page ID (use cached or look up by client name)
    let notionPageId: string | null = client.notion_page_id ?? null;

    if (!notionPageId) {
      console.log("[design-locked] notion_page_id not cached, querying Notion DB...");
      notionPageId = await findNotionPageId(client.name, NOTION_TOKEN);

      if (notionPageId) {
        // Cache it back in clients table
        await supabase
          .from("clients")
          .update({ notion_page_id: notionPageId })
          .eq("id", client_id);
        console.log("[design-locked] Cached notion_page_id:", notionPageId);
      }
    }

    if (!notionPageId) {
      throw new Error(`No Notion page found for client "${client.name}"`);
    }

    // 4. Build and append design-locked blocks to Notion page
    const blocks = buildDesignLockedBlocks(studioConfig, lockedAt);
    console.log(`[design-locked] Appending ${blocks.length} blocks to page ${notionPageId}`);
    await appendBlocksToPage(notionPageId, blocks, NOTION_TOKEN);

    // 5. Append to Notes property
    const date = new Date(lockedAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    await appendToNotesProperty(
      notionPageId,
      `Studio design locked on ${date}.`,
      NOTION_TOKEN,
    );

    // 6. Update clients.studio_locked_at
    await supabase
      .from("clients")
      .update({ studio_locked_at: lockedAt })
      .eq("id", client_id);

    console.log("[design-locked] Done for client", client.name);

    return new Response(
      JSON.stringify({ success: true, notion_page_id: notionPageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[design-locked] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
