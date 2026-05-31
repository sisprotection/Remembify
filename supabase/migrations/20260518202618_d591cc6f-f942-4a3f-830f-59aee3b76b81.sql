
-- 1. Audit logs: drop open insert. Triggers use SECURITY DEFINER so they bypass RLS.
DROP POLICY IF EXISTS "authenticated insert audit" ON public.audit_logs;
CREATE POLICY "owners insert audit" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_owner(auth.uid()) AND actor_id = auth.uid());

-- 2. Username change requests: split ALL into narrow policies for users
DROP POLICY IF EXISTS "users manage own username requests" ON public.username_change_requests;
CREATE POLICY "users read own username requests" ON public.username_change_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users insert own username requests" ON public.username_change_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

-- 3. Ticket messages: prevent non-staff from setting from_staff=true
DROP POLICY IF EXISTS "insert ticket messages" ON public.ticket_messages;
CREATE POLICY "insert ticket messages" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND (
      public.is_staff(auth.uid())
      OR (
        from_staff = false
        AND EXISTS (
          SELECT 1 FROM public.support_tickets t
          WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid()
        )
      )
    )
  );

-- 4. Subscriptions: add restrictive policy preventing escalation on insert
CREATE POLICY "block non-free subscription inserts" ON public.subscriptions
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff(auth.uid())
    OR (
      auth.uid() = user_id
      AND tier = 'free'
      AND status = 'active'
      AND stripe_subscription_id IS NULL
      AND stripe_customer_id IS NULL
      AND paddle_subscription_id IS NULL
      AND paddle_transaction_id IS NULL
      AND price_id IS NULL
      AND product_id IS NULL
    )
  );

-- 5. Realtime: require authenticated to subscribe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'realtime' AND tablename = 'messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated can receive realtime" ON realtime.messages';
    EXECUTE 'CREATE POLICY "authenticated can receive realtime" ON realtime.messages FOR SELECT TO authenticated USING (true)';
  END IF;
END$$;
