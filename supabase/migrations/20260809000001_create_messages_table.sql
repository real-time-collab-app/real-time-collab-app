create table messages (
    id uuid primary key default gen_random_uuid(),
    room_id uuid not null references rooms(id) on delete cascade,
    user_id uuid references users(id) on delete set null,
    parent_id uuid references messages(id) on delete cascade,
    content text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_messages_room_id on messages(room_id, created_at);
create index idx_messages_parent_id on messages(parent_id);