-- Projects table
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null
);

-- Prompts table
create table prompts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  done boolean default false not null,
  sort_order integer not null default 0,
  created_at timestamptz default now() not null
);

-- Indexes
create index projects_user_id_idx on projects(user_id);
create index prompts_project_id_idx on prompts(project_id);
create index prompts_user_id_idx on prompts(user_id);

-- Row Level Security
alter table projects enable row level security;
alter table prompts enable row level security;

create policy "Users can manage their own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own prompts"
  on prompts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
