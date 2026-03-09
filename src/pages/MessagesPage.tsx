import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface Message {
  id: string;
  text: string;
  from: "user" | "admin";
  date: string;
}

const initialMessages: Message[] = [
  { id: "1", text: "Benvenuto in MindFuel! 🔥 Sono qui per aiutarti nel tuo percorso di crescita. Scrivimi quando vuoi.", from: "admin", date: "7 Mar, 10:00" },
  { id: "2", text: "Ciao! Grazie, ho appena impostato i miei promemoria. Ottima app!", from: "user", date: "7 Mar, 10:05" },
  { id: "3", text: "Fantastico! Ricordati: la disciplina batte la motivazione. Ogni singolo giorno. 💪", from: "admin", date: "7 Mar, 10:10" },
];

const MessagesPage = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      from: "user",
      date: new Date().toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AppLayout title="Messaggi">
      <div className="flex flex-col animate-[fade-in_0.5s_ease-out]" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* Messages */}
        <div className="flex-1 space-y-3 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.from === "user"
                    ? "warm-gradient-bg text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.from === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {msg.date}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="sticky bottom-20 flex gap-2 bg-background py-3">
          <Input
            placeholder="Scrivi un messaggio..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-11 rounded-xl bg-card text-base flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="warm-gradient-bg h-11 w-11 rounded-xl text-primary-foreground hover:opacity-90 transition-opacity p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default MessagesPage;
