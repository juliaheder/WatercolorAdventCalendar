-- Watercolor Advent Calendar: database + storage setup.
-- Paste this whole file into Supabase → SQL Editor → New query, and press Run.
-- It is safe to run again; every statement replaces or skips what already exists.
--
-- Security model
--   * The tables are never readable or writable directly by the browser (RLS on, no policies).
--   * Everything goes through the functions below.
--   * Creating a calendar returns a random edit token. Only its SHA-256 hash is stored.
--     Every write must present the token, so only someone holding the edit link can change it.
--   * The share link holds only the calendar id. get_shared_calendar returns the content
--     of windows whose day has arrived, so the receiver can open doors but not peek or edit.

-- ---------------------------------------------------------------- tables

create table if not exists public.calendars (
  id uuid primary key default gen_random_uuid(),
  edit_token_hash text not null,
  title text not null default 'Merry Christmas' check (char_length(title) <= 120),
  subtitle text not null default '' check (char_length(subtitle) <= 300),
  unlock_mode text not null default 'daily' check (unlock_mode in ('daily', 'all')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_days (
  calendar_id uuid not null references public.calendars (id) on delete cascade,
  day smallint not null check (day between 1 and 25),
  title text not null default '' check (char_length(title) <= 120),
  message text not null default '' check (char_length(message) <= 2000),
  image_path text check (image_path is null or char_length(image_path) <= 300),
  updated_at timestamptz not null default now(),
  primary key (calendar_id, day)
);

-- Added later: a Spotify song/album/playlist per window, stored as "<type>/<id>".
alter table public.calendar_days add column if not exists spotify text;
alter table public.calendar_days drop constraint if exists calendar_days_spotify_check;
alter table public.calendar_days add constraint calendar_days_spotify_check
  check (spotify is null or spotify ~ '^(track|album|playlist|episode|show)/[A-Za-z0-9]{10,40}$');

alter table public.calendars enable row level security;
alter table public.calendar_days enable row level security;
revoke all on public.calendars, public.calendar_days from anon, authenticated;

-- ---------------------------------------------------------------- helpers (not callable from the browser)

create or replace function public._hash_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
$$;

create or replace function public._require_editor(p_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.calendars
    where id = p_id and edit_token_hash = public._hash_token(p_token)
  ) then
    raise exception 'This edit link is not valid.' using errcode = '28000';
  end if;
end
$$;

revoke execute on function public._hash_token(text) from public, anon, authenticated;
revoke execute on function public._require_editor(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------- creator functions

create or replace function public.create_calendar(p_title text default 'Merry Christmas')
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_id uuid;
begin
  insert into public.calendars (edit_token_hash, title)
  values (public._hash_token(v_token), coalesce(nullif(trim(p_title), ''), 'Merry Christmas'))
  returning id into v_id;

  return json_build_object('id', v_id, 'edit_token', v_token);
end
$$;

create or replace function public.get_calendar_for_edit(p_id uuid, p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result json;
begin
  perform public._require_editor(p_id, p_token);

  select json_build_object(
    'id', c.id,
    'title', c.title,
    'subtitle', c.subtitle,
    'unlock_mode', c.unlock_mode,
    'days', coalesce((
      select json_agg(json_build_object(
        'day', d.day, 'title', d.title, 'message', d.message, 'image_path', d.image_path,
        'spotify', d.spotify
      ) order by d.day)
      from public.calendar_days d where d.calendar_id = c.id
    ), '[]'::json)
  )
  into v_result
  from public.calendars c
  where c.id = p_id;

  return v_result;
end
$$;

create or replace function public.update_calendar(
  p_id uuid, p_token text, p_title text, p_subtitle text, p_unlock_mode text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._require_editor(p_id, p_token);

  update public.calendars
  set title = coalesce(nullif(trim(p_title), ''), 'Merry Christmas'),
      subtitle = coalesce(trim(p_subtitle), ''),
      unlock_mode = p_unlock_mode,
      updated_at = now()
  where id = p_id;
end
$$;

-- The older version without a song is removed so only one save_day exists.
drop function if exists public.save_day(uuid, text, int, text, text, text);

create or replace function public.save_day(
  p_id uuid, p_token text, p_day int, p_title text, p_message text, p_image_path text,
  p_spotify text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._require_editor(p_id, p_token);

  if p_image_path is not null and p_image_path not like p_id::text || '/%' then
    raise exception 'That picture does not belong to this calendar.';
  end if;

  if coalesce(trim(p_title), '') = '' and coalesce(trim(p_message), '') = ''
     and p_image_path is null and p_spotify is null then
    delete from public.calendar_days where calendar_id = p_id and day = p_day;
    return;
  end if;

  insert into public.calendar_days (calendar_id, day, title, message, image_path, spotify, updated_at)
  values (p_id, p_day, coalesce(trim(p_title), ''), coalesce(trim(p_message), ''), p_image_path,
          p_spotify, now())
  on conflict (calendar_id, day) do update
  set title = excluded.title,
      message = excluded.message,
      image_path = excluded.image_path,
      spotify = excluded.spotify,
      updated_at = now();
end
$$;

-- ---------------------------------------------------------------- receiver function

-- p_today is the receiver's local date. It is trusted only within one day of the
-- server's date (time zones span roughly ±1 day), so changing the clock doesn't
-- open windows early.
create or replace function public.get_shared_calendar(p_id uuid, p_today date)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := p_today;
  v_cal public.calendars;
  v_open int;
begin
  if v_today is null or abs(v_today - current_date) > 1 then
    v_today := current_date;
  end if;

  select * into v_cal from public.calendars where id = p_id;
  if not found then
    return null;
  end if;

  if v_cal.unlock_mode = 'all' then
    v_open := 25;
  elsif extract(month from v_today) = 12 then
    v_open := least(extract(day from v_today)::int, 25);
  elsif extract(month from v_today) <= 6 then
    v_open := 25; -- after Christmas, everything stays open
  else
    v_open := 0;  -- before December
  end if;

  return json_build_object(
    'id', v_cal.id,
    'title', v_cal.title,
    'subtitle', v_cal.subtitle,
    'unlock_mode', v_cal.unlock_mode,
    'open_count', v_open,
    'days', coalesce((
      select json_agg(json_build_object(
        'day', d.day, 'title', d.title, 'message', d.message, 'image_path', d.image_path,
        'spotify', d.spotify
      ) order by d.day)
      from public.calendar_days d
      where d.calendar_id = p_id and d.day <= v_open
    ), '[]'::json)
  );
end
$$;

create or replace function public.calendar_exists(p_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.calendars where id::text = p_id)
$$;

grant execute on function public.create_calendar(text) to anon, authenticated;
grant execute on function public.get_calendar_for_edit(uuid, text) to anon, authenticated;
grant execute on function public.update_calendar(uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.save_day(uuid, text, int, text, text, text, text) to anon, authenticated;
grant execute on function public.get_shared_calendar(uuid, date) to anon, authenticated;
grant execute on function public.calendar_exists(text) to anon, authenticated;

-- ---------------------------------------------------------------- picture storage

-- Public bucket: pictures are served by URL. File names are random, and the URL of a
-- window's picture is only handed out once that window has unlocked.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('calendar-images', 'calendar-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- True for a file in a calendar's folder that no window uses (a replaced, removed, or
-- abandoned upload).
create or replace function public.calendar_image_is_unused(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.calendar_exists(split_part(p_name, '/', 1))
     and not exists (select 1 from public.calendar_days where image_path = p_name)
$$;

grant execute on function public.calendar_image_is_unused(text) to anon, authenticated;

-- Uploads must go into the folder of a calendar that exists. Nobody can overwrite a
-- picture from the browser. A picture only shows up in a calendar once save_day (which
-- needs the edit token) points a window at it.
--
-- Unused pictures can be deleted, which is how the editor cleans up after a picture is
-- replaced or removed. Pictures a window is using can never be deleted or even listed,
-- so the receiver can't remove pictures or discover upcoming ones.
drop policy if exists "calendar images: see unused uploads" on storage.objects;
create policy "calendar images: see unused uploads"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'calendar-images' and public.calendar_image_is_unused(name));

drop policy if exists "calendar images: delete unused uploads" on storage.objects;
create policy "calendar images: delete unused uploads"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'calendar-images' and public.calendar_image_is_unused(name));

drop policy if exists "calendar images: upload into an existing calendar" on storage.objects;
create policy "calendar images: upload into an existing calendar"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'calendar-images'
  and public.calendar_exists((storage.foldername(name))[1])
);
