// supabase/functions/_shared/notion-clients.ts
//
// Shared lib for Trivelta Notion Clients-DB automation (v2 flow).
// Used by: prospect-submitted-v2, contract-signed, go-live.
//
// Owner: Rithieisch Premaruban — Trivelta Suite
// Spec reference: "Trivelta Clients-DB Automatisierung" session 2026-04-24

// ─────────────────────────────────────────────────────────────
// Constants (single source of truth — do NOT duplicate in handlers)
// ─────────────────────────────────────────────────────────────

export const CLIENTS_DB_ID = "31aac148-4e34-8067-977d-da1128916077";
export const CLIENTS_DATA_SOURCE_ID = "31aac148-4e34-80c3-b47e-000bf393691d";
export const ONBOARDING_TASKS_DS_ID = "dcbf52b7-8181-4970-a891-60af3d2e8f0b";
export const TEMPLATE_PAGE_ID = "34cac148-4e34-810d-b6d0-d48794293cd3";

// Trivelta AM Notion User IDs
export const AIDAN = "318d872b-594c-816c-802b-00020900bb8f";
export const DAVI = "318d872b-594c-81bf-a1fd-00026792dc67";
export const ALEX = "318d872b-594c-815c-a2b2-00020f6b69d4";

// Notion API
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

// ─────────────────────────────────────────────────────────────
// AM Routing — core business rule
// ─────────────────────────────────────────────────────────────
//
// Primary AM is ALWAYS Aidan (Head AM).
// Account Manager (secondary) is ALWAYS both Davi AND Alex — for every
// prospect, regardless of country/region. No conditional routing.

export type AmRouting = {
  primary: string[]; // always [AIDAN]
  secondary: string[]; // always [DAVI, ALEX]
};

export function routeAccountManagers(_countryValue?: string | null | undefined): AmRouting {
  return { primary: [AIDAN], secondary: [DAVI, ALEX] };
}

// ─────────────────────────────────────────────────────────────
// Notion API wrapper with defensive error handling
// ─────────────────────────────────────────────────────────────

export class NotionError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: string,
  ) {
    super(message);
    this.name = "NotionError";
  }
}

async function notionRequest(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  token: string,
  body?: unknown,
): Promise<any> {
  const response = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new NotionError(
      `Notion API ${method} ${path} failed: ${response.status}`,
      response.status,
      errorText,
    );
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────
// Template body cache (cold-start fetch + 1h TTL)
// ─────────────────────────────────────────────────────────────
//
// The Notion REST API does NOT support `template_id` on pages.create
// (it's MCP-only). Workaround: fetch the template page body once per
// cold start, cache in memory, reuse across invocations.
// Template edits in Notion propagate within 1h without redeploying.

type CachedTemplate = {
  blocks: unknown[];
  fetchedAt: number;
};

let templateCache: CachedTemplate | null = null;
const TEMPLATE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getTemplateBody(token: string): Promise<unknown[]> {
  const now = Date.now();

  if (templateCache && now - templateCache.fetchedAt < TEMPLATE_TTL_MS) {
    return templateCache.blocks;
  }

  // Fetch template page children (paginated)
  const allBlocks: unknown[] = [];
  let cursor: string | undefined = undefined;

  do {
    const query = cursor ? `?start_cursor=${cursor}&page_size=100` : "?page_size=100";
    const resp: any = await notionRequest(
      `/blocks/${TEMPLATE_PAGE_ID}/children${query}`,
      "GET",
      token,
    );
    allBlocks.push(...(resp.results ?? []));
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);

  // Strip Notion-internal fields that cannot be reused on create
  const cleanedBlocks = allBlocks.map(stripBlockForCreate);

  templateCache = { blocks: cleanedBlocks, fetchedAt: now };
  return cleanedBlocks;
}

function stripBlockForCreate(block: any): any {
  const {
    id,
    created_time,
    last_edited_time,
    created_by,
    last_edited_by,
    archived,
    in_trash,
    parent,
    has_children,
    ...rest
  } = block;

  // Recursively strip children if present (shouldn't be in a children list
  // from /blocks/{id}/children, but defensive)
  if (rest[rest.type]?.children) {
    rest[rest.type].children = rest[rest.type].children.map(stripBlockForCreate);
  }

  return rest;
}

// ─────────────────────────────────────────────────────────────
// Property builders — type-safe Notion property shapes
// ─────────────────────────────────────────────────────────────

export const props = {
  title: (text: string) => ({
    title: [{ type: "text" as const, text: { content: text.slice(0, 2000) } }],
  }),

  richText: (text: string) => ({
    rich_text: text
      ? [{ type: "text" as const, text: { content: text.slice(0, 2000) } }]
      : [],
  }),

  email: (email: string | null | undefined) => ({
    email: email && email.includes("@") ? email : null,
  }),

  url: (url: string | null | undefined) => ({
    url: url && (url.startsWith("http://") || url.startsWith("https://")) ? url : null,
  }),

  select: (option: string | null | undefined) => ({
    select: option ? { name: option } : null,
  }),

  multiSelect: (options: string[]) => ({
    multi_select: options.filter(Boolean).map((name) => ({ name })),
  }),

  people: (userIds: string[]) => ({
    people: userIds.filter(Boolean).map((id) => ({ object: "user" as const, id })),
  }),

  date: (iso: string | null | undefined) => ({
    date: iso ? { start: iso } : null,
  }),

  number: (n: number | null | undefined) => ({
    number: typeof n === "number" ? n : null,
  }),

  status: (statusName: string) => ({
    status: { name: statusName },
  }),
};

// ─────────────────────────────────────────────────────────────
// Country label → Notion select option mapping
// ─────────────────────────────────────────────────────────────
//
// The DB has a Country select property. We normalize raw jurisdiction
// values (e.g. "brazil", "south_africa_wc") to the existing Country
// options. Anything unknown → null (we do NOT create new options
// automatically to avoid schema pollution).

const COUNTRY_DISPLAY_MAP: Record<string, string> = {
  nigeria: "Nigeria",
  south_africa_wc: "South Africa",
  south_africa_other: "South Africa",
  kenya: "Kenya",
  ghana: "Ghana",
  tanzania: "Tanzania",
  uganda: "Uganda",
  angola: "Angola",
  mozambique: "Mozambique",
  zimbabwe: "Zimbabwe",
  zambia: "Zambia",
  namibia: "Namibia",
  rwanda: "Rwanda",
  ethiopia: "Ethiopia",
  senegal: "Senegal",
  ivory_coast: "Côte d'Ivoire",
  cameroon: "Cameroon",
  drc: "DRC",
  botswana: "Botswana",
  egypt: "Egypt",
  morocco: "Morocco",
  mexico: "Mexico",
  brazil: "Brazil",
  argentina: "Argentina",
  colombia: "Colombia",
  peru: "Peru",
  chile: "Chile",
  dominican_republic: "Dominican Republic",
  panama: "Panama",
  ecuador: "Ecuador",
  uruguay: "Uruguay",
  bolivia: "Bolivia",
  paraguay: "Paraguay",
  costa_rica: "Costa Rica",
  spain: "Spain",
  portugal: "Portugal",
  curacao: "Curaçao",
  malta: "Malta",
  anjouan: "Anjouan",
  isle_of_man: "Isle of Man",
  gibraltar: "Gibraltar",
  kahnawake: "Canada",
};

export function normalizeCountryForNotion(countryValue: string | null | undefined): string | null {
  if (!countryValue) return null;
  const key = countryValue.toLowerCase().trim();
  return COUNTRY_DISPLAY_MAP[key] ?? null;
}

// ─────────────────────────────────────────────────────────────
// Page lookup by Client ID (idempotency for retries)
// ─────────────────────────────────────────────────────────────
//
// When Contract Signed or Go Live fires, we need to find the existing
// Notion page for this client. We store the Notion Page ID in our
// Supabase clients table (client.notion_page_id) for fast lookup.
// This helper is a fallback: query the DB by Trivelta Client ID property.

export async function findPageByTriveltaClientId(
  token: string,
  triveltaClientId: string,
): Promise<string | null> {
  const resp: any = await notionRequest(
    `/databases/${CLIENTS_DB_ID}/query`,
    "POST",
    token,
    {
      filter: {
        property: "Trivelta Client ID",
        rich_text: { equals: triveltaClientId },
      },
      page_size: 1,
    },
  );

  return resp.results?.[0]?.id ?? null;
}

// ─────────────────────────────────────────────────────────────
// Core ops — create page, update page, append blocks
// ─────────────────────────────────────────────────────────────

export async function createClientPage(
  token: string,
  properties: Record<string, unknown>,
  blocks: unknown[],
): Promise<{ pageId: string; url: string }> {
  // Notion has a 100-block limit on create. Create with first 90,
  // then append the rest in chunks.
  const INITIAL_BLOCK_LIMIT = 90;
  const initial = blocks.slice(0, INITIAL_BLOCK_LIMIT);
  const remaining = blocks.slice(INITIAL_BLOCK_LIMIT);

  const created: any = await notionRequest("/pages", "POST", token, {
    parent: { database_id: CLIENTS_DB_ID },
    properties,
    children: initial,
  });

  if (remaining.length > 0) {
    await appendBlocks(token, created.id, remaining);
  }

  return { pageId: created.id, url: created.url };
}

export async function updatePageProperties(
  token: string,
  pageId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  await notionRequest(`/pages/${pageId}`, "PATCH", token, { properties });
}

export async function appendBlocks(
  token: string,
  pageId: string,
  blocks: unknown[],
): Promise<void> {
  const CHUNK = 90;
  for (let i = 0; i < blocks.length; i += CHUNK) {
    await notionRequest(`/blocks/${pageId}/children`, "PATCH", token, {
      children: blocks.slice(i, i + CHUNK),
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Build the properties object for a fresh Prospect page
// ─────────────────────────────────────────────────────────────

export type ProspectPayload = {
  triveltaClientId: string;
  clientName: string;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  website?: string | null;
  country?: string | null; // raw jurisdiction value
  driveLink?: string | null;
};

export function buildProspectProperties(p: ProspectPayload): Record<string, unknown> {
  const routing = routeAccountManagers(p.country);

  return {
    "Client Name": props.title(p.clientName),
    "Status": props.status("Prospect"),
    "Onboarding Phase": props.select("Pre-Sale"),
    "Primary AM": props.people(routing.primary),
    "Account Manager": props.people(routing.secondary),
    "Country": props.select(normalizeCountryForNotion(p.country)),
    "Primary Contact": props.richText(p.primaryContactName ?? ""),
    "Contact Email": props.email(p.primaryContactEmail),
    "Website": props.url(p.website),
    "Drive": props.url(p.driveLink),
    "Trivelta Client ID": props.richText(p.triveltaClientId),
  };
}
