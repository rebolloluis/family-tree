-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  member_id uuid,
  created_at timestamptz default now()
);

-- Families
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

-- Members
create table public.members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families on delete cascade not null,
  parent_id uuid references public.members on delete set null,
  name text not null,
  born integer,
  died integer,
  relation text,
  note text,
  photo_url text,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.members enable row level security;

-- Profiles: users can read all, only edit their own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Families: anyone can read, only owner can insert/update/delete
create policy "families_select" on public.families for select using (true);
create policy "families_insert" on public.families for insert with check (auth.uid() = owner_id);
create policy "families_update" on public.families for update using (auth.uid() = owner_id);
create policy "families_delete" on public.families for delete using (auth.uid() = owner_id);

-- Members: anyone can read, logged-in users can insert, owner of family can update/delete
create policy "members_select" on public.members for select using (true);
create policy "members_insert" on public.members for insert with check (auth.uid() is not null);
create policy "members_update" on public.members for update using (
  auth.uid() in (select owner_id from public.families where id = family_id)
);
create policy "members_delete" on public.members for delete using (
  auth.uid() in (select owner_id from public.families where id = family_id)
);
