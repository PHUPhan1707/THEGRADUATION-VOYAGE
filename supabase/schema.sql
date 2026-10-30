-- THE GRADUATION VOYAGE – Supabase schema
-- Cách dùng: Supabase Dashboard → SQL Editor → dán toàn bộ file này → Run.
-- Sau đó: Authentication → Users → "Add user" để tạo tài khoản admin (email + mật khẩu mạnh).

create extension if not exists "pgcrypto";

/* ───────────── Bảng khách mời ───────────── */
create table if not exists public.guests (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 120),
  category         text not null default 'friend' check (category in ('friend','family','teacher','special')),
  personal_message text check (personal_message is null or char_length(personal_message) <= 500),
  invite_id        text not null unique check (char_length(invite_id) >= 8),
  rsvp_status      text not null default 'pending' check (rsvp_status in ('pending','attending','declined')),
  rsvp_message     text check (rsvp_message is null or char_length(rsvp_message) <= 500),
  revoked          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

/* ───────────── Bảng cấu hình sự kiện (1 dòng, id = 'main') ───────────── */
create table if not exists public.event_config (
  id              text primary key default 'main' check (id = 'main'),
  graduate_name   text not null,
  university      text not null,
  graduation_date date not null,
  ceremony_time   time,
  venue           text not null,
  maps_link       text,
  portrait_url    text,
  og_image_url    text,
  music_url       text,
  updated_at      timestamptz not null default now()
);

/* ───────────── Row Level Security ───────────── */
alter table public.guests       enable row level security;
alter table public.event_config enable row level security;

-- Admin (đã đăng nhập) toàn quyền
drop policy if exists "admin all guests" on public.guests;
create policy "admin all guests" on public.guests
  for all to authenticated using (true) with check (true);

drop policy if exists "admin all event_config" on public.event_config;
create policy "admin all event_config" on public.event_config
  for all to authenticated using (true) with check (true);

-- Mọi người được ĐỌC cấu hình sự kiện (ngày, giờ, địa điểm – là thông tin công khai của thiệp)
drop policy if exists "public read event_config" on public.event_config;
create policy "public read event_config" on public.event_config
  for select to anon, authenticated using (true);

-- Khách (anon) KHÔNG có quyền truy cập trực tiếp bảng guests.
-- Họ chỉ dùng 2 hàm bên dưới, mỗi hàm chỉ động đến đúng 1 dòng theo invite_id.

/* ───────────── Hàm cho khách (security definer) ───────────── */
create or replace function public.get_guest_by_invite(p_invite_id text)
returns setof public.guests
language sql
security definer
set search_path = public
as $$
  select * from public.guests
  where invite_id = p_invite_id and revoked = false
  limit 1;
$$;

create or replace function public.submit_rsvp(p_invite_id text, p_status text, p_message text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  if p_status not in ('attending','declined') then
    return false;
  end if;

  update public.guests
     set rsvp_status  = p_status,
         rsvp_message = nullif(left(coalesce(p_message, ''), 500), ''),
         updated_at   = now()
   where invite_id = p_invite_id and revoked = false;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

revoke all on function public.get_guest_by_invite(text) from public;
revoke all on function public.submit_rsvp(text, text, text) from public;
grant execute on function public.get_guest_by_invite(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, text, text) to anon, authenticated;

/* ───────────── Dữ liệu cấu hình ban đầu ───────────── */
insert into public.event_config (id, graduate_name, university, graduation_date, ceremony_time, venue, maps_link)
values (
  'main',
  'Phan An Phú',
  'Trường Đại học Quốc tế – ĐHQG TP.HCM',
  '2026-11-28',
  null,
  'Nhà điều hành Sinh viên',
  'https://maps.google.com/?q=Nhà+điều+hành+Sinh+viên+ĐHQG+TP.HCM'
)
on conflict (id) do nothing;
