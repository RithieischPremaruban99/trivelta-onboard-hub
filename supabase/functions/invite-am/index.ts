import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { makeCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req);
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

    // ── 4. Invite via Supabase Auth admin API — idempotent ─────────────────
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: inviteData, error: inviteErr } =
      await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: { full_name: name ?? null },
      });

    let userId: string;
    let responseStatus: "sent" | "resent" | "already_active";

    if (inviteErr) {
      // Detect email_exists (Supabase GoTrue returns 422 "User already registered")
      const isEmailExists =
        (inviteErr as any).status === 422 ||
        inviteErr.message.toLowerCase().includes("already registered") ||
        inviteErr.message.toLowerCase().includes("email_exists") ||
        inviteErr.message.toLowerCase().includes("already been registered");

      if (!isEmailExists) {
        console.error("[invite-am] invite error:", inviteErr);
        return new Response(JSON.stringify({ error: inviteErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find the existing user by listing (small internal user base)
      const { data: listData, error: listErr } = await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });
      if (listErr) {
        console.error("[invite-am] listUsers error:", listErr);
        return new Response(JSON.stringify({ error: listErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const existingUser = listData.users.find((u) => u.email === normalizedEmail);
      if (!existingUser) {
        // Shouldn't happen — email_exists but user not found
        return new Response(JSON.stringify({ error: inviteErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = existingUser.id;

      if (existingUser.email_confirmed_at) {
        // User already confirmed — nothing to resend, just ensure roles are set
        responseStatus = "already_active";
      } else {
        // Invited but unconfirmed — resend the invite email
        const { error: resendErr } = await adminClient.auth.admin.generateLink({
          type: "invite",
          email: normalizedEmail,
          options: { data: { full_name: name ?? null } },
        });
        if (resendErr) {
          console.error("[invite-am] generateLink resend error:", resendErr);
          return new Response(JSON.stringify({ error: resendErr.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        responseStatus = "resent";
      }
    } else {
      userId = inviteData.user.id;
      responseStatus = "sent";
    }

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

    return new Response(JSON.stringify({ ok: true, status: responseStatus, user_id: userId }), {
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
