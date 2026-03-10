import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { playMessageSent, playMessageReceived } from "@/hooks/useNotificationSound";

interface Message {
  id: string;
  text: string;
  from_role: string;
  created_at: string;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
      initialLoadDone.current = true;
    };
    fetch();

    // Real-time subscription
    const channel = supabase
      .channel("messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => [...prev, msg]);
        // Play sound only for incoming messages (admin replies), not our own sends
        if (initialLoadDone.current && msg.from_role !== "user") {
          playMessageReceived();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const { error } = await supabase
      .from("messages")
      .insert({ text: newMessage.trim(), from_role: "user", user_id: user.id });
    if (error) { toast.error("Errore nell'invio"); return; }
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <AppLayout title="Messaggi">
      <div className="flex flex-col animate-[fade-in_0.5s_ease-out]" style={{ minHeight: "calc(100vh - 180px)" }}>
        <div className="flex-1 space-y-3 pb-4">
          {messages.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">Nessun messaggio ancora.</p>
              <p className="text-xs mt-1">Scrivi il tuo primo messaggio!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from_role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.from_role === "user" ? "warm-gradient-bg text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.from_role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {formatDate(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-20 flex gap-2 bg-background py-3">
          <Input placeholder="Scrivi un messaggio..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} className="h-11 rounded-xl bg-card text-base flex-1" />
          <Button onClick={sendMessage} disabled={!newMessage.trim()} className="warm-gradient-bg h-11 w-11 rounded-xl text-primary-foreground hover:opacity-90 transition-opacity p-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default MessagesPage;
