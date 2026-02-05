-- Make RFPs and municipalities publicly readable (no login required to browse)
DROP POLICY IF EXISTS "Municipalities are viewable by authenticated users" ON public.municipalities;
CREATE POLICY "Municipalities are viewable by anyone" ON public.municipalities FOR SELECT USING (true);

DROP POLICY IF EXISTS "RFPs viewable by authenticated users" ON public.rfps;
CREATE POLICY "RFPs viewable by anyone" ON public.rfps FOR SELECT USING (true);
