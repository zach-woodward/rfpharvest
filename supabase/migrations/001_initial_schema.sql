-- Use Supabase's built-in gen_random_uuid()

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  company_name text,
  stripe_customer_id text unique,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
  subscription_status text default 'inactive' check (subscription_status in ('active', 'inactive', 'past_due', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- MUNICIPALITIES
-- ============================================
create table public.municipalities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null default 'NH',
  county text,
  website_url text,
  rfp_page_url text,
  scraper_type text not null default 'generic',
  scraper_config jsonb default '{}',
  active boolean not null default true,
  last_scraped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.municipalities enable row level security;

create policy "Municipalities are viewable by authenticated users"
  on public.municipalities for select to authenticated using (true);

-- ============================================
-- RFPs
-- ============================================
create type rfp_status as enum ('open', 'closed', 'awarded', 'canceled', 'unknown');

create table public.rfps (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete cascade,
  title text not null,
  description text,
  category text,
  status rfp_status not null default 'open',
  posted_date date,
  deadline_date timestamptz,
  pre_bid_date timestamptz,
  qa_deadline timestamptz,
  source_url text,
  document_urls jsonb default '[]',
  contact_name text,
  contact_email text,
  contact_phone text,
  estimated_value text,
  ai_summary text,
  ai_summary_generated_at timestamptz,
  requires_signup boolean default false,
  raw_data jsonb default '{}',
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Dedup: unique per source URL
  unique(source_url)
);

alter table public.rfps enable row level security;

create policy "RFPs viewable by authenticated users"
  on public.rfps for select to authenticated using (true);

-- Indexes for common queries
create index idx_rfps_municipality on public.rfps(municipality_id);
create index idx_rfps_status on public.rfps(status);
create index idx_rfps_deadline on public.rfps(deadline_date);
create index idx_rfps_posted on public.rfps(posted_date);
create index idx_rfps_category on public.rfps(category);
create index idx_rfps_search on public.rfps using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ============================================
-- SCRAPE LOGS
-- ============================================
create table public.scrape_logs (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid references public.municipalities(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'error')),
  rfps_found integer default 0,
  rfps_new integer default 0,
  rfps_updated integer default 0,
  error_message text,
  details jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table public.scrape_logs enable row level security;

-- Only service role / admin can see logs
create policy "Scrape logs viewable by service role"
  on public.scrape_logs for select to authenticated using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.subscription_tier = 'enterprise'
    )
  );

-- ============================================
-- USER ALERTS
-- ============================================
create table public.user_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}',
  -- filters shape: { categories: [], municipalities: [], keywords: [], status: [] }
  email_enabled boolean not null default true,
  frequency text not null default 'daily' check (frequency in ('instant', 'daily', 'weekly')),
  last_notified_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_alerts enable row level security;

create policy "Users can manage own alerts"
  on public.user_alerts for all using (auth.uid() = user_id);

-- ============================================
-- NOTIFICATION HISTORY
-- ============================================
create table public.notification_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  alert_id uuid references public.user_alerts(id) on delete set null,
  rfp_ids uuid[] not null default '{}',
  email_sent_at timestamptz,
  email_status text default 'pending' check (email_status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.notification_history enable row level security;

create policy "Users can view own notifications"
  on public.notification_history for select using (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger update_municipalities_updated_at
  before update on public.municipalities
  for each row execute function public.update_updated_at();

create trigger update_rfps_updated_at
  before update on public.rfps
  for each row execute function public.update_updated_at();

create trigger update_user_alerts_updated_at
  before update on public.user_alerts
  for each row execute function public.update_updated_at();
