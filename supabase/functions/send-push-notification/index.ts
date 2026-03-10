import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID keys generated for this project
const VAPID_PUBLIC_KEY = "BIfsxpVPWWrVt1V13zYT10sjgIkEpHpVbca7SL8-KRZoMU2Ii173g-oJaoytziVflkEZBhQ1N0dRsXdoq5HJG_E";
const VAPID_PRIVATE_KEY_JWK = {
  alg: "ES256", crv: "P-256", kty: "EC",
  d: "oHDNjXKsDgpvqH6a2Wq9XX1Fhv2UL8pZLG40KQDHEGA",
  x: "h-zGlU9ZatW3VXXfNhPXSyOAiQSkelVtxrtIvz4pFmg",
  y: "MU2Ii173g-oJaoytziVflkEZBhQ1N0dRsXdoq5HJG_E",
};

const VAPID_SUBJECT = "mailto:admin@firemind.app";

function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - b64.length % 4) % 4);
  const bin = atob(b64 + pad);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createVapidJwt(audience: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 86400, sub: VAPID_SUBJECT };

  const encodedHeader = bytesToBase64url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = bytesToBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "jwk", VAPID_PRIVATE_KEY_JWK,
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s
  const sigBytes = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigBytes.length === 64) {
    rawSig = sigBytes;
  } else {
    // DER format: parse r and s
    const r = extractDerInt(sigBytes, 3);
    const sOffset = 3 + sigBytes[3] + 2;
    const s = extractDerInt(sigBytes, sOffset);
    rawSig = new Uint8Array(64);
    rawSig.set(padTo32(r), 0);
    rawSig.set(padTo32(s), 32);
  }

  return `${unsignedToken}.${bytesToBase64url(rawSig)}`;
}

function extractDerInt(buf: Uint8Array, offset: number): Uint8Array {
  const len = buf[offset];
  return buf.slice(offset + 1, offset + 1 + len);
}

function padTo32(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 32) return bytes;
  if (bytes.length > 32) return bytes.slice(bytes.length - 32);
  const padded = new Uint8Array(32);
  padded.set(bytes, 32 - bytes.length);
  return padded;
}

async function encryptPayload(
  p256dhKey: string, authSecret: string, payload: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const p256dhBytes = base64urlToBytes(p256dhKey);
  const authBytes = base64urlToBytes(authSecret);
  const payloadBytes = new TextEncoder().encode(payload);

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  );
  const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));

  // Import subscriber's public key
  const subscriberKey = await crypto.subtle.importKey(
    "raw", p256dhBytes, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberKey }, localKeyPair.privateKey, 256
  ));

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive IKM
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prkKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "HKDF" }, false, ["deriveBits"]);
  
  // PRK from auth
  const ikmKey = await crypto.subtle.importKey("raw", authBytes, { name: "HKDF" }, false, ["deriveBits"]);
  
  // Simplified: use HKDF for key derivation
  const keyInfo = concatBytes(
    new TextEncoder().encode("Content-Encoding: aes128gcm\0"),
    new Uint8Array([0]),
    p256dhBytes,
    localPublicKeyRaw
  );

  const nonceInfo = concatBytes(
    new TextEncoder().encode("Content-Encoding: nonce\0"),
    new Uint8Array([0]),
    p256dhBytes,
    localPublicKeyRaw
  );

  // Derive PRK
  const prkMaterial = await crypto.subtle.importKey("raw", sharedSecret, { name: "HKDF" }, false, ["deriveBits"]);
  const prk = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authBytes, info: authInfo }, prkMaterial, 256
  ));

  // Derive content encryption key and nonce
  const prkForContent = await crypto.subtle.importKey("raw", prk, { name: "HKDF" }, false, ["deriveBits"]);
  
  const cekBits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: keyInfo }, prkForContent, 128
  ));

  const prkForNonce = await crypto.subtle.importKey("raw", prk, { name: "HKDF" }, false, ["deriveBits"]);
  const nonce = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, prkForNonce, 96
  ));

  // Pad payload (add delimiter byte 0x02)
  const paddedPayload = concatBytes(payloadBytes, new Uint8Array([2]));

  // AES-128-GCM encrypt
  const aesKey = await crypto.subtle.importKey("raw", cekBits, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce }, aesKey, paddedPayload
  ));

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  const header = concatBytes(salt, rs, new Uint8Array([65]), localPublicKeyRaw);
  const body = concatBytes(header, encrypted);

  return { encrypted: body, salt, localPublicKey: localPublicKeyRaw };
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; icon?: string; data?: any }
) {
  const payloadStr = JSON.stringify(payload);
  const { encrypted } = await encryptPayload(subscription.p256dh, subscription.auth, payloadStr);

  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await createVapidJwt(audience);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
      "Authorization": `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
    },
    body: encrypted,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Push failed (${response.status}): ${text}`);
    return { success: false, status: response.status, error: text };
  }

  return { success: true, status: response.status };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_ids, title, body, icon, data } = await req.json();

    if (!user_ids || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields: user_ids, title, body" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get subscriptions for the given user_ids
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", user_ids);

    if (error) throw error;

    const results = [];
    for (const sub of subscriptions || []) {
      try {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          { title, body, icon: icon || "/pwa-icon-192.png", data }
        );
        results.push({ user_id: sub.user_id, ...result });

        // Remove expired subscriptions
        if (result.status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      } catch (e) {
        results.push({ user_id: sub.user_id, success: false, error: e.message });
      }
    }

    return new Response(JSON.stringify({ sent: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
