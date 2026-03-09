import AppLayout from "@/components/AppLayout";
import { Bell, Flame, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const mockReminders = [
  { id: "1", text: "Ricordati che sei una persona disciplinata.", time: "08:00", active: true },
  { id: "2", text: "Concentrati sulle cose importanti.", time: "14:00", active: true },
  { id: "3", text: "Hai fatto oggi quello che conta?", time: "21:00", active: true },
];

const HomePage = () => {
  const user = JSON.parse(localStorage.getItem("user") || '{"name":"","email":""}');
  const greeting = user.name ? `Ciao, ${user.name}` : "Ciao";
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";

  return (
    <AppLayout>
      <div className="space-y-6 animate-[fade-in_0.5s_ease-out]">
        {/* Hero greeting */}
        <div className="warm-card p-6 space-y-2">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">{timeGreeting}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">{greeting} 👋</h1>
          <p className="text-muted-foreground text-sm">
            Ogni giorno è un'opportunità per crescere.
          </p>
        </div>

        {/* Next reminder */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-foreground">Prossimo promemoria</h2>
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="warm-gradient-bg flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
              <Bell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {mockReminders[0].text}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Oggi alle {mockReminders[0].time}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-foreground">Azioni rapide</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/reminders"
              className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 hover:bg-secondary transition-colors"
            >
              <Bell className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-foreground">Promemoria</span>
              <span className="text-xs text-muted-foreground">{mockReminders.length} attivi</span>
            </Link>
            <Link
              to="/notes"
              className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 hover:bg-secondary transition-colors"
            >
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm font-bold text-foreground">Note</span>
              <span className="text-xs text-muted-foreground">Il tuo diario</span>
            </Link>
          </div>
        </div>

        {/* Active reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Promemoria attivi</h2>
            <Link to="/reminders" className="flex items-center text-xs font-semibold text-primary">
              Vedi tutti <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {mockReminders.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <span className="warm-gradient-bg rounded-lg px-2 py-1 text-xs font-bold text-primary-foreground">
                  {r.time}
                </span>
                <p className="text-sm text-foreground flex-1 truncate">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default HomePage;
