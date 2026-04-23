/**
 * UNUSED AS OF 2026-04-23
 * Replaced by manual drag-drop flow (client opens drive_link, drops ZIP themselves).
 * Keep for future Workload Identity Federation approach if re-enabled.
 */

/**
 * Edge Function: upload-landing-pages-to-drive
 *
 * Uploads 4 generated HTML files to the client's Google Drive folder.
 * Uses a Trivelta service account (GOOGLE_SERVICE_ACCOUNT_KEY env var).
 *
 * POST /functions/v1/upload-landing-pages-to-drive
 * Auth: verify_jwt=false + internal callerClient.auth.getUser() check
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { makeCorsHeaders } from "../_shared/cors.ts";

// ── Types ──────────────────────────────────────────────────────────────────

interface UploadRequest {
  clientId: string;
  pages: {
    index: string;
    terms: string;
    privacy: string;
    rg: string;
  };
  brandName: string;
  logoUrl?: string;
}

// ── JWT signing (service account → Google OAuth token) ────────────────────

async function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
  // Strip PEM headers/footers and decode base64
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function base64url(data: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlStr(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function getGoogleAccessToken(): Promise<string> {
  const rawKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
  if (!rawKey) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");

  const keyData = JSON.parse(rawKey);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: keyData.client_email,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const headerB64 = base64urlStr(JSON.stringify(header));
  const claimB64 = base64urlStr(JSON.stringify(claim));
  const signingInput = `${headerB64}.${claimB64}`;

  const privateKey = await importRsaPrivateKey(keyData.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput),
  );

  const jwt = `${signingInput}.${base64url(signature)}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${body}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token as string;
}

// ── Drive upload ───────────────────────────────────────────────────────────

async function createDriveFolder(
  accessToken: string,
  name: string,
  parentId: string,
): Promise<string> {
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  if (!res.ok) throw new Error(`createFolder failed: ${await res.text()}`);
  const data = await res.json();
  return data.id as string;
}

async function uploadFileToDrive(
  accessToken: string,
  filename: string,
  content: string,
  parentFolderId: string,
): Promise<{ id: string; name: string }> {
  const boundary = "trivelta314159";
  const metadata = JSON.stringify({
    name: filename,
    parents: [parentFolderId],
    mimeType: "text/html",
  });

  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    metadata +
    `\r\n--${boundary}\r\n` +
    `Content-Type: text/html\r\n\r\n` +
    content +
    `\r\n--${boundary}--`;

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!res.ok) throw new Error(`uploadFile(${filename}) failed: ${await res.text()}`);
  return res.json();
}

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ── Internal auth check ──────────────────────────────────────────────────
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const input: UploadRequest = await req.json();
    const { clientId, pages, brandName } = input;

    // ── Fetch client's drive_link via service role ──────────────────────────
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: client, error: clientErr } = await adminClient
      .from("clients")
      .select("drive_link, name")
      .eq("id", clientId)
      .single();

    if (clientErr || !client) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!client.drive_link) {
      return new Response(
        JSON.stringify({ error: "No Drive folder configured for this client" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Extract Drive folder ID ─────────────────────────────────────────────
    const folderIdMatch = client.drive_link.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (!folderIdMatch) {
      return new Response(
        JSON.stringify({ error: "Invalid Drive folder URL — expected /folders/ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const rootFolderId = folderIdMatch[1];

    // ── Get Google access token ─────────────────────────────────────────────
    const accessToken = await getGoogleAccessToken();

    // ── Create dated subfolder ──────────────────────────────────────────────
    const dateStr = new Date().toISOString().split("T")[0];
    const subfolderName = `landing-pages-${brandName.replace(/[^a-zA-Z0-9]/g, "-")}-${dateStr}`;
    const subFolderId = await createDriveFolder(accessToken, subfolderName, rootFolderId);

    // ── Upload 4 HTML files ─────────────────────────────────────────────────
    const filesToUpload = [
      { name: "index.html", content: pages.index },
      { name: "terms.html", content: pages.terms },
      { name: "privacy.html", content: pages.privacy },
      { name: "responsible-gambling.html", content: pages.rg },
    ];

    const uploadResults = [];
    for (const file of filesToUpload) {
      const result = await uploadFileToDrive(accessToken, file.name, file.content, subFolderId);
      uploadResults.push(result);
    }

    console.log(
      `[upload-to-drive] Uploaded ${uploadResults.length} files to folder ${subFolderId} for client ${clientId}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        subFolderId,
        folderUrl: `https://drive.google.com/drive/folders/${subFolderId}`,
        files: uploadResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[upload-to-drive] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
