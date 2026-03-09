import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // Mock login - will connect to backend later
      localStorage.setItem("user", JSON.stringify({ email, name }));
      navigate("/home");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm animate-[slide-up_0.6s_ease-out]">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="warm-gradient-bg flex h-16 w-16 items-center justify-center rounded-2xl warm-shadow">
            <Flame className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">MindFuel</h1>
          <p className="text-center text-muted-foreground">
            I tuoi promemoria motivazionali,<br />sempre con te.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Email *</label>
            <Input
              type="email"
              placeholder="la-tua@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl bg-card text-base"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Nome <span className="text-muted-foreground font-normal">(facoltativo)</span>
            </label>
            <Input
              type="text"
              placeholder="Come ti chiami?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl bg-card text-base"
            />
          </div>
          <Button
            type="submit"
            className="warm-gradient-bg h-12 w-full rounded-xl text-base font-bold text-primary-foreground warm-shadow hover:opacity-90 transition-opacity"
            disabled={!email.trim()}
          >
            Inizia il tuo percorso
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
