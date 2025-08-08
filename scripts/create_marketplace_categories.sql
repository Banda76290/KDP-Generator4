create table if not exists marketplace_categories (
  id varchar primary key,
  marketplace varchar not null,
  category_path text not null,
  display_name varchar not null,
  level int not null,
  is_selectable boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);
