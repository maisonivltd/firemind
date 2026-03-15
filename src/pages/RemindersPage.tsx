import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Clock, BellRing, List } from "lucide-react";
import PresetPhrasesModal from "@/components/PresetPhrasesModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const [testingReminderId, setTestingReminderId] = useState<string | null>(null);

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

  const testReminderNotification = async (reminder: Reminder) => {
    if (!user) return;

    setTestingReminderId(reminder.id);
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        user_ids: [user.id],
        title: "🔥 Fire Mind - Test promemoria",
        body: reminder.text,
        data: { type: "reminder", reminder_id: reminder.id, test: true },
      },
    });

    if (error) {
      toast.error("Errore invio notifica test");
      console.error("Test push error:", error);
    } else {
      const sentCount = typeof data?.sent === "number" ? data.sent : 0;
      const firstFailure = Array.isArray(data?.results)
        ? data.results.find((item: { success?: boolean; error?: string }) => item?.success === false)
        : null;

      if (sentCount < 1) {
        toast.error(firstFailure?.error || "Nessuna notifica inviata: attiva prima le notifiche su questo telefono");
        console.warn("Test push response (no delivery):", data);
      } else {
        toast.success("Notifica test inviata");
        console.log("Test push response:", data);
      }
    }

    setTestingReminderId(null);
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
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testReminderNotification(r)}
                    disabled={testingReminderId === r.id}
                    className="h-7 rounded-lg px-2 text-xs"
                  >
                    <BellRing className="h-3.5 w-3.5 mr-1" />
                    Test
                  </Button>
                  <button
                    onClick={() => deleteReminder(r.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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


