import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate("/home", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, name);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account creato! Controlla la tua email per confermare.");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error("Email o password non corretti");
      } else {
        navigate("/home");
      }
    }
    setIsLoading(false);
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
          {isSignUp && (
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
          )}
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
            <label className="text-sm font-semibold text-foreground">Password *</label>
            <Input
              type="password"
              placeholder="Almeno 6 caratteri"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 rounded-xl bg-card text-base"
            />
          </div>
          <Button
            type="submit"
            className="warm-gradient-bg h-12 w-full rounded-xl text-base font-bold text-primary-foreground warm-shadow hover:opacity-90 transition-opacity"
            disabled={!email.trim() || !password.trim() || isLoading}
          >
            {isLoading ? "Caricamento..." : isSignUp ? "Crea account" : "Accedi"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Hai già un account?" : "Non hai un account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-semibold text-primary hover:underline"
          >
            {isSignUp ? "Accedi" : "Registrati"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
