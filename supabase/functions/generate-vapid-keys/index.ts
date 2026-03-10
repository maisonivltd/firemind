import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate ECDSA P-256 key pair for VAPID
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );

    const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

    // Convert JWK x,y to uncompressed public key (base64url)
    const publicKeyBase64url = `${publicKeyJwk.x}.${publicKeyJwk.y}`;
    
    // For web-push we need the raw keys
    // Public key: 04 || x || y (uncompressed point)
    const xBytes = base64urlToBytes(publicKeyJwk.x!);
    const yBytes = base64urlToBytes(publicKeyJwk.y!);
    const publicKeyBytes = new Uint8Array(65);
    publicKeyBytes[0] = 0x04;
    publicKeyBytes.set(xBytes, 1);
    publicKeyBytes.set(yBytes, 33);
    const vapidPublicKey = bytesToBase64url(publicKeyBytes);

    // Private key: just d
    const vapidPrivateKey = publicKeyJwk.d!;

    return new Response(JSON.stringify({
      vapidPublicKey,
      vapidPrivateKey,
      jwk: { public: publicKeyJwk, private: privateKeyJwk },
      instructions: "Store vapidPublicKey as VAPID_PUBLIC_KEY and vapidPrivateKey as VAPID_PRIVATE_KEY in secrets"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function base64urlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
