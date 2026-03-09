import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Bell, Flame, ChevronRight, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Reminder {
  id: string;
  text: string;
  times: string[];
  active: boolean;
}

const HomePage = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const greeting = profile?.name ? `Ciao, ${profile.name}` : "Ciao";
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";

  useEffect(() => {
    const fetchReminders = async () => {
      const { data } = await supabase
        .from("reminders")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (data) setReminders(data);
    };
    fetchReminders();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const nextReminder = reminders[0];

  return (
    <AppLayout>
      <div className="space-y-6 animate-[fade-in_0.5s_ease-out]">
        {/* Hero greeting */}
        <div className="warm-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">{timeGreeting}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">{greeting} 👋</h1>
          <p className="text-muted-foreground text-sm">
            Ogni giorno è un'opportunità per crescere.
          </p>
        </div>

        {/* Next reminder */}
        {nextReminder && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold text-foreground">Prossimo promemoria</h2>
            <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="warm-gradient-bg flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                <Bell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{nextReminder.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Oggi alle {nextReminder.times[0]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-foreground">Azioni rapide</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/reminders" className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 hover:bg-secondary transition-colors">
              <Bell className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-foreground">Promemoria</span>
              <span className="text-xs text-muted-foreground">{reminders.length} attivi</span>
            </Link>
            <Link to="/notes" className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 hover:bg-secondary transition-colors">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm font-bold text-foreground">Note</span>
              <span className="text-xs text-muted-foreground">Il tuo diario</span>
            </Link>
          </div>
        </div>

        {/* Active reminders */}
        {reminders.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Promemoria attivi</h2>
              <Link to="/reminders" className="flex items-center text-xs font-semibold text-primary">
                Vedi tutti <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {reminders.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <span className="warm-gradient-bg rounded-lg px-2 py-1 text-xs font-bold text-primary-foreground">
                    {r.times[0]}
                  </span>
                  <p className="text-sm text-foreground flex-1 truncate">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default HomePage;
