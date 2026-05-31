-- 1. is_staff helper (owner or admin)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner', 'admin')
  )
$$;

-- 2. Update handle_new_user to auto-grant Antonio admin + lifetime
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  INSERT INTO public.subscriptions (user_id, tier) VALUES (NEW.id, 'free');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'free');

  IF lower(NEW.email) = 'blackhatterxvi@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner') ON CONFLICT DO NOTHING;
    UPDATE public.subscriptions SET tier = 'lifetime' WHERE user_id = NEW.id;
  END IF;

  IF lower(NEW.email) = 'antoniyahpetite@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    UPDATE public.subscriptions SET tier = 'lifetime' WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure on_auth_user_created trigger exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Support ticket fields
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'support',
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- 4. Broaden ticket RLS to staff (owner + admin)
DROP POLICY IF EXISTS "owners manage tickets" ON public.support_tickets;
CREATE POLICY "staff manage tickets" ON public.support_tickets
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "users read own tickets" ON public.support_tickets;
CREATE POLICY "users read own tickets" ON public.support_tickets
  FOR SELECT USING ((auth.uid() = user_id) OR public.is_staff(auth.uid()));

-- 5. Ticket messages: staff impersonation fix + broaden read/manage
DROP POLICY IF EXISTS "insert ticket messages" ON public.ticket_messages;
CREATE POLICY "insert ticket messages" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
      public.is_staff(auth.uid())
      OR (
        from_staff = false
        AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "owners manage ticket messages" ON public.ticket_messages;
CREATE POLICY "staff manage ticket messages" ON public.ticket_messages
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "read ticket messages" ON public.ticket_messages;
CREATE POLICY "read ticket messages" ON public.ticket_messages
  FOR SELECT USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid())
  );

-- 6. Subscriptions: prevent users from updating their own tier/status/billing
-- The existing "users insert own free subscription" policy stays.
-- Add explicit UPDATE policy that allows users zero columns to change — only service_role + owners may UPDATE.
-- Postgres has no native column-level UPDATE in RLS; safest is to omit a USING for authenticated users entirely
-- (existing service_role and owner policies still apply).
-- Add a restrictive policy that blocks any UPDATE by non-staff non-service authenticated users:
DROP POLICY IF EXISTS "block user updates on subscriptions" ON public.subscriptions;
CREATE POLICY "block user updates on subscriptions" ON public.subscriptions
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "block user deletes on subscriptions" ON public.subscriptions;
CREATE POLICY "block user deletes on subscriptions" ON public.subscriptions
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- 7. Notify the opposite party on every ticket message
CREATE OR REPLACE FUNCTION public.notify_ticket_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t public.support_tickets%ROWTYPE;
  recipient uuid;
  preview text;
BEGIN
  SELECT * INTO t FROM public.support_tickets WHERE id = NEW.ticket_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  preview := left(NEW.body, 140);

  IF NEW.from_staff THEN
    -- Notify the customer
    recipient := t.user_id;
    INSERT INTO public.notifications (user_id, title, message, trigger_kind, status)
    VALUES (recipient, 'Support replied: ' || t.subject, preview, 'ticket_reply', 'unread');
  ELSE
    -- Notify all staff (owners + admins)
    INSERT INTO public.notifications (user_id, title, message, trigger_kind, status)
    SELECT ur.user_id, 'New ticket message: ' || t.subject, preview, 'ticket_message', 'unread'
    FROM public.user_roles ur
    WHERE ur.role IN ('owner', 'admin')
      AND ur.user_id <> NEW.author_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_ticket_message ON public.ticket_messages;
CREATE TRIGGER trg_notify_ticket_message
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_message();

-- 8. Enable realtime
ALTER TABLE public.ticket_messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;