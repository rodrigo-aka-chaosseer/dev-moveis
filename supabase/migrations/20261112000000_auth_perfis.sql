-- RAÍZES-34: mantém um perfil público para toda conta do Supabase Auth.
-- A migração é idempotente e também corrige contas criadas antes do trigger.

create or replace function public.lidar_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nome_exibicao, criado_em)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'nome'), ''),
    coalesce(new.created_at, now())
  )
  on conflict (id) do update set
    nome_exibicao = coalesce(public.usuarios.nome_exibicao, excluded.nome_exibicao);
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.lidar_novo_usuario();

insert into public.usuarios (id, nome_exibicao, criado_em)
select
  id,
  nullif(trim(raw_user_meta_data ->> 'nome'), ''),
  coalesce(created_at, now())
from auth.users
on conflict (id) do update set
  nome_exibicao = coalesce(public.usuarios.nome_exibicao, excluded.nome_exibicao);

