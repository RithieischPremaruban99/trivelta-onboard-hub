import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { makeCorsHeaders } from "../_shared/cors.ts";

/**
 * invite-team-member
 *
 * Allows a client_owner (or admin/AE/assigned AM) to invite an additional
 * teammate to the same client's onboarding/studio.
 *
 *  • Validates the caller has access to the client
 *  • Sends a Supabase Auth invite email (magic-link style) redirecting to
 *    the client's onboarding URL
 *  • Pre-seeds the team_members row so RLS lets them in immediately
 *
 * Body: { clientId: string, email: string, name?: string }
 */
serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401, corsHeaders);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !caller?.email) return json({ error: "Unauthorized" }, 401, corsHeaders);

    const { clientId, email, name } = await req.json();
    if (!clientId || typeof clientId !== "string") {
      return json({ error: "clientId is required" }, 400, corsHeaders);
    }
    if (!email || typeof email !== "string") {
      return json({ error: "email is required" }, 400, corsHeaders);
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return json({ error: "invalid email" }, 400, corsHeaders);
    }

    // ── Access check: caller must be admin / AE, an assigned AM, or a team member ──
    const admin = createClient(supabaseUrl, serviceKey);

    const [{ data: roles }, { data: tm }, { data: cam }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", caller.id),
      admin
        .from("team_members")
        .select("client_role")
        .eq("client_id", clientId)
        .eq("email", caller.email.toLowerCase())
        .maybeSingle(),
      admin
        .from("client_account_managers")
        .select("am_email")
        .eq("client_id", clientId)
        .eq("am_email", caller.email.toLowerCase())
        .maybeSingle(),
    ]);

    const roleSet = new Set((roles ?? []).map((r) => r.role as string));
    const isStaff = roleSet.has("admin") || roleSet.has("account_executive");
    const isAssignedAM = roleSet.has("account_manager") && !!cam;
    const isOwner = tm?.client_role === "client_owner";
    const isMember = !!tm;

    if (!isStaff && !isAssignedAM && !isOwner && !isMember) {
      return json({ error: "Forbidden" }, 403, corsHeaders);
    }

    // ── Send Supabase Auth invite (idempotent) ──
    const origin = req.headers.get("Origin") ?? "https://trivelta-onboard-hub.lovable.app";
    const redirectTo = `${origin}/onboarding/${clientId}/auth`;

    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      { data: { full_name: name ?? null, invited_to_client_id: clientId }, redirectTo },
    );

    let inviteStatus: "sent" | "already_active" | "resent" = "sent";
    let invitedUserId: string | null = inviteData?.user?.id ?? null;

    if (inviteErr) {
      const msg = inviteErr.message.toLowerCase();
      const isDup =
        (inviteErr as { status?: number }).status === 422 ||
        msg.includes("already registered") ||
        msg.includes("already been registered") ||
        msg.includes("email_exists");

      if (!isDup) {
        console.error("[invite-team-member] invite error:", inviteErr);
        return json({ error: inviteErr.message }, 400, corsHeaders);
      }

      // User exists — try to send a magic link instead so they can land on this client
      const { error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo },
      });
      inviteStatus = linkErr ? "already_active" : "resent";
    }

    // ── Pre-seed team_members row (idempotent via unique constraint) ──
    const { error: tmErr } = await admin
      .from("team_members")
      .upsert(
        {
          client_id: clientId,
          email: normalizedEmail,
          name: name ?? null,
          client_role: "client_member",
        },
        { onConflict: "client_id,email" },
      );
    if (tmErr) console.warn("[invite-team-member] team_members upsert:", tmErr.message);

    return json(
      { ok: true, status: inviteStatus, user_id: invitedUserId, email: normalizedEmail },
      200,
      corsHeaders,
    );
  } catch (err) {
    console.error("[invite-team-member] unhandled:", err);
    return json({ error: String(err) }, 500, makeCorsHeaders(req));
  }
});

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
