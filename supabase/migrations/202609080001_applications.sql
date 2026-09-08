-- Run once in the Supabase SQL editor or with `supabase db push`.
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null check (length(trim(company_name)) between 1 and 160),
  position text not null check (length(trim(position)) between 1 and 200),
  job_link text not null default '' check (length(job_link) <= 2048 and (job_link = '' or job_link ~* '^https?://[^[:space:]]+$')),
  location text not null default '' check (length(location) <= 200),
  application_date date not null,
  status text not null default 'Applied' check (status in ('Interested','Applied','Waiting','Interview #1','Interview #2','Interview #3','Technical Interview','Final Interview','Offer','Accepted','Rejected','Ghosted','Withdrawn')),
  notes text not null default '' check (length(notes) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_user_date_idx on public.applications(user_id, application_date desc);
create index applications_user_status_idx on public.applications(user_id, status);
alter table public.applications enable row level security;
create policy "Read own applications" on public.applications for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own applications" on public.applications for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own applications" on public.applications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own applications" on public.applications for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.applications from anon;
revoke all on public.applications from authenticated;
grant select, delete on public.applications to authenticated;
grant insert (user_id, company_name, position, job_link, location, application_date, status, notes) on public.applications to authenticated;
grant update (company_name, position, job_link, location, application_date, status, notes) on public.applications to authenticated;
create function public.set_application_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger applications_updated_at before update on public.applications for each row execute function public.set_application_updated_at();
