-- Execute no SQL Editor depois de esquema.sql e supabase/seed.sql.
-- Todas as colunas `ok` devem retornar true.

select 'cidades ativas' as verificacao, count(*) >= 2 as ok, count(*) as encontrado
from public.cidades where ativa;

select 'locais públicos' as verificacao, count(*) >= 8 as ok, count(*) as encontrado
from public.locais where arquivado_em is null;

select cidade_id,
  count(*) filter (where gratuito) > 0 as possui_gratuito,
  count(*) filter (where not gratuito) > 0 as possui_pago
from public.locais where arquivado_em is null group by cidade_id order by cidade_id;

select 'acessibilidade' as verificacao, count(*) >= 3 as ok, count(*) as encontrado
from public.acessibilidade;

select 'ambiente sensorial' as verificacao, count(*) >= 2 as ok, count(*) as encontrado
from public.ambiente_sensorial;

select 'roteiros temáticos' as verificacao, count(*) >= 2 as ok, count(*) as encontrado
from public.roteiros where tipo = 'tematico' and usuario_id is null;

select 'paradas válidas' as verificacao,
  count(*) >= 4 and count(*) = count(l.id) as ok,
  count(*) as encontrado
from public.roteiro_paradas rp
left join public.locais l on l.id = rp.local_id;

select 'RLS habilitado' as verificacao,
  bool_and(c.relrowsecurity) as ok,
  count(*) as encontrado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'usuarios', 'preferencias', 'cidades', 'locais', 'acessibilidade',
    'roteiros', 'roteiro_paradas'
  );

select 'trigger de perfil' as verificacao,
  exists (
    select 1 from pg_trigger
    where tgname = 'ao_criar_usuario' and not tgisinternal
  ) as ok,
  1 as encontrado;

