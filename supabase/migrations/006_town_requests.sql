-- Town/city request table for users to request coverage expansion
CREATE TABLE public.town_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  town_name text NOT NULL,
  state text NOT NULL DEFAULT 'NH',
  email text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE town_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request (no auth required)
CREATE POLICY "Anyone can insert town requests"
  ON town_requests FOR INSERT
  WITH CHECK (true);

-- Only enterprise (admin) users can view requests
CREATE POLICY "Enterprise can view town requests"
  ON town_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'enterprise'
    )
  );

-- Enterprise can update status
CREATE POLICY "Enterprise can update town requests"
  ON town_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'enterprise'
    )
  );
