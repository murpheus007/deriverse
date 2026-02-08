import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bs58 from "https://esm.sh/bs58@5.0.0";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import { corsHeaders } from "../_shared/cors.ts";

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response("Missing Supabase env", { status: 500, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const body = await req.json();
  const walletAddress = body?.wallet_address as string | undefined;
  const nonce = body?.nonce as string | undefined;
  const message = body?.message as string | undefined;
  const signature = body?.signature as string | undefined;

  if (!walletAddress || !nonce || !message || !signature) {
    return new Response("Missing required fields", { status: 400, headers: corsHeaders });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: nonceRow, error: nonceError } = await serviceClient
    .from("auth_nonces")
    .select("id, expires_at, used_at")
    .eq("user_id", userData.user.id)
    .eq("wallet_address", walletAddress)
    .eq("nonce", nonce)
    .is("used_at", null)
    .maybeSingle();

  if (nonceError || !nonceRow) {
    return new Response("Invalid or expired nonce", { status: 400, headers: corsHeaders });
  }

  if (new Date(nonceRow.expires_at).getTime() < Date.now()) {
    return new Response("Nonce expired", { status: 400, headers: corsHeaders });
  }

  const publicKeyBytes = bs58.decode(walletAddress);
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = fromBase64(signature);

  const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  if (!verified) {
    return new Response("Signature verification failed", { status: 401, headers: corsHeaders });
  }

  const { data: walletRow, error: walletError } = await serviceClient
    .from("wallets")
    .upsert({ address: walletAddress }, { onConflict: "address" })
    .select("id,address")
    .single();
  if (walletError || !walletRow) {
    return new Response(walletError?.message ?? "Failed to upsert wallet", { status: 400, headers: corsHeaders });
  }

  const { data: existingLinks } = await serviceClient
    .from("user_wallets")
    .select("wallet_id,is_primary")
    .eq("user_id", userData.user.id);
  const hasPrimary = (existingLinks ?? []).some((row) => row.is_primary);
  const existingLink = (existingLinks ?? []).find((row) => row.wallet_id === walletRow.id);
  const isPrimary = existingLink?.is_primary ?? !hasPrimary;

  const { data: linkRow, error: linkError } = await serviceClient
    .from("user_wallets")
    .upsert(
      {
        user_id: userData.user.id,
        wallet_id: walletRow.id,
        is_primary: isPrimary
      },
      { onConflict: "user_id,wallet_id" }
    )
    .select("label,is_primary")
    .single();

  if (linkError || !linkRow) {
    return new Response(linkError?.message ?? "Failed to link wallet", { status: 400, headers: corsHeaders });
  }

  await serviceClient
    .from("auth_nonces")
    .update({ used_at: new Date().toISOString() })
    .eq("id", nonceRow.id);

  return new Response(
    JSON.stringify({
      wallet_id: walletRow.id,
      address: walletRow.address,
      label: linkRow.label,
      is_primary: linkRow.is_primary
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
