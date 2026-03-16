import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Share2, Copy, Check, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NotificationEntry {
  id: string;
  text: string;
  title: string;
  created_at: string;
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notification_log")
        .select("id, text, title, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setNotifications(data);
    };
    load();
  }, [user]);

  const handleShare = async (entry: NotificationEntry) => {
    const text = entry.text;

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // user cancelled or not supported, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(entry.id);
      toast.success("Frase copiata!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Impossibile copiare");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AppLayout title="Notifiche ricevute">
      <div className="space-y-3 animate-[fade-in_0.5s_ease-out]">
        {notifications.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nessuna notifica ancora.</p>
            <p className="text-xs mt-1">Quando riceverai un promemoria, apparirà qui.</p>
          </div>
        )}

        {notifications.map((n) => (
          <div
            key={n.id}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              {n.text}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDate(n.created_at)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare(n)}
                className="h-8 rounded-lg px-3 text-xs gap-1.5"
              >
                {copiedId === n.id ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copiata
                  </>
                ) : navigator.share ? (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    Condividi
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copia
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
