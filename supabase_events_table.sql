create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date date not null,
  time text,
  location text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
