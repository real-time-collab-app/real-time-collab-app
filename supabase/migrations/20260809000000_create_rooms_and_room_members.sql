create table rooms (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table room_members (
    room_id uuid not null references rooms(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    role text not null default 'member',  -- 'owner' | 'member'
    joined_at timestamptz not null default now(),
    primary key (room_id, user_id)
);