alter table public.applications
  drop constraint applications_status_check,
  add constraint applications_status_check check (status in (
    'Interested', 'Applied', 'Waiting', 'Interview #1', 'Interview #2',
    'Interview #3', 'Technical Interview', 'Final Interview', 'Offer',
    'Accepted', 'Rejected', 'Ghosted', 'Withdrawn', 'Declined by me'
  ));
