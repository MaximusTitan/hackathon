create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_id uuid not null references events(id) on delete cascade,
  registered_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, event_id)
);
