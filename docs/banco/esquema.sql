-- ============================================================================
-- Raízes — esquema de banco para Supabase (Postgres)
-- ============================================================================
-- Decisão 5 em docs/DECISOES.md. Gerado a partir de src/db/schema.ts (SQLite),
-- que continua a fonte de verdade do frontend até a task de migração rodar.
--
-- Como rodar: cole este arquivo inteiro no SQL Editor do Supabase (projeto
-- novo, banco vazio) e execute uma vez. A ordem das tabelas já respeita as
-- dependências de chave estrangeira.
--
-- Convenção: toda tabela e coluna em snake_case, em português, como já é em
-- src/db/schema.ts. Toda linha de dado de pessoa aponta para `usuarios`.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────
-- Extensões
-- ────────────────────────────────────────────────────────────────────────

-- PostGIS dá o tipo geography e o índice espacial usados pela busca por
-- proximidade ("lugares a X metros de mim"). Sem ele a busca vira um scan
-- calculando distância linha a linha.
create extension if not exists postgis;


-- ────────────────────────────────────────────────────────────────────────
-- Tipos
-- ────────────────────────────────────────────────────────────────────────

create type categoria_local as enum (
  'gastronomia', 'historia', 'cultura', 'arte', 'musica',
  'religiao', 'patrimonio', 'comunidade', 'natureza', 'evento'
);

create type dimensao_diversidade as enum (
  'etnica_racial', 'indigena', 'afro_brasileira', 'genero_sexualidade',
  'religiosa', 'geracional', 'acessibilidade', 'neurodiversidade'
);

-- Reaproveitado nas oito colunas de `acessibilidade`.
create type nivel_acessibilidade as enum ('sim', 'parcial', 'nao', 'desconhecido');

create type modo_exploracao as enum (
  'caminhando', 'transporte_publico', 'carro', 'bicicleta', 'indiferente'
);

create type tipo_roteiro as enum ('tematico', 'gerado');

create type papel_usuario as enum ('membro', 'curador');

create type status_revisao as enum ('rascunho', 'em_revisao', 'publicado', 'rejeitado');

create type status_sugestao as enum ('pendente', 'aprovada', 'rejeitada');


-- ============================================================================
-- DOMÍNIO: pessoa e preferências
-- ============================================================================

-- Perfil de aplicação de quem tem conta. NÃO guarda senha — isso é
-- `auth.users`, gerenciado pelo Supabase Auth. Visitante não gera linha
-- aqui: os dados dele ficam só no aparelho até criar conta (decisão do
-- líder, ver docs/ESTADO.md).
create table usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_exibicao text,
  papel papel_usuario not null default 'membro',
  criado_em timestamptz not null default now()
);

comment on table usuarios is
  'Perfil de quem tem conta. A senha e o e-mail ficam em auth.users; aqui só o que o app precisa exibir e o papel (curador ou não).';

-- Preenche `usuarios` sozinho a cada cadastro no Supabase Auth. Sem isso,
-- toda tela que depende de `usuarios` quebra até alguém lembrar de inserir
-- a linha na mão.
create function lidar_novo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, criado_em) values (new.id, now());
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function lidar_novo_usuario();


-- ============================================================================
-- DOMÍNIO: lugar e contexto cultural
-- ============================================================================

-- O coração do produto. `por_que_conhecer`, `historia` e `fonte`
-- continuam obrigatórios — decisão 3, não se reabre aqui.
create table locais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria categoria_local not null,

  latitude double precision not null,
  longitude double precision not null,
  endereco text not null,
  -- Gerada a partir de latitude/longitude — não se escreve direto nela.
  -- É o que o índice espacial abaixo usa pra busca por proximidade.
  geom geography(point, 4326)
    generated always as (st_setsrid(st_makepoint(longitude, latitude), 4326)::geography) stored,

  horarios jsonb,
  gratuito boolean not null default false,
  preco_centavos integer,
  tempo_medio_min integer not null,

  por_que_conhecer text not null,
  historia text not null,

  -- Segurança Cultural — null significa "visitação livre".
  aviso_visitacao text,

  fonte text not null,
  criado_por uuid references usuarios (id),
  atualizado_em timestamptz not null default now(),

  imagem_url text,
  audio_url text
);

comment on column locais.criado_por is
  'Curador que publicou o registro, via revisoes_local. Nulo no conteúdo de carga inicial (seed), cadastrado antes de existir usuário curador.';
comment on column locais.aviso_visitacao is
  'Segurança Cultural: aviso para espaços religiosos em atividade e comunidades tradicionais. Nulo = visitação livre, não "sem aviso a preencher".';

create index idx_locais_geom on locais using gist (geom);
create index idx_locais_categoria on locais (categoria);

-- Mantém `atualizado_em` honesto sem depender de toda tela lembrar de
-- setar o campo na mão.
create function marcar_atualizado()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger locais_marcar_atualizado
  before update on locais
  for each row execute function marcar_atualizado();


create table tags_diversidade (
  id text primary key,
  nome text not null,
  dimensao dimensao_diversidade not null
);

comment on table tags_diversidade is
  'Vocabulário fixo de diversidade (racial, indígena, religiosa, neurodivergente etc). id é um slug estável, não uuid — é referenciado em código e seed.';


create table locais_tags (
  local_id uuid not null references locais (id) on delete cascade,
  tag_id text not null references tags_diversidade (id) on delete cascade,
  primary key (local_id, tag_id)
);

create index idx_locais_tags_tag on locais_tags (tag_id);


-- 1:1 com locais. Estrutural, sobre o LUGAR — pública, diferente da
-- preferência de acessibilidade da PESSOA (essa é sensível, ver preferencias).
create table acessibilidade (
  local_id uuid primary key references locais (id) on delete cascade,
  rampa nivel_acessibilidade not null default 'desconhecido',
  elevador nivel_acessibilidade not null default 'desconhecido',
  banheiro_acessivel nivel_acessibilidade not null default 'desconhecido',
  piso_tatil nivel_acessibilidade not null default 'desconhecido',
  estacionamento_acessivel nivel_acessibilidade not null default 'desconhecido',
  audiodescricao nivel_acessibilidade not null default 'desconhecido',
  libras nivel_acessibilidade not null default 'desconhecido',
  braille nivel_acessibilidade not null default 'desconhecido'
);


-- 1:1 com locais. Também estrutural e pública, sobre o LUGAR.
create table ambiente_sensorial (
  local_id uuid primary key references locais (id) on delete cascade,
  ruido text not null check (ruido in ('baixo', 'medio', 'alto')),
  iluminacao text not null check (iluminacao in ('baixa', 'media', 'alta')),
  movimentacao text not null check (movimentacao in ('baixa', 'media', 'alta')),
  tem_fila boolean not null default false,
  espaco_descanso boolean not null default false
);


create table eventos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid references locais (id) on delete set null,
  titulo text not null,
  descricao text not null,
  inicio_em timestamptz not null,
  fim_em timestamptz,
  gratuito boolean not null default true,
  preco_centavos integer,
  imagem_url text,
  fonte text not null
);

create index idx_eventos_local on eventos (local_id);
create index idx_eventos_inicio on eventos (inicio_em);


-- Fluxo de curadoria: quem cadastra ou edita um local passa por aqui antes
-- de valer. `payload` guarda o conteúdo proposto (mesmos campos de
-- `locais`) até um curador aprovar e o registro em `locais` ser criado ou
-- atualizado.
create table revisoes_local (
  id uuid primary key default gen_random_uuid(),
  local_id uuid references locais (id) on delete set null,
  autor_id uuid not null references usuarios (id),
  status status_revisao not null default 'rascunho',
  payload jsonb not null,
  revisado_por uuid references usuarios (id),
  revisado_em timestamptz,
  motivo_rejeicao text,
  criado_em timestamptz not null default now()
);

comment on table revisoes_local is
  'Curadoria: toda criação ou edição de local passa por aqui. local_id nulo = proposta de local novo, ainda sem registro em locais.';
comment on column revisoes_local.payload is
  'Conteúdo proposto (nome, categoria, por_que_conhecer, historia, fonte, aviso_visitacao...), no formato de locais. Vira UPDATE/INSERT em locais quando status passa a publicado.';

create index idx_revisoes_local_status on revisoes_local (status);
create index idx_revisoes_local_local on revisoes_local (local_id);


-- Sugestão de lugar pela comunidade (não pelo time de curadoria). Mais
-- enxuta que revisoes_local de propósito: qualquer pessoa com conta pode
-- sugerir, sem escrever história nem fonte — isso é trabalho de curadoria,
-- que acontece depois, se a sugestão virar local de verdade.
create table sugestoes_local (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id),
  nome_sugerido text not null,
  categoria_sugerida categoria_local not null,
  latitude double precision not null,
  longitude double precision not null,
  endereco_sugerido text,
  motivo text not null,
  status status_sugestao not null default 'pendente',
  local_id uuid references locais (id),
  revisado_por uuid references usuarios (id),
  revisado_em timestamptz,
  motivo_rejeicao text,
  criado_em timestamptz not null default now()
);

comment on table sugestoes_local is
  'Sugestão de lugar por qualquer usuário da comunidade. Quando aprovada, vira uma revisoes_local de curadoria e, depois, um registro em locais — local_id aqui aponta pro resultado.';

create index idx_sugestoes_local_status on sugestoes_local (status);


-- ============================================================================
-- DOMÍNIO: pessoa e preferências (continuação — depende de locais)
-- ============================================================================

-- Era singleton (id fixo = 1) porque só existia um usuário por aparelho.
-- Com servidor, uma linha por pessoa.
create table preferencias (
  usuario_id uuid primary key references usuarios (id) on delete cascade,
  interesses jsonb not null,
  temas_diversidade jsonb not null,
  modo_exploracao modo_exploracao not null default 'indiferente',
  tempo_disponivel_min integer not null default 240,
  distancia_max_metros integer not null default 5000,
  necessidades_acessibilidade jsonb not null,
  onboarding_concluido boolean not null default false
);

comment on column preferencias.necessidades_acessibilidade is
  'Dado sensível: preferência de acessibilidade/neurodiversidade da PESSOA. Nunca exposto a outros usuários nem em listagem pública. Ver política RLS abaixo.';


create table favoritos (
  usuario_id uuid not null references usuarios (id) on delete cascade,
  local_id uuid not null references locais (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (usuario_id, local_id)
);


-- Passaporte Cultural — registro de descoberta, nunca ranking entre
-- pessoas (mesmo princípio da decisão de produto original).
create table visitas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  local_id uuid not null references locais (id),
  visitado_em timestamptz not null,
  anotacao text,
  foto_uri text
);

create index idx_visitas_usuario on visitas (usuario_id);
create index idx_visitas_local on visitas (local_id);


-- Nota e comentário público sobre um local. Diferente de `visitas`: isto é
-- avaliação do LUGAR, visível a todo mundo — não é o passaporte pessoal.
create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  local_id uuid not null references locais (id) on delete cascade,
  nota smallint not null check (nota between 1 and 5),
  comentario text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (usuario_id, local_id)
);

create trigger avaliacoes_marcar_atualizado
  before update on avaliacoes
  for each row execute function marcar_atualizado();

create index idx_avaliacoes_local on avaliacoes (local_id);


-- ============================================================================
-- DOMÍNIO: roteiros e eventos
-- ============================================================================

-- Roteiro temático (curado pelo time) e roteiro gerado (por um usuário)
-- continuam na mesma tabela, como já era em src/db/schema.ts. A diferença
-- passa a ser o dono: nulo é curado, preenchido é de alguém.
create table roteiros (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios (id) on delete cascade,
  titulo text not null,
  descricao text,
  tipo tipo_roteiro not null,
  duracao_min integer not null,
  distancia_metros integer not null,
  custo_centavos integer,
  imagem_url text,
  criado_em timestamptz not null default now(),

  constraint roteiro_dono_condiz_com_tipo check (
    (tipo = 'tematico' and usuario_id is null) or
    (tipo = 'gerado' and usuario_id is not null)
  )
);

comment on constraint roteiro_dono_condiz_com_tipo on roteiros is
  'Trava em banco a regra de produto: roteiro temático é curado (sem dono), roteiro gerado é sempre de alguém.';


create table roteiro_paradas (
  roteiro_id uuid not null references roteiros (id) on delete cascade,
  local_id uuid not null references locais (id),
  ordem integer not null,
  hora_sugerida text,
  duracao_min integer not null,
  primary key (roteiro_id, ordem)
);

create index idx_roteiro_paradas_local on roteiro_paradas (local_id);


-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Supabase expõe o banco direto pro cliente (app React Native fala com o
-- Postgres via API, sem backend próprio no meio). RLS é o que impede um
-- usuário de ler ou escrever a linha do outro — sem isso, qualquer pessoa
-- com a URL do projeto lê a tabela inteira.

alter table usuarios enable row level security;
alter table preferencias enable row level security;
alter table favoritos enable row level security;
alter table visitas enable row level security;
alter table avaliacoes enable row level security;
alter table locais enable row level security;
alter table revisoes_local enable row level security;
alter table sugestoes_local enable row level security;

-- Helper: papel do usuário autenticado na requisição atual.
create function eh_curador()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from usuarios where id = auth.uid() and papel = 'curador'
  );
$$;

-- usuarios: cada um só vê e edita o próprio perfil.
create policy usuarios_ver_proprio on usuarios
  for select using (id = auth.uid());
create policy usuarios_editar_proprio on usuarios
  for update using (id = auth.uid());

-- preferencias: dado sensível (acessibilidade/neurodiversidade). Só o
-- dono, nunca outro usuário, nunca listagem pública.
create policy preferencias_dono on preferencias
  for all using (usuario_id = auth.uid());

-- favoritos e visitas: privados, só o dono. Visitas em particular nunca
-- devem virar comparação entre pessoas — a política já impede a leitura
-- cruzada que tornaria isso possível.
create policy favoritos_dono on favoritos
  for all using (usuario_id = auth.uid());
create policy visitas_dono on visitas
  for all using (usuario_id = auth.uid());

-- avaliacoes: nota e comentário são públicos por natureza (é uma
-- avaliação do LUGAR). Qualquer um lê; só o autor edita ou apaga a sua.
create policy avaliacoes_leitura_publica on avaliacoes
  for select using (true);
create policy avaliacoes_escrita_propria on avaliacoes
  for insert with check (usuario_id = auth.uid());
create policy avaliacoes_edicao_propria on avaliacoes
  for update using (usuario_id = auth.uid());
create policy avaliacoes_remocao_propria on avaliacoes
  for delete using (usuario_id = auth.uid());

-- locais: conteúdo publicado é público para leitura (é o catálogo do
-- app). Escrita só por curador, e só via fluxo de revisão — não é a tela
-- do app que escreve aqui direto.
create policy locais_leitura_publica on locais
  for select using (true);
create policy locais_escrita_curador on locais
  for insert with check (eh_curador());
create policy locais_edicao_curador on locais
  for update using (eh_curador());

-- revisoes_local: curador vê e cria as próprias; qualquer curador pode
-- ver o que está em revisão (pra revisar o trabalho de outro).
create policy revisoes_ver_proprias_ou_em_revisao on revisoes_local
  for select using (autor_id = auth.uid() or status = 'em_revisao' or eh_curador());
create policy revisoes_criar_curador on revisoes_local
  for insert with check (eh_curador() and autor_id = auth.uid());
create policy revisoes_avaliar_curador on revisoes_local
  for update using (eh_curador());

-- sugestoes_local: qualquer usuário autenticado sugere e vê a própria;
-- curador vê e decide todas.
create policy sugestoes_ver_propria_ou_curador on sugestoes_local
  for select using (usuario_id = auth.uid() or eh_curador());
create policy sugestoes_criar_propria on sugestoes_local
  for insert with check (usuario_id = auth.uid());
create policy sugestoes_avaliar_curador on sugestoes_local
  for update using (eh_curador());

-- tags_diversidade, acessibilidade, ambiente_sensorial, eventos, roteiros
-- (temáticos), roteiro_paradas e locais_tags ficam de fora desta primeira
-- passada de RLS — são conteúdo de catálogo, de leitura pública por
-- natureza, sem dado de pessoa. Ativar RLS neles é decisão em aberto,
-- ver docs/ESTADO.md.
