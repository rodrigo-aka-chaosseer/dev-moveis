-- Migração incremental aplicada ao projeto que já possuía o esquema anterior.
-- Preserva os dados e classifica locais legados pela cidade mais próxima.
begin;

create table if not exists public.cidades (
  id text primary key,
  nome text not null,
  uf char(2) not null check (uf = upper(uf)),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  ativa boolean not null default true
);

insert into public.cidades (id, nome, uf, latitude, longitude, ativa) values
  ('salvador', 'Salvador', 'BA', -12.9714, -38.5014, true),
  ('recife', 'Recife', 'PE', -8.0476, -34.8770, true)
on conflict (id) do update set
  nome = excluded.nome, uf = excluded.uf, latitude = excluded.latitude,
  longitude = excluded.longitude, ativa = excluded.ativa;

alter table public.locais add column if not exists cidade_id text;
update public.locais l set cidade_id = case
  when st_distance(l.geom, st_setsrid(st_makepoint(-34.8770, -8.0476), 4326)::geography)
     < st_distance(l.geom, st_setsrid(st_makepoint(-38.5014, -12.9714), 4326)::geography)
    then 'recife'
  else 'salvador'
end
where cidade_id is null;
alter table public.locais alter column cidade_id set not null;

do $$ begin
  alter table public.locais add constraint locais_cidade_id_fkey
    foreign key (cidade_id) references public.cidades (id) on delete restrict;
exception when duplicate_object then null; end $$;
create index if not exists idx_locais_cidade on public.locais (cidade_id);

alter table public.preferencias add column if not exists cidade_id text;
do $$ begin
  alter table public.preferencias add constraint preferencias_cidade_id_fkey
    foreign key (cidade_id) references public.cidades (id) on delete restrict;
exception when duplicate_object then null; end $$;

alter table public.cidades enable row level security;
do $$ begin
  create policy cidades_leitura_publica on public.cidades
    for select using (ativa or eh_curador());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy cidades_escrita_curador on public.cidades
    for all using (eh_curador()) with check (eh_curador());
exception when duplicate_object then null; end $$;

commit;

