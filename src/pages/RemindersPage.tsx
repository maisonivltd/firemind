import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Clock, BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface Reminder {
  id: string;
  text: string;
  times: string[];
  active: boolean;
}

const RemindersPage = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTimes, setNewTimes] = useState<string[]>(["08:00"]);

  const fetchReminders = async () => {
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setReminders(data);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const toggleReminder = async (id: string, active: boolean) => {
    await supabase.from("reminders").update({ active: !active }).eq("id", id);
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const deleteReminder = async (id: string) => {
    await supabase.from("reminders").delete().eq("id", id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const addReminder = async () => {
    if (!newText.trim() || !user) return;
    const { data, error } = await supabase
      .from("reminders")
      .insert({ text: newText.trim(), times: newTimes.filter(Boolean), user_id: user.id })
      .select()
      .single();
    if (error) {
      toast.error("Errore nel salvataggio");
      return;
    }
    if (data) setReminders([data, ...reminders]);
    setNewText("");
    setNewTimes(["08:00"]);
    setShowAdd(false);
  };

  const addTimeSlot = () => {
    if (newTimes.length < 3) setNewTimes([...newTimes, "12:00"]);
  };

  const updateTime = (index: number, value: string) => {
    const updated = [...newTimes];
    updated[index] = value;
    setNewTimes(updated);
  };

  return (
    <AppLayout title="I miei promemoria">
      <div className="space-y-4 animate-[fade-in_0.5s_ease-out]">
        {/* Test notification button */}
        <Button
          onClick={testNotification}
          disabled={testLoading}
          variant="outline"
          className="w-full h-12 rounded-xl font-bold border-primary text-primary hover:bg-primary/10 transition-colors"
        >
          {testLoading ? (
            <span className="animate-pulse">Invio in corso...</span>
          ) : (
            <>
              <BellRing className="h-5 w-5 mr-2" />
              {!isSubscribed ? "Attiva e testa notifiche" : "🔔 Testa notifica push"}
            </>
          )}
        </Button>

        {permission === "denied" && (
          <p className="text-xs text-destructive text-center">
            ⚠️ Le notifiche sono bloccate nel browser. Vai nelle impostazioni del sito per abilitarle.
          </p>
        )}

        {testResponse && (
          <div className="rounded-2xl border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">Debug risposta notifica push</p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-background p-2 text-xs text-foreground whitespace-pre-wrap break-all">
              {testResponse}
            </pre>
          </div>
        )}

        <Button
          onClick={() => setShowAdd(!showAdd)}
          className="warm-gradient-bg w-full h-12 rounded-xl text-primary-foreground font-bold warm-shadow hover:opacity-90 transition-opacity"
        >
          <Plus className="h-5 w-5 mr-2" /> Nuovo promemoria
        </Button>

        {showAdd && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4 animate-[slide-up_0.3s_ease-out]">
            <Input
              placeholder="Scrivi il tuo messaggio motivazionale..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="h-12 rounded-xl bg-background text-base"
            />
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                <Clock className="h-4 w-4 text-primary" /> Orari notifica
              </label>
              {newTimes.map((time, i) => (
                <Input
                  key={i}
                  type="time"
                  value={time}
                  onChange={(e) => updateTime(i, e.target.value)}
                  className="h-10 rounded-xl bg-background"
                />
              ))}
              {newTimes.length < 3 && (
                <button onClick={addTimeSlot} className="text-xs font-semibold text-primary hover:underline">
                  + Aggiungi orario (max 3)
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addReminder}
                className="warm-gradient-bg flex-1 rounded-xl text-primary-foreground font-bold hover:opacity-90"
              >
                Salva
              </Button>
              <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-xl">
                Annulla
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {reminders.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border border-border bg-card p-4 space-y-3 transition-opacity ${!r.active ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground flex-1">{r.text}</p>
                <Switch checked={r.active} onCheckedChange={() => toggleReminder(r.id, r.active)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {r.times.map((t, i) => (
                    <span
                      key={i}
                      className="warm-gradient-bg rounded-lg px-2 py-0.5 text-xs font-bold text-primary-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {reminders.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Nessun promemoria ancora.</p>
            <p className="text-xs mt-1">Crea il tuo primo messaggio motivazionale!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default RemindersPage;

