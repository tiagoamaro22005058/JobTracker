-- Track time in the current status independently of note/detail edits.
alter table public.applications add column status_changed_at timestamptz;
update public.applications set status_changed_at = greatest(created_at, updated_at);
alter table public.applications alter column status_changed_at set default now();
alter table public.applications alter column status_changed_at set not null;

create function public.set_application_status_changed_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    new.status_changed_at = now();
  elsif new.status is distinct from old.status then
    new.status_changed_at = now();
  else
    new.status_changed_at = old.status_changed_at;
  end if;
  return new;
end;
$$;
revoke all on function public.set_application_status_changed_at() from public, anon, authenticated;
create trigger applications_status_changed_at
before insert or update on public.applications
for each row execute function public.set_application_status_changed_at();

create index applications_auto_ghost_idx on public.applications(status_changed_at)
where status in ('Applied', 'Waiting');

-- Run in the database even when nobody has the website open.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
select cron.schedule(
  'jobtrack-auto-ghost',
  '0 3 * * *',
  $job$
  update public.applications
  set status = 'Ghosted'
  where status in ('Applied', 'Waiting')
    and status_changed_at <= now() - interval '30 days';
  $job$
);
