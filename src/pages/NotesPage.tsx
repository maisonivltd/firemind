import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit3, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Note {
  id: string;
  text: string;
  created_at: string;
}

const NotesPage = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
      if (data) setNotes(data);
    };
    fetch();
  }, []);

  const addNote = async () => {
    if (!newText.trim() || !user) return;
    const { data, error } = await supabase.from("notes").insert({ text: newText.trim(), user_id: user.id }).select().single();
    if (error) { toast.error("Errore nel salvataggio"); return; }
    if (data) setNotes([data, ...notes]);
    setNewText("");
    setShowAdd(false);
  };

  const startEdit = (note: Note) => { setEditingId(note.id); setEditText(note.text); };

  const saveEdit = async (id: string) => {
    await supabase.from("notes").update({ text: editText }).eq("id", id);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text: editText } : n)));
    setEditingId(null);
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

  return (
    <AppLayout title="Le mie note">
      <div className="space-y-4 animate-[fade-in_0.5s_ease-out]">
        <Button onClick={() => setShowAdd(!showAdd)} className="warm-gradient-bg w-full h-12 rounded-xl text-primary-foreground font-bold warm-shadow hover:opacity-90 transition-opacity">
          <Plus className="h-5 w-5 mr-2" /> Nuova nota
        </Button>

        {showAdd && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-[slide-up_0.3s_ease-out]">
            <Textarea placeholder="Scrivi i tuoi pensieri..." value={newText} onChange={(e) => setNewText(e.target.value)} className="min-h-[120px] rounded-xl bg-background text-base resize-none" />
            <div className="flex gap-2">
              <Button onClick={addNote} className="warm-gradient-bg flex-1 rounded-xl text-primary-foreground font-bold hover:opacity-90">Salva</Button>
              <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-xl">Annulla</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[100px] rounded-xl bg-background text-sm resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(note.id)} className="text-primary hover:opacity-70"><Check className="h-5 w-5" /></button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">{formatDate(note.created_at)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(note)} className="text-muted-foreground hover:text-primary transition-colors"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => deleteNote(note.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Nessuna nota ancora.</p>
            <p className="text-xs mt-1">Inizia a scrivere il tuo diario personale!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default NotesPage;
