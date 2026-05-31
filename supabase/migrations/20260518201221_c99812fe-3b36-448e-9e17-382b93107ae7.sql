
-- T&C consents
CREATE TABLE IF NOT EXISTS public.tc_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text
);
CREATE INDEX IF NOT EXISTS tc_consents_user_idx ON public.tc_consents (user_id, accepted_at DESC);
ALTER TABLE public.tc_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users insert own consent" ON public.tc_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users read own consent" ON public.tc_consents
  FOR SELECT USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- Username change requests
CREATE TABLE IF NOT EXISTS public.username_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  requested_username citext NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.username_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own username requests" ON public.username_change_requests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff manage all username requests" ON public.username_change_requests
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Holdings settings
CREATE TABLE IF NOT EXISTS public.holdings_settings (
  id int PRIMARY KEY DEFAULT 1,
  infinity_suspended boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT singleton CHECK (id = 1)
);
INSERT INTO public.holdings_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.holdings_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read holdings settings" ON public.holdings_settings
  FOR SELECT USING (public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'president'));
CREATE POLICY "president writes holdings settings" ON public.holdings_settings
  FOR UPDATE USING (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'))
  WITH CHECK (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'));

-- Cabinet helper
CREATE OR REPLACE FUNCTION public.is_cabinet(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner','admin','president','vice_president','secretary','financial_adviser')
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_cabinet(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_cabinet(uuid) TO authenticated;

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity_id uuid,
  action text NOT NULL,
  target_table text,
  target_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs (entity_id);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_visibility_overrides (
  role public.app_role PRIMARY KEY,
  hidden boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_visibility_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner+president manage audit visibility" ON public.audit_visibility_overrides
  FOR ALL USING (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'))
  WITH CHECK (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'));
CREATE POLICY "cabinet read audit visibility" ON public.audit_visibility_overrides
  FOR SELECT USING (public.is_cabinet(auth.uid()));

CREATE OR REPLACE FUNCTION public.can_view_audit(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role IN ('owner','president','vice_president','secretary','financial_adviser','admin')
      AND NOT EXISTS (
        SELECT 1 FROM public.audit_visibility_overrides v
        WHERE v.role = ur.role AND v.hidden = true AND ur.role NOT IN ('owner','president')
      )
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_view_audit(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_view_audit(uuid) TO authenticated;

CREATE POLICY "audit viewers read" ON public.audit_logs
  FOR SELECT USING (public.can_view_audit(auth.uid()));
CREATE POLICY "authenticated insert audit" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  act text;
  rid text;
BEGIN
  act := lower(TG_OP);
  IF TG_OP = 'DELETE' THEN rid := OLD.id::text;
  ELSE rid := NEW.id::text;
  END IF;
  INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, payload)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME || '.' || act,
    TG_TABLE_NAME,
    rid,
    CASE
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      ELSE to_jsonb(NEW)
    END
  );
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS audit_reminders ON public.reminders;
CREATE TRIGGER audit_reminders AFTER INSERT OR UPDATE OR DELETE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
DROP TRIGGER IF EXISTS audit_subscriptions ON public.subscriptions;
CREATE TRIGGER audit_subscriptions AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
DROP TRIGGER IF EXISTS audit_support_tickets ON public.support_tickets;
CREATE TRIGGER audit_support_tickets AFTER INSERT OR UPDATE OR DELETE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
DROP TRIGGER IF EXISTS audit_tc_consents ON public.tc_consents;
CREATE TRIGGER audit_tc_consents AFTER INSERT ON public.tc_consents
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Cabinet notes
CREATE TABLE IF NOT EXISTS public.cabinet_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  author_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cabinet_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cabinet read role notes" ON public.cabinet_notes
  FOR SELECT USING (
    public.is_owner(auth.uid())
    OR public.has_role(auth.uid(), 'president')
    OR public.has_role(auth.uid(), role)
  );
CREATE POLICY "cabinet manage role notes" ON public.cabinet_notes
  FOR ALL USING (
    public.is_owner(auth.uid())
    OR public.has_role(auth.uid(), 'president')
    OR public.has_role(auth.uid(), role)
  ) WITH CHECK (
    public.is_owner(auth.uid())
    OR public.has_role(auth.uid(), 'president')
    OR public.has_role(auth.uid(), role)
  );

-- Entities
CREATE TABLE IF NOT EXISTS public.entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('holdings','parent','subsidiary','ministry')),
  parent_id uuid REFERENCES public.entities(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active','inactive','pending')),
  cabinet jsonb DEFAULT '{}'::jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cabinet read entities" ON public.entities
  FOR SELECT USING (public.is_cabinet(auth.uid()));
CREATE POLICY "owner+president manage entities" ON public.entities
  FOR ALL USING (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'))
  WITH CHECK (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'));

CREATE TABLE IF NOT EXISTS public.entity_status_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  status text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entity_status_pings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cabinet read pings" ON public.entity_status_pings
  FOR SELECT USING (public.is_cabinet(auth.uid()));

INSERT INTO public.entities (id, name, type, status, summary)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Sovereign Holdings LLC', 'holdings', 'active', 'Parent holdings company. Est. 2026.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.entities (name, type, parent_id, status, summary)
SELECT 'RememberFi', 'subsidiary', '00000000-0000-0000-0000-000000000001'::uuid, 'active',
       'Time and location-based reminder platform.'
WHERE NOT EXISTS (SELECT 1 FROM public.entities WHERE name = 'RememberFi');

ALTER PUBLICATION supabase_realtime ADD TABLE public.entities;

-- Subsidiary endpoints + holdings reports
CREATE TABLE IF NOT EXISTS public.subsidiary_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  export_url text NOT NULL,
  shared_secret text NOT NULL,
  last_cursor timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subsidiary_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner+president manage endpoints" ON public.subsidiary_endpoints
  FOR ALL USING (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'))
  WITH CHECK (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'));

CREATE TABLE IF NOT EXISTS public.holdings_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE SET NULL,
  pulled_at timestamptz NOT NULL DEFAULT now(),
  audit_count int DEFAULT 0,
  tickets_open int DEFAULT 0,
  subs_active int DEFAULT 0,
  revenue_cents bigint DEFAULT 0,
  payload jsonb
);
ALTER TABLE public.holdings_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cabinet read holdings reports" ON public.holdings_reports
  FOR SELECT USING (public.is_cabinet(auth.uid()));
CREATE POLICY "owner+president insert holdings reports" ON public.holdings_reports
  FOR INSERT WITH CHECK (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'));

-- Compliance
CREATE TABLE IF NOT EXISTS public.compliance_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  title text NOT NULL,
  jurisdiction text NOT NULL,
  due_date date NOT NULL,
  category text NOT NULL DEFAULT 'filing',
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cabinet read compliance" ON public.compliance_deadlines
  FOR SELECT USING (public.is_cabinet(auth.uid()));
CREATE POLICY "owner+president manage compliance" ON public.compliance_deadlines
  FOR ALL USING (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'))
  WITH CHECK (public.is_owner(auth.uid()) OR public.has_role(auth.uid(), 'president'));

INSERT INTO public.compliance_deadlines (entity_id, title, jurisdiction, due_date, category, notes)
SELECT id, 'Alabama Business Privilege Tax Return', 'Alabama', (date_trunc('year', now()) + interval '3 months 14 days')::date,
       'filing', 'Form BPT-IN/BPT-V annual filing.'
FROM public.entities WHERE type = 'holdings' AND NOT EXISTS (
  SELECT 1 FROM public.compliance_deadlines WHERE title = 'Alabama Business Privilege Tax Return'
);
