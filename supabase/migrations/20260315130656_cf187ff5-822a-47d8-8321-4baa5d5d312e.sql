CREATE TABLE public.preset_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  user_id uuid,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.preset_phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view default phrases" ON public.preset_phrases
  FOR SELECT TO authenticated
  USING (is_default = true);

CREATE POLICY "Users can view own phrases" ON public.preset_phrases
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phrases" ON public.preset_phrases
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own phrases" ON public.preset_phrases
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND is_default = false);

INSERT INTO public.preset_phrases (text, is_default) VALUES
  ('Il sistema funziona se la persona chiave sparisce domani?', true),
  ('Sto delegando con controllo o sto sperando?', true),
  ('Cosa sto dando per scontato che non ho mai verificato?', true),
  ('Sto costruendo un asset o una dipendenza?', true),
  ('Ho una riserva separata dal business, intoccabile?', true),
  ('Questo modello ha un singolo punto di fallimento?', true),
  ('Quanti download oggi — e cosa li ha prodotti?', true),
  ('Il contenuto di oggi porta gente all''app o intrattiene soltanto?', true),
  ('Chi posso coinvolgere adesso che moltiplica questo risultato?', true),
  ('La decisione che sto per prendere — la farebbe la versione di me che ha già vinto?', true),
  ('Sto accelerando perché è il momento giusto o perché mi annoio ad aspettare?', true),
  ('Sto attraendo leader o sto raccogliendo esecutori?', true);