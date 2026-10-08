# Estado do projeto

Atualizar no fim de cada aula. É daqui que saem as tasks da semana.

## Grupo

RAÍZES — tema Diversidade. 3º lugar no pitch da solução (163 pontos, média 9,59).

## O que já tem

- [x] Escopo funcional escrito
- [x] Protótipo navegável de 10 telas
- [x] Repositório e base do projeto
- [x] RAÍZES-01 — tela de abertura
- [x] RAÍZES-02 — seleção de interesses (Maria Clara, PR #6)
- [x] RAÍZES-03 — navegação por abas (Levi)
- [ ] RAÍZES-04 — tela de perfil (branch `raizes-tela-perfil`, sem PR; virou a #30)
- [x] RAÍZES-07 — login e sessão no aparelho (Josias, PR #12)
- [x] RAÍZES-08 — validação do login (Maria Clara, PR #14)
- [x] RAÍZES-09 — abertura redireciona por onboarding concluído (Josias)
- [x] RAÍZES-10 e 13 — interesses persistidos e cidade no onboarding (Maria Clara, PR #26)
- [x] RAÍZES-11 e 12 — detalhe do local (`app/roteiro/[id].tsx`) e Explorar com dados (Levi, PR #27)
- [x] RAÍZES-15 — login real com Supabase Auth (Josias)

## Semana da Aula 10 (01 a 08/out) — Fundação Supabase

Projeto `raizes` criado no Supabase (região São Paulo), `docs/banco/esquema.sql`
aplicado: 15 tabelas, 36 políticas, RLS em todas, FORCE nas 7 de dado pessoal,
trigger `ao_criar_usuario` confirmado criando a linha em `usuarios`.

Como rodar com o banco real: copiar `.env.example` para `.env` e preencher com
Settings → API Keys do projeto (só a chave pública). Sem `.env` o app roda com
o mock, de propósito, para ninguém ficar travado.

- [x] #22 RAÍZES-15 — login real (Josias): `src/lib/supabase.ts`,
  `src/sessao/autenticar.ts`; `sair()` encerra a sessão no servidor.
- [ ] #29 RAÍZES-17 — Explorar e detalhe lendo do Supabase (Levi)
- [ ] #30 RAÍZES-18 — perfil com sessão real, sair, preferências sincronizadas (Maria Clara)
- [ ] #21 RAÍZES-14 — primeiro lote de lugares curados (Rodrigo)

Usuário de teste em Authentication: `usuario@raizes.com` (a mesma credencial
do mock, para a demo não mudar).

## Pendências que nasceram do login (decisão 4)

- **Visitante só vê Explorar.** O login entrega `useSessao()` em
  `src/sessao/`; aplicar a restrição nas outras abas é do dono das abas
  (RAÍZES-03).
- **"Continuar" dos interesses ainda não leva a lugar nenhum.** Quando levar
  às abas (RAÍZES-02), o login troca uma linha para mandar para
  `/onboarding` em vez de direto para as abas.
- **Sair da conta** fica na tela de perfil (RAÍZES-04), chamando `sair()` do
  mesmo hook. É também o único jeito de um visitante chegar ao login antes
  do dia virar: a sessão de visitante expira à meia-noite.
- **`/onboarding` ficou sem caminho até ser ligado.** Antes, os dois botões
  da abertura levavam à seleção de interesses; agora ela só abre por URL.
  Volta ao fluxo assim que o "Continuar" dela levar às abas.

## Decisões em aberto

1. **Cidade piloto do conteúdo.** O app aceita qualquer cidade (os lugares são
   guardados por coordenada). O que falta decidir é de qual cidade a gente vai
   ter conteúdo curado até a apresentação.
2. **Mapa.** `expo-maps` ou `react-native-maps`? Os dois precisam de chave de
   API e de development build. É o maior risco técnico do projeto.
3. **Onde guardar o token no aparelho.** Hoje o supabase-js usa AsyncStorage
   (ver `src/lib/supabase.ts`); no build nativo deve ir para
   `expo-secure-store`. Na web fica no localStorage, como o supabase-js faz.
4. **Fluxo de curadoria não é imposto pelo banco.** `revisoes_local` existe,
   mas um curador ainda pode escrever direto em `locais` sem passar por lá —
   o banco não tem gatilho que force "toda mudança nasce revisão". Fechar
   isso é trabalho de trigger/função, não cabia nesta entrega.

## Backend (fechado — decisão 5)

Supabase, com Postgres. Esquema completo em `docs/banco/esquema.sql` e
`docs/banco/esquema.md`, já aplicado no projeto `raizes`. Falta ligar
Explorar/detalhe (#29) e perfil/preferências (#30) ao banco e migrar
`src/db/schema.ts` de SQLite para Postgres.

## Risco principal

O diferencial do app é conteúdo curado, não código. Cada lugar precisa de
história, fonte, acessibilidade e ambiente sensorial escritos à mão, e isso
não sai de API nenhuma. Sem uns 20 a 30 lugares prontos, o app chega vazio na
apresentação, e essa é a única parte que não dá pra virar na véspera.

Hoje nenhuma das quatro tasks é de conteúdo. Falta dono pra isso.
