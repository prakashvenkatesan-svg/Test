ALTER TABLE public.personal_details
  ADD COLUMN IF NOT EXISTS politically_exposed VARCHAR(3);
