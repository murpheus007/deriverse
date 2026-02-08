import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response("Missing Supabase env", { status: 500, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const body = await req.json();
  const walletAddress = body?.wallet_address as string | undefined;
  if (!walletAddress) {
    return new Response("wallet_address required", { status: 400, headers: corsHeaders });
  }

  const nonce = crypto.randomUUID();
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const message = [
    "Deriverse Analytics",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expires At: ${expiresAt}`
  ].join("\n");

  const { error: insertError } = await supabase.from("auth_nonces").insert({
    user_id: userData.user.id,
    wallet_address: walletAddress,
    nonce,
    expires_at: expiresAt
  });

  if (insertError) {
    return new Response(insertError.message, { status: 400, headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ nonce, message, expires_at: expiresAt }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
