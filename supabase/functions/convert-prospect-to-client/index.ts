import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ── Notion helpers ─────────────────────────────────────────────────────── */

async function appendContractSigned(
  notionToken: string,
  pageId: string,
  convertedBy: string,
): Promise<void> {
  const now = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const blocks = [
    { type: "divider", divider: {} },
    {
      type: "heading_1",
      heading_1: {
        rich_text: [
          { type: "text", text: { content: "🎯 Contract Signed - Client Active" } },
        ],
      },
    },
    {
      type: "callout",
      callout: {
        rich_text: [
          {
            type: "text",
            text: { content: `Converted by ${convertedBy} · ${now}` },
          },
        ],
        icon: { type: "emoji", emoji: "✅" },
        color: "green_background",
      },
    },
    {
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: {
              content:
                "Client now has access to the full onboarding portal. Pre-onboarding data has been transferred to the onboarding form.",
            },
          },
        ],
      },
    },
  ];

  const cleanId = pageId.replace(/-/g, "");
  const resp = await fetch(`https://api.notion.com/v1/blocks/${cleanId}/children`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({ children: blocks }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.warn("[convert-prospect] Notion append failed:", resp.status, txt);
  }
}

/* ── Main handler ───────────────────────────────────────────────────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const notionToken = Deno.env.get("NOTION_TOKEN") ?? "";

    // ── 1. Verify caller ──────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (
      !roleRow ||
      (roleRow.role !== "admin" &&
        roleRow.role !== "account_executive" &&
        roleRow.role !== "account_manager")
    ) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Parse request ──────────────────────────────────────────────────
    const { prospect_id, submitted_by, submitter_email, app_origin } = await req.json();

    if (!prospect_id) {
      return new Response(JSON.stringify({ error: "prospect_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // ── 3. Load prospect ──────────────────────────────────────────────────
    const { data: prospect, error: prospectErr } = await adminClient
      .from("prospects")
      .select("*")
      .eq("id", prospect_id)
      .maybeSingle();

    if (prospectErr || !prospect) {
      return new Response(JSON.stringify({ error: "Prospect not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (prospect.converted_to_client_id) {
      return new Response(
        JSON.stringify({ error: "Prospect already converted", client_id: prospect.converted_to_client_id }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 4. Create client record ───────────────────────────────────────────
    const companyDetails = (prospect.company_details as Record<string, unknown>) ?? {};
    const country =
      (companyDetails.business_country as string) ??
      (companyDetails.country as string) ??
      null;

    const { data: newClient, error: clientErr } = await adminClient
      .from("clients")
      .insert({
        name: prospect.legal_company_name,
        country,
        primary_contact_email: prospect.primary_contact_email,
        studio_access: false,
        status: "onboarding",
      })
      .select("id")
      .single();

    if (clientErr || !newClient) {
      console.error("[convert-prospect] Create client failed:", clientErr);
      return new Response(JSON.stringify({ error: clientErr?.message ?? "Failed to create client" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = newClient.id;

    // ── 5. Transfer all prospect AMs to new client ────────────────────────
    const { data: prospectAMs } = await adminClient
      .from("prospect_account_managers")
      .select("am_email")
      .eq("prospect_id", prospect_id);

    const amEmails: string[] = (prospectAMs ?? []).map((r: { am_email: string }) => r.am_email);

    // Fall back to old single-column if junction table has no rows yet
    if (amEmails.length === 0 && prospect.assigned_account_manager) {
      amEmails.push(prospect.assigned_account_manager);
    }

    if (amEmails.length > 0) {
      await adminClient.from("client_account_managers").insert(
        amEmails.map((am_email) => ({ client_id: clientId, am_email })),
      );
    }

    // ── 6. Create onboarding_form with pre-filled data ────────────────────
    const preFillData = {
      company_details: prospect.company_details ?? {},
      payment_providers: prospect.payment_providers ?? {},
      kyc_compliance: prospect.kyc_compliance ?? {},
      marketing_stack: prospect.marketing_stack ?? {},
      technical_requirements: prospect.technical_requirements ?? {},
      optional_features: prospect.optional_features ?? {},
    };

    await adminClient.from("onboarding_forms").upsert(
      {
        client_id: clientId,
        data: preFillData,
        studio_locked: false,
      },
      { onConflict: "client_id" },
    );

    // ── 7. Mark prospect as converted + invalidate magic link ─────────────
    const now = new Date().toISOString();
    await adminClient.from("prospects").update({
      converted_to_client_id: clientId,
      converted_at: now,
      contract_status: "signed",
      access_token: null,
    }).eq("id", prospect_id);

    // ── 8. Append "Contract Signed" to Notion page ────────────────────────
    if (notionToken && prospect.notion_page_id) {
      await appendContractSigned(
        notionToken,
        prospect.notion_page_id,
        submitter_email ?? caller.email ?? "unknown",
      ).catch((e) => console.warn("[convert-prospect] Notion append threw:", e));
    }

    // ── 9. Generate client invite link ────────────────────────────────────
    const origin = app_origin ?? "https://trivelta.com";
    const redirectTo = `${origin}/onboarding/${clientId}/form`;

    let inviteLink = `${origin}/onboarding/${clientId}`;
    try {
      const { data: linkData, error: linkErr } =
        await adminClient.auth.admin.generateLink({
          type: "magiclink",
          email: prospect.primary_contact_email,
          options: { redirectTo },
        });
      if (!linkErr && linkData?.properties?.action_link) {
        inviteLink = linkData.properties.action_link;
      }
    } catch (e) {
      console.warn("[convert-prospect] generateLink failed, using base URL:", e);
    }

    // ── 10. Log activity ──────────────────────────────────────────────────
    await adminClient.from("client_activity_log").insert({
      client_id: clientId,
      prospect_id: prospect_id,
      actor_user_id: caller.id,
      actor_email: submitter_email ?? caller.email ?? "",
      actor_role: roleRow.role,
      action: "prospect_converted_to_client",
      details: {
        prospect_id,
        prospect_name: prospect.legal_company_name,
        submitted_by: submitted_by ?? "admin",
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        client_id: clientId,
        invite_link: inviteLink,
        client_email: prospect.primary_contact_email,
        client_name: prospect.legal_company_name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[convert-prospect] unhandled error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
