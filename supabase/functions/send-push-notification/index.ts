import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VAPID_PUBLIC_KEY = "BIfsxpVPWWrVt1V13zYT10sjgIkEpHpVbca7SL8-KRZoMU2Ii173g-oJaoytziVflkEZBhQ1N0dRsXdoq5HJG_E";
const VAPID_PRIVATE_KEY = "oHDNjXKsDgpvqH6a2Wq9XX1Fhv2UL8pZLG40KQDHEGA";
const VAPID_SUBJECT = "mailto:admin@firemind.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function extractPushError(error: unknown): { status: number | null; message: string } {
  const err = error as { statusCode?: number; body?: string; message?: string };
  return {
    status: typeof err?.statusCode === "number" ? err.statusCode : null,
    message: err?.body || err?.message || "Unknown push error",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { user_ids, title, body, icon, data } = await req.json();

    const requestedUserIds = Array.isArray(user_ids)
      ? user_ids.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
      : [];

    if (!requestedUserIds.length || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields: user_ids, title, body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("push_subscriptions")
      .select("id,user_id,endpoint,p256dh,auth")
      .in("user_id", requestedUserIds);

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/pwa-icon-192.png",
      data: data || {},
    });

    const results = await Promise.all(
      ((subscriptions || []) as PushSubscriptionRow[]).map(async (subscription) => {
        try {
          const response = await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload,
            {
              TTL: 86400,
              urgency: "high",
            }
          );

          return {
            subscription_id: subscription.id,
            user_id: subscription.user_id,
            success: true,
            status: response.statusCode,
          };
        } catch (error) {
          const parsedError = extractPushError(error);

          if (parsedError.status === 404 || parsedError.status === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
          }

          return {
            subscription_id: subscription.id,
            user_id: subscription.user_id,
            success: false,
            status: parsedError.status,
            error: parsedError.message,
          };
        }
      })
    );

    return new Response(
      JSON.stringify({
        sent: results.filter((result) => result.success).length,
        total_subscriptions: subscriptions?.length || 0,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
