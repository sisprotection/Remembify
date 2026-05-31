
-- Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));
CREATE POLICY "users insert own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners manage tickets" ON public.support_tickets FOR ALL USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));
CREATE TRIGGER set_tickets_updated BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_tickets_status ON public.support_tickets(status, created_at DESC);

-- Ticket messages (replies thread)
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  from_staff boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read ticket messages" ON public.ticket_messages FOR SELECT
  USING (public.is_owner(auth.uid()) OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "insert ticket messages" ON public.ticket_messages FOR INSERT
  WITH CHECK (auth.uid() = author_id AND (public.is_owner(auth.uid()) OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())));
CREATE POLICY "owners manage ticket messages" ON public.ticket_messages FOR ALL
  USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

-- Alert sounds preference per reminder + custom sounds per user
ALTER TABLE public.reminders ADD COLUMN sound_id text DEFAULT 'chime';
ALTER TABLE public.reminders ADD COLUMN custom_sound_url text;
ALTER TABLE public.user_settings ADD COLUMN default_sound_id text NOT NULL DEFAULT 'chime';
ALTER TABLE public.user_settings ADD COLUMN sound_volume numeric NOT NULL DEFAULT 0.8;

CREATE TABLE public.user_sounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  storage_path text NOT NULL,
  duration_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_sounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sounds all" ON public.user_sounds FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners read sounds" ON public.user_sounds FOR SELECT USING (public.is_owner(auth.uid()));

-- Storage bucket for custom sounds (public read for simplicity; files are per-user folders)
INSERT INTO storage.buckets (id, name, public) VALUES ('alert-sounds', 'alert-sounds', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "alert sounds public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'alert-sounds');
CREATE POLICY "alert sounds user write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'alert-sounds' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "alert sounds user update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'alert-sounds' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "alert sounds user delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'alert-sounds' AND auth.uid()::text = (storage.foldername(name))[1]);
