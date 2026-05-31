
-- 1. Tighten subscriptions INSERT policy: users can only self-insert a free/active row.
DROP POLICY IF EXISTS "users insert own subscription" ON public.subscriptions;
CREATE POLICY "users insert own free subscription"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND tier = 'free'
  AND status = 'active'
  AND stripe_subscription_id IS NULL
  AND stripe_customer_id IS NULL
  AND paddle_subscription_id IS NULL
  AND paddle_transaction_id IS NULL
  AND price_id IS NULL
  AND product_id IS NULL
);

-- 2. Owner management on ai_usage
DROP POLICY IF EXISTS "owners manage ai usage" ON public.ai_usage;
CREATE POLICY "owners manage ai usage"
ON public.ai_usage
FOR ALL
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

-- 3. Owner read on user_settings (consistency with other tables)
DROP POLICY IF EXISTS "owners read user settings" ON public.user_settings;
CREATE POLICY "owners read user settings"
ON public.user_settings
FOR SELECT
USING (public.is_owner(auth.uid()));

-- 4. Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated/public.
-- handle_new_user runs from auth triggers; others are invoked from RLS policies
-- (postgres role) so revoking from public/anon/authenticated is safe.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_owner(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
