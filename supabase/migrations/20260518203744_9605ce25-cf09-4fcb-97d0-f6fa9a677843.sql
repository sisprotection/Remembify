-- Tighten realtime channel access: only allow subscriptions to topics
-- that contain the subscribing user's UUID, or staff/owners.
DROP POLICY IF EXISTS "authenticated can receive realtime" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated read realtime" ON realtime.messages;

CREATE POLICY "user-scoped realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.is_staff(auth.uid())
  OR realtime.topic() LIKE '%' || auth.uid()::text || '%'
);