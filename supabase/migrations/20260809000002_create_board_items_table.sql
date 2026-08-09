create table board_items (
    id uuid primary key default gen_random_uuid(),
    room_id uuid not null references rooms(id) on delete cascade,
    created_by uuid references users(id) on delete set null,
    type text not null,              -- 'sticky' | 'shape' | 'text' | etc.
    content jsonb not null default '{}',
    position_x double precision not null default 0,
    position_y double precision not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_board_items_room_id on board_items(room_id);