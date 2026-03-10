import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, MessageSquare, Send, Bell, ChevronRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  email: string;
  name: string | null;
  created_at: string;
}

interface Message {
  id: string;
  user_id: string;
  text: string;
  from_role: string;
  created_at: string;
}

type Tab = "users" | "messages" | "broadcast";

const AdminPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [broadcastText, setBroadcastText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
      if (data) {
        fetchProfiles();
        fetchMessages();
      }
    };
    checkAdmin();
  }, [user]);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setProfiles(data);
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const userMessages = messages.filter((m) => m.user_id === selectedUser);
  const selectedProfile = profiles.find((p) => p.user_id === selectedUser);

  const sendReply = async () => {
    if (!replyText.trim() || !selectedUser || !user) return;
    const { error } = await supabase.from("messages").insert({
      user_id: selectedUser,
      text: replyText.trim(),
      from_role: "admin",
    });
    if (error) { toast.error("Errore nell'invio"); return; }
    setMessages([...messages, {
      id: Date.now().toString(),
      user_id: selectedUser,
      text: replyText.trim(),
      from_role: "admin",
      created_at: new Date().toISOString(),
    }]);
    setReplyText("");
    // Send push notification
    supabase.functions.invoke("send-push-notification", {
      body: { user_ids: [selectedUser], title: "🔥 Fire Mind", body: replyText.trim(), data: { type: "message" } },
    });
  };

  const sendBroadcast = async () => {
    if (!broadcastText.trim() || !user) return;
    const inserts = profiles.map((p) => ({
      user_id: p.user_id,
      text: broadcastText.trim(),
      from_role: "admin" as const,
    }));
    const { error } = await supabase.from("messages").insert(inserts);
    if (error) { toast.error("Errore nell'invio broadcast"); return; }
    toast.success(`Messaggio inviato a ${profiles.length} utenti!`);
    setBroadcastText("");
    fetchMessages();
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Accesso non autorizzato.</p>
      </div>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md px-5 py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">Pannello Admin</h1>
          <span className="text-xs text-muted-foreground">{profiles.length} utenti</span>
        </div>
      </header>

      <div className="flex border-b border-border">
        {([
          { key: "users" as Tab, icon: Users, label: "Utenti" },
          { key: "messages" as Tab, icon: MessageSquare, label: "Messaggi" },
          { key: "broadcast" as Tab, icon: Bell, label: "Broadcast" },
        ]).map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => { setTab(key); setSelectedUser(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "users" && (
          <div className="space-y-2 animate-[fade-in_0.3s_ease-out]">
            {profiles.map((p) => (
              <div key={p.user_id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="warm-gradient-bg flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                  {(p.name || p.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{p.name || "Senza nome"}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("it-IT")}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "messages" && !selectedUser && (
          <div className="space-y-2 animate-[fade-in_0.3s_ease-out]">
            {profiles.map((p) => {
              const lastMsg = [...messages].reverse().find((m) => m.user_id === p.user_id);
              return (
                <button key={p.user_id} onClick={() => setSelectedUser(p.user_id)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors text-left">
                  <div className="warm-gradient-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                    {(p.name || p.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{p.name || "Senza nome"}</p>
                    <p className="text-xs text-muted-foreground truncate">{lastMsg ? lastMsg.text : "Nessun messaggio"}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {tab === "messages" && selectedUser && (
          <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
            <button onClick={() => setSelectedUser(null)} className="flex items-center gap-1 text-sm font-semibold text-primary">
              <ArrowLeft className="h-4 w-4" /> {selectedProfile?.name || "Utente"}
            </button>
            <div className="space-y-3">
              {userMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from_role === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.from_role === "admin" ? "warm-gradient-bg text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.from_role === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatDate(msg.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Rispondi..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} className="h-11 rounded-xl bg-card flex-1" />
              <Button onClick={sendReply} disabled={!replyText.trim()} className="warm-gradient-bg h-11 w-11 rounded-xl p-0 text-primary-foreground hover:opacity-90">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {tab === "broadcast" && (
          <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
            <div className="warm-card p-4 space-y-1">
              <h2 className="font-display text-lg font-bold text-foreground">Messaggio broadcast</h2>
              <p className="text-xs text-muted-foreground">Invia un messaggio a tutti i {profiles.length} utenti.</p>
            </div>
            <Textarea placeholder="Scrivi il messaggio per tutti gli utenti..." value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} className="min-h-[120px] rounded-xl bg-card text-base resize-none" />
            <Button onClick={sendBroadcast} disabled={!broadcastText.trim()} className="warm-gradient-bg w-full h-12 rounded-xl text-primary-foreground font-bold warm-shadow hover:opacity-90 transition-opacity">
              <Send className="h-4 w-4 mr-2" /> Invia a tutti ({profiles.length} utenti)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
