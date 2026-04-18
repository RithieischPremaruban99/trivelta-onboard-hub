// Edge function: notify-submission
// Stub: receives the submitted onboarding form payload and logs it.
// Wire this up to Notion (or Slack/email) later by adding a NOTION_API_KEY secret
// and replacing the TODO block below.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { client_id, client_name, submitted_at, data } = payload ?? {};

    console.log("[notify-submission] Onboarding form submitted", {
      client_id,
      client_name,
      submitted_at,
      keys: data ? Object.keys(data) : [],
    });

    // TODO: integrate Notion API
    // const NOTION_API_KEY = Deno.env.get("NOTION_API_KEY");
    // if (NOTION_API_KEY) { await fetch("https://api.notion.com/v1/pages", { ... }); }

    return new Response(
      JSON.stringify({ ok: true, message: "Submission received" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[notify-submission] Error", err);
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
