-- Add family groups and shared reminder support

CREATE TABLE public.family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.family_group_members (
  group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family groups owner or member select" ON public.family_groups
  FOR SELECT USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.family_group_members m
      WHERE m.group_id = public.family_groups.id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "family groups owner insert" ON public.family_groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "family groups owner update" ON public.family_groups
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "family groups owner delete" ON public.family_groups
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "family group members select" ON public.family_group_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = (
      SELECT owner_id FROM public.family_groups WHERE id = group_id
    )
  );

CREATE POLICY "family group members insert" ON public.family_group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = (
      SELECT owner_id FROM public.family_groups WHERE id = group_id
    )
  );

CREATE POLICY "family group members update" ON public.family_group_members
  FOR UPDATE USING (
    auth.uid() = user_id
    OR auth.uid() = (
      SELECT owner_id FROM public.family_groups WHERE id = group_id
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = (
      SELECT owner_id FROM public.family_groups WHERE id = group_id
    )
  );

CREATE POLICY "family group members delete" ON public.family_group_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR auth.uid() = (
      SELECT owner_id FROM public.family_groups WHERE id = group_id
    )
  );

ALTER TABLE public.reminders
  ADD COLUMN created_by uuid;

ALTER TABLE public.reminders
  ADD COLUMN group_id uuid REFERENCES public.family_groups(id) ON DELETE SET NULL;

ALTER TABLE public.reminders
  ADD COLUMN assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.reminders SET created_by = user_id WHERE created_by IS NULL;

ALTER TABLE public.reminders ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE public.notifications
  ADD COLUMN group_id uuid REFERENCES public.family_groups(id) ON DELETE SET NULL;

CREATE POLICY "reminders owner or group access" ON public.reminders
  FOR ALL
  USING (
    auth.uid() = user_id
    OR auth.uid() = created_by
    OR (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.family_group_members m
        WHERE m.group_id = group_id
          AND m.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = created_by
    OR (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.family_group_members m
        WHERE m.group_id = group_id
          AND m.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "notifications owner or group access" ON public.notifications
  FOR ALL
  USING (
    auth.uid() = user_id
    OR (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.family_group_members m
        WHERE m.group_id = group_id
          AND m.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.family_group_members m
        WHERE m.group_id = group_id
          AND m.user_id = auth.uid()
      )
    )
  );
