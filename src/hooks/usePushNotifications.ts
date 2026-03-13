import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = "BIfsxpVPWWrVt1V13zYT10sjgIkEpHpVbca7SL8-KRZoMU2Ii173g-oJaoytziVflkEZBhQ1N0dRsXdoq5HJG_E";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

function areUint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const saveSubscription = useCallback(async (subscription: PushSubscription) => {
    const subJson = subscription.toJSON();

    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return false;
    }

    const { error } = await supabase.functions.invoke("subscribe-push", {
      body: {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      },
    });

    if (error) {
      console.error("Error saving push subscription:", error);
      return false;
    }

    return true;
  }, []);

  useEffect(() => {
    setIsSupported("serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
  }, []);

  useEffect(() => {
    if (!isSupported || !user) return;

    const checkSubscription = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();

        if (!sub) {
          setIsSubscribed(false);
          return;
        }

        const synced = await saveSubscription(sub);
        setIsSubscribed(synced);
      } catch {
        setIsSubscribed(false);
      }
    };

    checkSubscription();
  }, [isSupported, user, saveSubscription]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return false;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      let subscription = await reg.pushManager.getSubscription();

      if (subscription?.options?.applicationServerKey) {
        const currentServerKey = new Uint8Array(subscription.options.applicationServerKey);
        if (!areUint8ArraysEqual(currentServerKey, vapidKey)) {
          await subscription.unsubscribe();
          subscription = null;
        }
      }

      if (!subscription) {
        try {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey.buffer as ArrayBuffer,
          });
        } catch (err) {
          if (err instanceof DOMException && err.name === "InvalidStateError") {
            const existing = await reg.pushManager.getSubscription();
            if (existing) await existing.unsubscribe();
            subscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: vapidKey.buffer as ArrayBuffer,
            });
          } else {
            throw err;
          }
        }
      }

      const saved = await saveSubscription(subscription);
      if (!saved) {
        setIsSubscribed(false);
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
      return false;
    }
  }, [isSupported, user, saveSubscription]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !user) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
  }, [isSupported, user]);

  return { isSupported, permission, isSubscribed, subscribe, unsubscribe };
}

