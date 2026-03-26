-- Enable the pgvector extension
create extension if not exists vector;

-- ==========================================
-- FAQ Embeddings (vector search)
-- ==========================================
create table if not exists faq_embeddings (
  id text primary key,
  question text not null,
  answer text not null,
  embedding vector(512) not null
);

create index if not exists faq_embeddings_embedding_idx
  on faq_embeddings
  using hnsw (embedding vector_cosine_ops);

create or replace function match_faqs(
  query_embedding vector(512),
  match_threshold float default 0.0,
  match_count int default 1
)
returns table (
  id text,
  question text,
  answer text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    fe.id,
    fe.question,
    fe.answer,
    1 - (fe.embedding <=> query_embedding) as similarity
  from faq_embeddings fe
  where 1 - (fe.embedding <=> query_embedding) > match_threshold
  order by fe.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ==========================================
-- Orders
-- ==========================================
create table if not exists orders (
  id text primary key,
  customer_name text not null,
  phone text not null,
  collection_date date not null,
  time_window text not null,
  status text not null,
  items text[] not null default '{}',
  waste_location text not null,
  floor_number integer,
  has_lift boolean,
  notes text default ''
);

create index if not exists orders_phone_idx on orders (phone);

-- ==========================================
-- Conversations (chat log)
-- ==========================================
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  timestamp timestamptz default now() not null,
  phone_number text,
  user_message text not null,
  agent_reply text not null,
  escalated boolean default false,
  escalation_reason text,
  messages jsonb not null default '[]'
);

create index if not exists conversations_session_id_idx on conversations (session_id);
create index if not exists conversations_timestamp_idx on conversations (timestamp desc);

-- ==========================================
-- Row Level Security
-- ==========================================

-- faq_embeddings: public read, service_role write
alter table faq_embeddings enable row level security;
create policy "Allow public read access" on faq_embeddings for select to anon, authenticated using (true);
create policy "Allow service_role insert" on faq_embeddings for insert to service_role with check (true);
create policy "Allow service_role update" on faq_embeddings for update to service_role using (true) with check (true);
create policy "Allow service_role delete" on faq_embeddings for delete to service_role using (true);

-- orders: public read, service_role write
alter table orders enable row level security;
create policy "public_read_orders" on orders for select to anon, authenticated using (true);
create policy "service_insert_orders" on orders for insert to service_role with check (true);
create policy "service_update_orders" on orders for update to service_role using (true) with check (true);
create policy "service_delete_orders" on orders for delete to service_role using (true);

-- conversations: service_role only
alter table conversations enable row level security;
create policy "service_read_conversations" on conversations for select to service_role using (true);
create policy "service_insert_conversations" on conversations for insert to service_role with check (true);
