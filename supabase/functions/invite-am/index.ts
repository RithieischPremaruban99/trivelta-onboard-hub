import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── 1. Verify caller is authenticated ──────────────────────────────────
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

    // ── 2. Verify caller is admin or account_executive ─────────────────────
    const { data: roleRow } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (!roleRow || (roleRow.role !== "admin" && roleRow.role !== "account_executive")) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. Parse request ───────────────────────────────────────────────────
    const { email, name } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── 4. Invite via Supabase Auth admin API ──────────────────────────────
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: inviteData, error: inviteErr } =
      await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: { full_name: name ?? null },
      });

    if (inviteErr) {
      console.error("[invite-am] invite error:", inviteErr);
      return new Response(JSON.stringify({ error: inviteErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = inviteData.user.id;

    // ── 5. Upsert user_roles ───────────────────────────────────────────────
    const { error: roleErr } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role: "account_manager" }, { onConflict: "user_id" });
    if (roleErr) console.warn("[invite-am] user_roles upsert failed:", roleErr.message);

    // ── 6. Upsert role_assignments (display list) ──────────────────────────
    const { error: raErr } = await adminClient
      .from("role_assignments")
      .upsert(
        { user_id: userId, email: normalizedEmail, name: name ?? null, role: "account_manager" },
        { onConflict: "user_id" },
      );
    if (raErr) console.warn("[invite-am] role_assignments upsert failed:", raErr.message);

    return new Response(JSON.stringify({ ok: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[invite-am] unhandled error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
