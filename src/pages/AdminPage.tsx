import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, MessageSquare, Send, Bell, ChevronRight, ArrowLeft } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  date: string;
}

interface AdminMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  from: "user" | "admin";
  date: string;
}

const mockUsers: User[] = [
  { id: "1", email: "marco@email.com", name: "Marco", date: "7 Mar 2026" },
  { id: "2", email: "sara@email.com", name: "Sara", date: "5 Mar 2026" },
  { id: "3", email: "luca@email.com", name: "Luca", date: "3 Mar 2026" },
  { id: "4", email: "anna@email.com", name: "Anna", date: "1 Mar 2026" },
];

const mockMessages: AdminMessage[] = [
  { id: "1", userId: "1", userName: "Marco", text: "Ciao, ottima app! Mi aiuta molto.", from: "user", date: "8 Mar, 09:00" },
  { id: "2", userId: "1", userName: "Marco", text: "Grazie Marco! Continua così 💪", from: "admin", date: "8 Mar, 09:15" },
  { id: "3", userId: "2", userName: "Sara", text: "Come posso aggiungere più orari?", from: "user", date: "7 Mar, 14:00" },
];

type Tab = "users" | "messages" | "broadcast";

const AdminPage = () => {
  const [tab, setTab] = useState<Tab>("users");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [broadcastText, setBroadcastText] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const userMessages = messages.filter((m) => m.userId === selectedUser);
  const selectedUserData = mockUsers.find((u) => u.id === selectedUser);

  const sendReply = () => {
    if (!replyText.trim() || !selectedUser) return;
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        userId: selectedUser,
        userName: selectedUserData?.name || "",
        text: replyText.trim(),
        from: "admin",
        date: new Date().toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setReplyText("");
  };

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md px-5 py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">Pannello Admin</h1>
          <span className="text-xs text-muted-foreground">{mockUsers.length} utenti</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { key: "users" as Tab, icon: Users, label: "Utenti" },
          { key: "messages" as Tab, icon: MessageSquare, label: "Messaggi" },
          { key: "broadcast" as Tab, icon: Bell, label: "Broadcast" },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSelectedUser(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* Users tab */}
        {tab === "users" && (
          <div className="space-y-2 animate-[fade-in_0.3s_ease-out]">
            {mockUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="warm-gradient-bg flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">{user.date}</span>
              </div>
            ))}
          </div>
        )}

        {/* Messages tab */}
        {tab === "messages" && !selectedUser && (
          <div className="space-y-2 animate-[fade-in_0.3s_ease-out]">
            {mockUsers.map((user) => {
              const lastMsg = [...messages].reverse().find((m) => m.userId === user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user.id)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-secondary transition-colors text-left"
                >
                  <div className="warm-gradient-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lastMsg ? lastMsg.text : "Nessun messaggio"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {tab === "messages" && selectedUser && (
          <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
            <button
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> {selectedUserData?.name}
            </button>
            <div className="space-y-3">
              {userMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.from === "admin"
                        ? "warm-gradient-bg text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.from === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {msg.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Rispondi..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                className="h-11 rounded-xl bg-card flex-1"
              />
              <Button onClick={sendReply} disabled={!replyText.trim()} className="warm-gradient-bg h-11 w-11 rounded-xl p-0 text-primary-foreground hover:opacity-90">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Broadcast tab */}
        {tab === "broadcast" && (
          <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
            <div className="warm-card p-4 space-y-1">
              <h2 className="font-display text-lg font-bold text-foreground">Messaggio broadcast</h2>
              <p className="text-xs text-muted-foreground">
                Invia un messaggio a tutti i {mockUsers.length} utenti.
              </p>
            </div>
            <Textarea
              placeholder="Scrivi il messaggio per tutti gli utenti..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="min-h-[120px] rounded-xl bg-card text-base resize-none"
            />
            <Button
              disabled={!broadcastText.trim()}
              className="warm-gradient-bg w-full h-12 rounded-xl text-primary-foreground font-bold warm-shadow hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4 mr-2" />
              Invia a tutti ({mockUsers.length} utenti)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
