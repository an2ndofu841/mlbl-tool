create table if not exists public.live_schedules (
  id bigserial primary key,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  venue text,
  price text,
  ticket_url text,
  announce_image_url text,
  notes text,
  open_time text,
  calendar_event_id text,
  last_announced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_schedules_start_at_idx
  on public.live_schedules (start_at);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists live_schedules_set_updated_at on public.live_schedules;
create trigger live_schedules_set_updated_at
before update on public.live_schedules
for each row execute procedure public.set_updated_at();
