# Decisões

Uma decisão por bloco. Decisão que está aqui não volta pra discussão sem fato
novo. Se mudar, escreve uma decisão nova em vez de apagar a antiga.

---

## 1. Expo SDK 57, sem depender do Expo Go

Data: 21/08/2026

O Expo Go que está nas lojas está travado no SDK 54 desde maio de 2026 (as
versões novas seguem esperando aprovação da Apple), e cada versão do Expo Go
só funciona com uma versão de SDK.

Por enquanto o projeto roda no Expo Go normalmente, porque ainda não usamos
nada de código nativo. Quando entrar mapa, notificação ou banco com listener,
vai ser preciso gerar um development build: um APK instalado uma vez por
pessoa, sendo que o dia a dia continua `npx expo start`.

---

## 2. Estilo com StyleSheet, sem framework de CSS

Data: 21/08/2026

Cogitei entrar com NativeWind (Tailwind para React Native). Decidi que não:
somos quatro pessoas com experiências diferentes e sem muito tempo pra
alinhar, e obrigar todo mundo a aprender uma sintaxe nova pra fazer as
primeiras telas custa mais do que economiza.

`StyleSheet` é o padrão do React Native, funciona sem configurar nada e todo
tutorial na internet usa ele. As cores e medidas ficam centralizadas em
`src/theme/tokens.ts`, que é o que realmente evita as telas ficarem
desencontradas.

Se mais pra frente a gente quiser NativeWind, dá pra migrar tela por tela.

---

## 3. O modelo de dados exige contexto cultural

Data: 21/08/2026

Em `src/db/schema.ts`, os campos `porQueConhecer`, `historia` e `fonte` são
obrigatórios em todo lugar cadastrado, e existe um campo `avisoVisitacao` para
espaços religiosos em atividade e comunidades tradicionais.

Isso é de propósito. O que separa o nosso app de um Google Maps é justamente o
contexto, então é melhor o código impedir o cadastro de um lugar sem história
do que a gente descobrir isso na véspera da apresentação.

O schema ainda não está ligado em nenhuma tela. Ele está no repositório como
referência de tudo que precisa ser levantado sobre cada lugar.

---

## 4. Login entra no escopo, com sessão só no aparelho

Data: 03/09/2026

Login estava fora de escopo. O grupo decidiu que entra agora (RAÍZES-07, issue #9),
mas sem servidor: a tela pede e-mail e senha, guarda só o e-mail, o modo
(visitante ou identificado) e a data de entrada, e nada mais. A senha fica na
memória do formulário, é conferida apenas como "preenchida" e é descartada ao
entrar. Sem back-end não existe autenticação de verdade, e fingir que existe
(hash caseiro, senha gravada) seria pior do que não ter.

Cogitei `expo-secure-store` e o SQLite que já está instalado. Descartei os
dois para esta etapa: o SecureStore não roda na web, e é pela exportação web
que a gente confere tela sem emulador; o SQLite nunca foi aberto por tela
nenhuma e seria encanamento novo para guardar três strings. Ficou
`@react-native-async-storage/async-storage`, que roda no Expo Go, no build
nativo e na web, numa chave versionada (`raizes.sessao.v1`).

Quando o back-end entrar, o token vai para o `expo-secure-store` (Keychain e
Keystore), a senha passa a ir na requisição e continua sem ser gravada, e a
chave sobe para `v2` com leitura da `v1`. Os pontos exatos estão marcados no
código com o comentário `BACKEND:`. A restrição de abas para visitante fica
com o dono das abas, usando o `useSessao()` de `src/sessao/`.

---

## 5. Backend é Supabase, com Postgres

Data: 14/09/2026

Fecha a decisão 3 do `docs/ESTADO.md`. O back-end do Raízes é Supabase:
Postgres gerenciado, autenticação pronta e API que o app fala direto, sem
servidor próprio no meio.

O esquema em `docs/banco/esquema.sql` parte do que já existia em
`src/db/schema.ts`, com uma mudança estrutural: dado de pessoa agora tem
dono. `preferencias`, `favoritos` e `visitas` passam a apontar para
`usuarios`, e `usuarios` referencia `auth.users` do Supabase em vez de
guardar senha — que é exatamente o erro de segurança mais comum em projeto
de faculdade. Visitante continua sem gerar linha em `usuarios`: os dados
dele ficam só no aparelho até criar conta, mesma lógica da decisão 4.

Entram também tabelas novas que o servidor força a existir: `avaliacoes`
(nota e comentário público sobre um lugar), `revisoes_local` (fluxo de
curadoria de quem cadastra ou edita um lugar) e `sugestoes_local` (sugestão
de lugar pela comunidade, mais simples que uma revisão de curadoria).

Row Level Security fica ligado em toda tabela com dado de pessoa. O caso que
mais importa: `preferencias.necessidades_acessibilidade` é dado sensível — a
política de acesso garante que só a própria pessoa lê, nunca outro usuário
nem listagem pública.

A migração de `src/db/schema.ts` de SQLite para Postgres é uma task própria
da semana, não desta entrega. Até ela rodar, o app continua sem persistência
real, exatamente como hoje.

---

## 6. Curadoria roda sem trigger de processo, e curador pode aprovar a própria revisão

Data: 14/09/2026

Duas perguntas que a auditoria do esquema (PR #18) levantou, decididas juntas
porque são a mesma aposta: quanto travar o processo de curadoria vale a pena
pro tamanho do time hoje.

**Trigger forçando toda alteração em `locais` a nascer como revisão:** não
implementado agora. `revisoes_local` existe e é o caminho esperado, mas o
banco não impede um curador de escrever direto em `locais`. Com quatro
pessoas, o risco de alteração descuidada é baixo, e trigger de processo em
time pequeno atrapalha mais do que protege — o custo de tirar depois é maior
que o de colocar quando começar a doer.

**Curador pode aprovar a própria revisão:** pode. Exigir revisor distinto
trava o fluxo mais do que ganha em qualidade nesse tamanho de time.

Os dois são risco aceito conscientemente, não esquecimento. O gatilho pra
revisitar os dois é o mesmo: **quando houver colaborador fora do grupo
escrevendo em `locais`** — aí o trigger de processo e a exigência de revisor
distinto passam a valer o atrito que custam.

---

## 7. Conta apagada anonimiza autoria, não cascateia em cima da curadoria

Data: 14/09/2026

A auditoria do esquema achou oito chaves estrangeiras sem política de
`ON DELETE` — hoje elas assumem `NO ACTION`, ou seja, apagar um usuário
falha com erro de integridade em vez de decidir alguma coisa. Isso precisava
de uma regra, e a regra depende do que cada FK realmente representa.

O ativo mais caro do projeto é o conteúdo curado (decisão 3). Apagar a conta
de quem cadastrou um lugar não pode apagar o lugar. Por isso:

- **Cascata** (`on delete cascade`) pro que é puramente pessoal e sem valor
  fora do dono: `favoritos`, `preferencias`, `visitas`, `roteiros` (e
  `roteiro_paradas` por consequência do roteiro), `avaliacoes`. Já estava
  assim pra a maioria; ficou explícito em todas.
- **Autoria vira nula** (`on delete set null`) pra curadoria: `locais.criado_por`,
  `revisoes_local.autor_id`, `revisoes_local.revisado_por`,
  `sugestoes_local.usuario_id`, `sugestoes_local.revisado_por`. O registro
  continua existindo — só a autoria some. `revisoes_local.autor_id` e
  `sugestoes_local.usuario_id` deixaram de ser `not null` pra isso funcionar;
  toda leitura desses campos precisa tratar nulo como "autoria removida", não
  como dado corrompido.
- **Referência a lugar não é referência a usuário**, e as duas ganharam regras
  diferentes: `roteiro_paradas.local_id` e `visitas.local_id` mantêm a falha
  por integridade (`on delete restrict`, explícito no SQL) — um lugar não
  deveria ser apagado em produção, o certo é despublicar, então tentar
  apagar um lugar que é parada de roteiro ou tem visita registrada tem que
  falhar alto. Já `sugestoes_local.local_id` cascateia: uma sugestão sem o
  lugar que ela virou não tem sentido nenhum.

De quebra, a auditoria também achou seis tabelas com RLS ligado mas sem
`FORCE ROW LEVEL SECURITY` (`visitas`, `favoritos`, `sugestoes_local`,
`preferencias`, `avaliacoes`, `roteiros`) — sem `FORCE`, o dono da tabela
ignora as políticas. No Supabase isso raramente importa na prática, mas é
defesa em profundidade barata, então entrou junto nesta correção.

---

## 8. Tudo que aponta para `locais` se divide em só dois grupos, e `locais` ganha arquivamento

Data: 14/09/2026

Uma segunda auditoria, já em cima da main mergeada, achou duas coisas que a
decisão 7 tinha deixado incoerentes entre si.

**A primeira: seis referências a `locais` com quatro políticas de exclusão
diferentes**, e duas delas nunca executavam. `favoritos.local_id` e
`avaliacoes.local_id` estavam com `cascade` (a decisão 7 dizia isso —
estava errada nesse ponto específico), mas como `visitas.local_id` e
`roteiro_paradas.local_id` já bloqueavam a exclusão com `restrict`, a
cascata nunca chegava a rodar de verdade. E `eventos.local_id` e
`revisoes_local.local_id` faziam `set null`, o que deixava evento
flutuando sem lugar e revisão de curadoria sem dizer mais o que revisou —
prova em teste real: apagar um local deixava a revisão viva com
`local_id` nulo.

A correção simplifica pra dois grupos, e só dois:

- **Cascata**, pro que é do próprio lugar e morre com ele:
  `locais_tags`, `acessibilidade`, `ambiente_sensorial`,
  `sugestoes_local.local_id` (já estava certo nesse).
- **Restrict**, pra histórico de pessoa e de curadoria, que não pode
  sumir em silêncio: `favoritos.local_id`, `avaliacoes.local_id`,
  `visitas.local_id`, `roteiro_paradas.local_id`, `eventos.local_id`,
  `revisoes_local.local_id`. `revisoes_local.local_id` continua aceitando
  nulo — nulo ali significa "proposta de local novo, ainda sem registro em
  `locais`", que é outra coisa e não mudou.

**A segunda: a decisão 7 dizia "lugar não se apaga, se despublica", mas
não existia despublicar.** `locais` não tinha nenhuma coluna de
publicação, arquivamento ou status, e a leitura pública era
`using (true)` sem filtro nenhum. Um lugar cadastrado errado, uma vez
favoritado por alguém, ficava preso pra sempre — `restrict` bloqueia o
DELETE, mas não existia outro caminho de saída.

`locais` ganha `arquivado_em timestamptz` (nulo = publicado). A política
de leitura pública passa a filtrar por `arquivado_em is null`, exceto pra
curador, que continua vendo o lugar arquivado — é ele quem desarquiva.
DELETE em `locais` continua sem política nenhuma, de propósito: apagar
lugar nunca foi o caminho certo, e agora existe o caminho certo pra valer.

E o `usuarios` ficou de fora da lista de `FORCE ROW LEVEL SECURITY` da
decisão 7 por engano — guarda dado de pessoa (nome, papel) igual às
outras seis. Entrou junto nesta correção.

Comportamento verificado com linha real, não só DDL: apagar um lugar
favoritado falha por `favoritos_local_id_fkey`; arquivar um lugar some da
leitura pública mas continua visível pro curador; apagar a conta de quem
curou mantém o lugar e a revisão vivos, só com autoria nula; isolamento de
RLS entre duas usuárias continua intacto depois da mudança na política de
`locais`.
