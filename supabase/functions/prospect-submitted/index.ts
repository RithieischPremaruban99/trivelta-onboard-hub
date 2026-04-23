// Edge Function: prospect-submitted
// Fires when a prospect submits their pre-onboarding form.
// 1. Loads prospect from DB
// 2. Finds or creates their Notion page (same DB as client tracker)
// 3. Appends a Pre-Onboarding section with all filled fields
// 4. Stores notion_page_id back in prospects table

import { createClient } from "npm:@supabase/supabase-js@2";

const NOTION_DB_ID = "31aac1484e348067977dda1128916077";
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VER = "2022-06-28";
const BLOCK_CHUNK = 90;
const RT_CHUNK = 1990;

import { makeCorsHeaders } from "../_shared/cors.ts";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface RequestBody {
  client_prospect_id: string;
  prospect_token: string;
  submitted_by?: string;
  submitter_email?: string | null;
}

interface ProspectRecord {
  id: string;
  legal_company_name: string;
  primary_contact_email: string;
  primary_contact_name: string | null;
  assigned_account_manager: string | null;
  notion_page_id: string | null;
  company_details: Record<string, unknown>;
  payment_providers: Record<string, unknown>;
  kyc_compliance: Record<string, unknown>;
  marketing_stack: Record<string, unknown>;
  technical_requirements: Record<string, unknown>;
  optional_features: Record<string, unknown>;
}

/* ── Prospect field registry (mirrors src/lib/prospect-fields.ts) ─────────── */

interface FieldDef {
  key: string;
  label: string;
  type: string;
}

interface SectionDef {
  title: string;
  storageKey: string;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    title: "Company & Contract",
    storageKey: "company_details",
    fields: [
      { key: "legal_name", label: "Legal Company Name", type: "text" },
      { key: "trading_name", label: "Trading Name / Brand", type: "text" },
      { key: "primary_contact_name", label: "Primary Contact Name", type: "text" },
      { key: "primary_contact_email", label: "Primary Contact Email", type: "email" },
      { key: "primary_contact_phone", label: "Primary Contact Phone", type: "phone" },
      { key: "business_country", label: "Business HQ Country", type: "text" },
      { key: "target_markets", label: "Target Markets", type: "multi_select" },
      { key: "current_platform", label: "Current Platform", type: "select" },
      { key: "launch_timeframe", label: "Expected Launch Timeframe", type: "select" },
      { key: "estimated_mau", label: "Estimated Monthly Active Users at Launch", type: "select" },
    ],
  },
  {
    title: "Payment Providers",
    storageKey: "payment_providers",
    fields: [
      { key: "psps_needed", label: "Payment Providers Needed", type: "multi_select" },
      { key: "current_psp_setup", label: "Current PSP Setup", type: "textarea" },
      { key: "expected_monthly_volume", label: "Expected Monthly Transaction Volume", type: "select" },
    ],
  },
  {
    title: "KYC & Compliance",
    storageKey: "kyc_compliance",
    fields: [
      { key: "kyc_tier", label: "KYC Tier Needed", type: "select" },
      { key: "kyc_provider", label: "Preferred KYC Provider", type: "text" },
      { key: "license_status", label: "Regulatory License Status", type: "select" },
      { key: "license_jurisdiction", label: "License Jurisdiction", type: "text" },
    ],
  },
  {
    title: "Marketing Stack",
    storageKey: "marketing_stack",
    fields: [
      { key: "braze_account", label: "Braze Account", type: "select" },
      { key: "infobip", label: "Infobip (SMS / Voice)", type: "select" },
      { key: "current_marketing_tool", label: "Current Marketing Automation Tool", type: "text" },
    ],
  },
  {
    title: "Technical Requirements",
    storageKey: "technical_requirements",
    fields: [
      { key: "geolocation_needed", label: "Geolocation / IP Check Needed", type: "boolean_tri" },
      { key: "geolocation_justification", label: "Geolocation Justification", type: "textarea" },
      { key: "dns_provider", label: "DNS Provider", type: "select" },
      { key: "domain_owned", label: "Domain Already Owned", type: "boolean_tri" },
      { key: "domain_name", label: "Domain Name", type: "text" },
      { key: "custom_integrations", label: "Custom Integrations Needed", type: "textarea" },
    ],
  },
  {
    title: "Additional Features",
    storageKey: "optional_features",
    fields: [
      { key: "virtual_sports", label: "Virtual Sports", type: "boolean_tri" },
      { key: "betslip_simulation", label: "Betslip Simulation / Pre-bet Preview", type: "boolean_tri" },
      { key: "custom_features", label: "Other Features Wanted", type: "textarea" },
      { key: "questions_for_us", label: "Questions for Trivelta", type: "textarea" },
    ],
  },
];

/* ── Notion rich-text helpers ─────────────────────────────────────────────── */

type RichTextEntry = {
  text: { content: string };
  annotations?: { bold?: boolean };
};

function splitRichText(content: string): RichTextEntry[] {
  const chunks: RichTextEntry[] = [];
  for (let i = 0; i < content.length; i += RT_CHUNK) {
    chunks.push({ text: { content: content.slice(i, i + RT_CHUNK) } });
  }
  return chunks.length > 0 ? chunks : [{ text: { content: "" } }];
}

function rt(content: string): RichTextEntry[] {
  return splitRichText(content);
}

function heading1(content: string) {
  return { type: "heading_1", heading_1: { rich_text: rt(content) } };
}

function heading2(content: string) {
  return { type: "heading_2", heading_2: { rich_text: rt(content) } };
}

function divider() {
  return { type: "divider", divider: {} };
}

function callout(content: string, emoji: string, color: string) {
  return {
    type: "callout",
    callout: { rich_text: rt(content), icon: { emoji }, color },
  };
}

function bulletedListItem(label: string, value: string) {
  return {
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [
        { text: { content: `${label}: ` }, annotations: { bold: true } },
        { text: { content: value } },
      ],
    },
  };
}

/* ── Block builder ────────────────────────────────────────────────────────── */

function buildProspectBlocks(
  prospect: ProspectRecord,
  submittedBy: string,
  submitterEmail: string | null,
): object[] {
  const now = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

  const submitterLine = submitterEmail
    ? `${submittedBy} (${submitterEmail})`
    : submittedBy;

  const blocks: object[] = [
    divider(),
    heading1("📋 Pre-Onboarding"),
    callout(
      `Submitted: ${now}  ·  By: ${submitterLine}`,
      "📋",
      "blue_background",
    ),
    divider(),
  ];

  for (const section of SECTIONS) {
    const sectionData = (prospect[section.storageKey as keyof ProspectRecord] ?? {}) as Record<string, unknown>;
    const filledFields = section.fields.filter((f) => {
      const v = sectionData[f.key];
      if (v === undefined || v === null) return false;
      if (typeof v === "string" && v.trim() === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    });

    if (filledFields.length === 0) continue;

    blocks.push(heading2(section.title));

    for (const field of filledFields) {
      const raw = sectionData[field.key];
      let displayValue: string;

      if (Array.isArray(raw)) {
        displayValue = raw.join(", ");
      } else if (field.type === "boolean_tri") {
        const map: Record<string, string> = { yes: "Yes", no: "No", maybe: "Not sure yet" };
        displayValue = map[raw as string] ?? String(raw);
      } else {
        displayValue = String(raw);
      }

      blocks.push(bulletedListItem(field.label, displayValue));
    }
  }

  return blocks;
}

/* ── Notion API helpers ───────────────────────────────────────────────────── */

async function isNotionPageAccessible(pageId: string, token: string): Promise<boolean> {
  const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VER },
  });
  if (!res.ok) {
    console.log(`[prospect-submitted] Cached page ${pageId} returned ${res.status} - treating as stale`);
    return false;
  }
  const data = await res.json();
  if (data.archived === true || data.in_trash === true) {
    console.log(`[prospect-submitted] Cached page ${pageId} is archived - treating as stale`);
    return false;
  }
  return true;
}

async function findNotionPageByName(name: string, token: string): Promise<string | null> {
  const resp = await fetch(`${NOTION_API}/databases/${NOTION_DB_ID}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VER,
    },
    body: JSON.stringify({
      filter: { property: "Client Name", title: { equals: name } },
      page_size: 1,
    }),
  });
  if (!resp.ok) {
    console.error("[prospect-submitted] Notion DB query failed:", resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  return data.results?.[0]?.id ?? null;
}

async function createNotionPage(prospect: ProspectRecord, token: string): Promise<string | null> {
  const country = (prospect.company_details?.business_country as string | undefined) ?? null;

  const properties: Record<string, unknown> = {
    "Client Name": { title: [{ text: { content: prospect.legal_company_name } }] },
    Status: { status: { name: "Prospect" } },
  };
  if (country) properties["Country"] = { select: { name: country } };

  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const initialChildren = [
    {
      type: "callout",
      callout: {
        rich_text: [{ text: { content: `⚠️ Pre-Onboarding Phase - ${prospect.legal_company_name} is a prospect (not yet under contract). Form submitted ${date}. Managed by Trivelta pre-onboarding system.` } }],
        icon: { emoji: "⚠️" },
        color: "yellow_background",
      },
    },
  ];

  try {
    const resp = await fetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VER,
      },
      body: JSON.stringify({ parent: { database_id: NOTION_DB_ID }, properties, children: initialChildren }),
    });
    if (!resp.ok) {
      console.error(`[prospect-submitted] Failed to create Notion page (${resp.status}):`, await resp.text());
      return null;
    }
    const page = await resp.json();
    console.log("[prospect-submitted] Created Notion page:", page.id);
    return page.id as string;
  } catch (e) {
    console.error("[prospect-submitted] Network error creating Notion page:", e);
    return null;
  }
}

async function appendBlocksToPage(pageId: string, blocks: object[], token: string): Promise<void> {
  for (let i = 0; i < blocks.length; i += BLOCK_CHUNK) {
    const chunk = blocks.slice(i, i + BLOCK_CHUNK);
    const resp = await fetch(`${NOTION_API}/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VER,
      },
      body: JSON.stringify({ children: chunk }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Notion append blocks failed (${resp.status}): ${body}`);
    }
    console.log(`[prospect-submitted] Appended blocks ${i + 1}-${Math.min(i + BLOCK_CHUNK, blocks.length)} of ${blocks.length}`);
  }
}

/* ── Main handler ────────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  const cors = makeCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
    if (!NOTION_TOKEN) throw new Error("NOTION_TOKEN not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body: RequestBody = await req.json();
    const { client_prospect_id, prospect_token, submitted_by = "prospect", submitter_email = null } = body;
    if (!client_prospect_id) throw new Error("client_prospect_id is required");
    if (!prospect_token)      throw new Error("prospect_token is required");

    const fnStart = Date.now();
    console.log(`[prospect-submitted] Triggered for prospect_id: ${client_prospect_id} at ${new Date().toISOString()}`);
    console.log(`[prospect-submitted] Submitted by: ${submitted_by} (${submitter_email ?? "unknown"})`);

    // 1. Load prospect - verify token matches and is not expired
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as unknown as { from: (t: string) => any; rpc: (fn: string, args: any) => any };
    const { data: prospect, error: prospectErr } = await supabaseAny
      .from("prospects")
      .select(
        "id, legal_company_name, primary_contact_email, primary_contact_name, assigned_account_manager, notion_page_id, company_details, payment_providers, kyc_compliance, marketing_stack, technical_requirements, optional_features, access_token, token_expires_at",
      )
      .eq("id", client_prospect_id)
      .single();

    if (prospectErr || !prospect) {
      throw new Error(`Prospect not found: ${prospectErr?.message}`);
    }

    // Validate token matches and has not expired
    if (prospect.access_token !== prospect_token) {
      console.warn(`[prospect-submitted] Token mismatch for prospect ${client_prospect_id}`);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (new Date(prospect.token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // 2. Resolve Notion page ID
    let notionPageId: string | null = (prospect as ProspectRecord).notion_page_id ?? null;
    console.log(`[prospect-submitted] Cached notion_page_id: ${notionPageId ?? "NOT_SET"}`);

    if (notionPageId) {
      const accessible = await isNotionPageAccessible(notionPageId, NOTION_TOKEN);
      if (!accessible) {
        notionPageId = null;
        await supabaseAny.from("prospects").update({ notion_page_id: null }).eq("id", client_prospect_id);
      }
    }

    if (!notionPageId) {
      notionPageId = await findNotionPageByName((prospect as ProspectRecord).legal_company_name, NOTION_TOKEN);
      if (notionPageId) {
        await supabaseAny.from("prospects").update({ notion_page_id: notionPageId }).eq("id", client_prospect_id);
        console.log("[prospect-submitted] Found and cached existing page:", notionPageId);
      }
    }

    if (!notionPageId) {
      notionPageId = await createNotionPage(prospect as ProspectRecord, NOTION_TOKEN);
      if (notionPageId) {
        await supabaseAny.from("prospects").update({ notion_page_id: notionPageId }).eq("id", client_prospect_id);
        console.log("[prospect-submitted] Created and cached new page:", notionPageId);
      } else {
        throw new Error(`Failed to create Notion page for prospect "${(prospect as ProspectRecord).legal_company_name}"`);
      }
    }

    // 3. Build and append Pre-Onboarding section blocks
    try {
      const blocks = buildProspectBlocks(prospect as ProspectRecord, submitted_by, submitter_email);
      console.log(`[prospect-submitted] Appending ${blocks.length} blocks to page ${notionPageId}`);
      await appendBlocksToPage(notionPageId, blocks, NOTION_TOKEN);
      console.log("[prospect-submitted] Notion sync complete for", (prospect as ProspectRecord).legal_company_name);
    } catch (notionErr) {
      console.error("[prospect-submitted] Notion sync failed (non-fatal):", String(notionErr));
      // Non-fatal - the submitted_at is already written by the frontend
    }

    // 4. Update notion_page_id in prospects table (idempotent)
    await supabaseAny
      .from("prospects")
      .update({ notion_page_id: notionPageId })
      .eq("id", client_prospect_id);

    const elapsedMs = Date.now() - fnStart;
    console.log(`[prospect-submitted] Complete. Duration: ${elapsedMs}ms`);

    return new Response(JSON.stringify({ notion_page_id: notionPageId, status: "ok" }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[prospect-submitted] Fatal error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
