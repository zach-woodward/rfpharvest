-- ============================================
-- SAVED RFPs (Watchlist)
-- ============================================
CREATE TABLE public.saved_rfps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rfp_id uuid NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, rfp_id)
);

ALTER TABLE public.saved_rfps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved RFPs"
  ON public.saved_rfps FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Add bid_requirements to RFPs
-- ============================================
ALTER TABLE public.rfps ADD COLUMN IF NOT EXISTS bid_requirements jsonb DEFAULT '[]';
-- Shape: [{ "label": "General Liability Insurance", "met": null }, ...]
