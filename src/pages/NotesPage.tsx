import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit3, Check, X } from "lucide-react";

interface Note {
  id: string;
  text: string;
  date: string;
}

const initialNotes: Note[] = [
  { id: "1", text: "Oggi ho capito che la costanza è più importante della motivazione. Ogni piccolo passo conta.", date: "8 Mar 2026" },
  { id: "2", text: "Obiettivi della settimana:\n- Meditare 10 min al giorno\n- Leggere 20 pagine\n- Allenarmi 3 volte", date: "7 Mar 2026" },
  { id: "3", text: "\"Il successo non è definitivo, il fallimento non è fatale: è il coraggio di continuare che conta.\" - Churchill", date: "5 Mar 2026" },
];

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const addNote = () => {
    if (!newText.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      text: newText.trim(),
      date: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }),
    };
    setNotes([note, ...notes]);
    setNewText("");
    setShowAdd(false);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const saveEdit = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text: editText } : n)));
    setEditingId(null);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <AppLayout title="Le mie note">
      <div className="space-y-4 animate-[fade-in_0.5s_ease-out]">
        <Button
          onClick={() => setShowAdd(!showAdd)}
          className="warm-gradient-bg w-full h-12 rounded-xl text-primary-foreground font-bold warm-shadow hover:opacity-90 transition-opacity"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuova nota
        </Button>

        {showAdd && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-[slide-up_0.3s_ease-out]">
            <Textarea
              placeholder="Scrivi i tuoi pensieri..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="min-h-[120px] rounded-xl bg-background text-base resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={addNote} className="warm-gradient-bg flex-1 rounded-xl text-primary-foreground font-bold hover:opacity-90">
                Salva
              </Button>
              <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-xl">
                Annulla
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[100px] rounded-xl bg-background text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(note.id)} className="text-primary hover:opacity-70">
                      <Check className="h-5 w-5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">{note.date}</span>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(note)} className="text-muted-foreground hover:text-primary transition-colors">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteNote(note.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
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
