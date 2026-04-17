-- National expansion: drop the NH-specific default on municipalities.state
-- so every municipality must declare its state explicitly.
alter table public.municipalities
  alter column state drop default;

-- Index for state-based queries (state pages, filters).
create index if not exists idx_municipalities_state
  on public.municipalities(state);
