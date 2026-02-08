create table revisions (
  id uuid primary key,
  document_id text not null,
  created_at timestamptz default now(),
  manifest_key text not null
);
