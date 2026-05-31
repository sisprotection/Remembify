DROP POLICY IF EXISTS "user-scoped realtime topics" ON realtime.messages;

CREATE POLICY "user-scoped realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.is_staff(auth.uid())
  OR realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
);