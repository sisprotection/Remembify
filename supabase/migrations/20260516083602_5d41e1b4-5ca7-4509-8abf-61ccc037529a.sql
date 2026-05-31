
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'pro', 'plus', 'free');

-- Roles table (NEVER on profiles)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role check (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'owner')
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));
CREATE POLICY "owners manage roles" ON public.user_roles
  FOR ALL USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

-- Subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free',          -- free | plus | pro | lifetime
  status text NOT NULL DEFAULT 'active',      -- active | canceled | past_due | trialing
  paddle_subscription_id text,
  paddle_transaction_id text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));
CREATE POLICY "users insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners manage subscriptions" ON public.subscriptions
  FOR ALL USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));
CREATE TRIGGER subs_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AI usage counter
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  response text,
  tokens int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE INDEX ai_usage_user_idx ON public.ai_usage(user_id, created_at DESC);
CREATE POLICY "users read own ai usage" ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id OR public.is_owner(auth.uid()));
CREATE POLICY "users insert own ai usage" ON public.ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Flagged accounts (owner-only AI moderation surface)
CREATE TABLE public.account_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'low',  -- low | medium | high
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners full flags" ON public.account_flags
  FOR ALL USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

-- Update handle_new_user to seed role + subscription + auto-owner for the owner email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
    ON CONFLICT DO NOTHING;
    UPDATE public.subscriptions SET tier = 'lifetime' WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure the auth trigger exists (was missing before)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Owner can see all reminders / notifications (read-only)
CREATE POLICY "owners read all reminders" ON public.reminders
  FOR SELECT USING (public.is_owner(auth.uid()));
CREATE POLICY "owners read all notifications" ON public.notifications
  FOR SELECT USING (public.is_owner(auth.uid()));
CREATE POLICY "owners read all profiles" ON public.profiles
  FOR SELECT USING (public.is_owner(auth.uid()));
