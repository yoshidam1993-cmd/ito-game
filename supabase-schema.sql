-- =============================================
-- ito game schema
-- Supabase の SQL エディタで実行してください
-- =============================================

-- rooms テーブル
create table if not exists rooms (
  id            uuid primary key default gen_random_uuid(),
  invite_code   text unique not null,
  host_player_id uuid,                    -- 後からplayersのidを参照
  phase         text not null default 'waiting',  -- waiting / playing / revealing
  topic         text,
  created_at    timestamptz not null default now()
);

-- players テーブル
create table if not exists players (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references rooms(id) on delete cascade,
  name          text not null,
  number        int,                      -- 割り当て数字 1〜100
  speak_order   int,                      -- 発言した順番（1始まり）
  is_ready      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- インデックス
create index if not exists rooms_invite_code_idx on rooms(invite_code);
create index if not exists players_room_id_idx on players(room_id);

-- =============================================
-- Row Level Security（RLS）
-- 今回はMVPなので全員読み書きOKに設定
-- =============================================
alter table rooms enable row level security;
alter table players enable row level security;

-- rooms: 誰でも読み書きOK
create policy "rooms: anyone can read"  on rooms for select using (true);
create policy "rooms: anyone can insert" on rooms for insert with check (true);
create policy "rooms: anyone can update" on rooms for update using (true);

-- players: 誰でも読み書きOK
create policy "players: anyone can read"  on players for select using (true);
create policy "players: anyone can insert" on players for insert with check (true);
create policy "players: anyone can update" on players for update using (true);

-- =============================================
-- Realtime を有効化
-- SupabaseダッシュボードのDatabase > Replicationから
-- rooms と players にチェックを入れてください
-- （または以下のSQLを実行）
-- =============================================
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table rooms, players;
commit;
