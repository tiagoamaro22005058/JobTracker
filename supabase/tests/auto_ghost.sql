begin;
create temporary table ghost_test (id text primary key, status text, status_changed_at timestamptz, updated_at timestamptz default now(), notes text) on commit drop;
insert into ghost_test(id,status,status_changed_at) values
('applied','Applied',now()-interval '30 days'),
('waiting','Waiting',now()-interval '31 days'),
('recent','Applied',now()-interval '30 days'+interval '1 second'),
('interview','Interview #1',now()-interval '90 days'),
('offer','Offer',now()-interval '90 days'),
('accepted','Accepted',now()-interval '90 days'),
('interested','Interested',now()-interval '90 days'),
('rejected','Rejected',now()-interval '90 days'),
('withdrawn','Withdrawn',now()-interval '90 days'),
('ghosted','Ghosted',now()-interval '90 days');
create trigger status_clock before insert or update on ghost_test for each row execute function public.set_application_status_changed_at();
create trigger updated_clock before update on ghost_test for each row execute function public.set_application_updated_at();
do $test$
declare job_sql text; n integer;
begin
  update ghost_test set notes='edit only', status_changed_at=now() where id='applied';
  if (select status_changed_at from ghost_test where id='applied') <> now()-interval '30 days' then raise exception 'Detail edit incorrectly reset clock'; end if;
  select replace(command, 'public.applications', 'pg_temp.ghost_test') into job_sql from cron.job where jobname='jobtrack-auto-ghost';
  if job_sql is null then raise exception 'Missing scheduled job'; end if;
  execute job_sql;
  get diagnostics n = row_count;
  if n <> 2 then raise exception 'Expected 2 expired applications, got %',n; end if;
  if exists(select 1 from ghost_test where id in ('applied','waiting') and (status<>'Ghosted' or status_changed_at<>now() or updated_at<>now())) then raise exception 'Incorrect transition'; end if;
  execute job_sql;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Sweep not idempotent'; end if;
  update ghost_test set status='Applied' where id='applied';
  execute job_sql;
  if (select status from ghost_test where id='applied') <> 'Applied' then raise exception 'Manual reopening did not reset clock'; end if;
  insert into ghost_test(id,status,status_changed_at) values ('new','Waiting',now()-interval '90 days');
  if (select status_changed_at from ghost_test where id='new') <> now() then raise exception 'Insert clock is not server controlled'; end if;
end;
$test$;
select 'passed: cutoff, recent, other statuses, edits, reopening, insert ownership, idempotence' as regression;
rollback;
