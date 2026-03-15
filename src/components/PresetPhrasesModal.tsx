import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, List } from "lucide-react";
import { toast } from "sonner";

interface PresetPhrase {
  id: string;
  text: string;
  is_default: boolean;
  user_id: string | null;
}

interface PresetPhrasesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (text: string) => void;
}

const PresetPhrasesModal = ({ open, onOpenChange, onSelect }: PresetPhrasesModalProps) => {
  const { user } = useAuth();
  const [phrases, setPhrases] = useState<PresetPhrase[]>([]);
  const [newPhrase, setNewPhrase] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const fetchPhrases = async () => {
    const { data } = await supabase
      .from("preset_phrases")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (data) setPhrases(data as PresetPhrase[]);
  };

  useEffect(() => {
    if (open) fetchPhrases();
  }, [open]);

  const addPhrase = async () => {
    if (!newPhrase.trim() || !user) return;
    const { data, error } = await supabase
      .from("preset_phrases")
      .insert({ text: newPhrase.trim(), user_id: user.id, is_default: false } as any)
      .select()
      .single();
    if (error) {
      toast.error("Errore nel salvataggio");
      return;
    }
    if (data) setPhrases([...phrases, data as PresetPhrase]);
    setNewPhrase("");
    setShowAdd(false);
  };

  const deletePhrase = async (id: string) => {
    await supabase.from("preset_phrases").delete().eq("id", id);
    setPhrases((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSelect = (text: string) => {
    onSelect(text);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <List className="h-5 w-5 text-primary" />
            Frasi predefinite
          </DialogTitle>
          <DialogDescription>
            Seleziona una frase o aggiungine una nuova
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {phrases.map((phrase) => (
            <div
              key={phrase.id}
              className="group flex items-start gap-2 rounded-xl border border-border bg-card p-3 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => handleSelect(phrase.text)}
            >
              <p className="text-sm text-foreground flex-1 leading-relaxed">
                {phrase.text}
              </p>
              {!phrase.is_default && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePhrase(phrase.id);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {showAdd ? (
          <div className="space-y-2 pt-2 border-t border-border">
            <Input
              placeholder="Scrivi una nuova frase..."
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              className="h-10 rounded-xl bg-background text-sm"
              onKeyDown={(e) => e.key === "Enter" && addPhrase()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={addPhrase} size="sm" className="warm-gradient-bg rounded-xl text-primary-foreground font-bold hover:opacity-90 flex-1">
                Salva
              </Button>
              <Button onClick={() => { setShowAdd(false); setNewPhrase(""); }} variant="outline" size="sm" className="rounded-xl">
                Annulla
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowAdd(true)}
            variant="outline"
            size="sm"
            className="w-full rounded-xl mt-2"
          >
            <Plus className="h-4 w-4 mr-1" /> Aggiungi frase personalizzata
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PresetPhrasesModal;
