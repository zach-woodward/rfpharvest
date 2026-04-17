-- Central log of every automated job run (scrapers, digests, future QA layers).
-- The admin dashboard reads from this so any new layer shows up automatically.
create table public.qa_run_results (
  id uuid primary key default gen_random_uuid(),
  layer text not null,
  status text not null check (status in ('running', 'success', 'partial', 'error')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  checked integer not null default 0,
  issues_found integer not null default 0,
  auto_fixed integer not null default 0,
  message text,
  details jsonb not null default '{}'
);

create index idx_qa_run_results_layer_started
  on public.qa_run_results(layer, started_at desc);

alter table public.qa_run_results enable row level security;

create policy "QA results viewable by enterprise users"
  on public.qa_run_results for select to authenticated using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.subscription_tier = 'enterprise'
    )
  );
