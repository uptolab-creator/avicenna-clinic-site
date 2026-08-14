CREATE TABLE public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  image_url text,
  button_text text,
  button_url text,
  is_active boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.popups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.popups TO authenticated;
GRANT ALL ON public.popups TO service_role;
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active popups"
  ON public.popups FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all popups"
  ON public.popups FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert popups"
  ON public.popups FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update popups"
  ON public.popups FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete popups"
  ON public.popups FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER popups_set_updated_at
BEFORE UPDATE ON public.popups
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('popups', 'popups', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "popups images read" ON storage.objects FOR SELECT
  USING (bucket_id = 'popups');
CREATE POLICY "popups images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'popups' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "popups images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'popups' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "popups images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'popups' AND public.has_role(auth.uid(), 'admin'));
