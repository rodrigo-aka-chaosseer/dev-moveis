# Estado do projeto

Atualizar no fim de cada aula. É daqui que saem as tasks da semana.

## Grupo

RAÍZES — tema Diversidade. 3º lugar no pitch da solução (163 pontos, média 9,59).

## O que já tem

- [x] Escopo funcional escrito
- [x] Protótipo navegável de 10 telas
- [x] Repositório e base do projeto
- [x] RAÍZES-01 — tela de abertura
- [ ] RAÍZES-02 — seleção de interesses (Maria Clara)
- [ ] RAÍZES-03 — navegação por abas (Levi)
- [ ] RAÍZES-04 — tela de perfil
- [x] RAÍZES-07 — login e sessão no aparelho (Josias, PR #12)
- [x] RAÍZES-14 — primeiro lote com 8 lugares curados de Salvador e Recife
- [x] RAÍZES-19 — sessão do app unificada com o Supabase Auth (Josias, #35)
- [x] RAÍZES-25 — preferências sincronizadas com o Supabase (Josias, #48)

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
3. **Onde guardar o token na web.** No aparelho vai para `expo-secure-store`,
   mas ele não existe na web. Só importa quando houver back-end.
4. **Fluxo de curadoria não é imposto pelo banco.** `revisoes_local` existe,
   mas um curador ainda pode escrever direto em `locais` sem passar por lá —
   o banco não tem gatilho que force "toda mudança nasce revisão". Fechar
   isso é trabalho de trigger/função, não cabia nesta entrega.

## Backend (fechado — decisão 5)

Supabase, com Postgres. Esquema completo em `docs/banco/esquema.sql` e
`docs/banco/esquema.md`. Falta: criar o projeto no Supabase, aplicar o DDL,
migrar `src/db/schema.ts` de SQLite pra Postgres e ligar a primeira tela a
dado real — quatro tasks da semana, uma por integrante.

## Risco principal

O diferencial do app é conteúdo curado, não código. Cada lugar precisa de
história, fonte, acessibilidade e ambiente sensorial escritos à mão, e isso
não sai de API nenhuma. Sem uns 20 a 30 lugares prontos, o app chega vazio na
apresentação, e essa é a única parte que não dá pra virar na véspera.

O primeiro lote editorial está em `src/mocks/locais.ts`, com 8 lugares reais,
fontes e avisos de visitação quando aplicáveis. O risco diminuiu, mas ainda é
preciso ampliar e revisar o catálogo até a meta de 20 a 30 lugares antes da
apresentação.

## Perfil e sincronização

A tela de perfil já consome sessão e preferências locais, diferencia visitante
de pessoa autenticada e oferece logout seguro.

Desde a RAÍZES-19, com Supabase configurado, a sessão de conta identificada é
um espelho do `supabase.auth`: na abertura o app confere com `getSession()`,
acompanha `onAuthStateChange` e `useSessao()` expõe `usuarioId` (o `user.id`
do Supabase). Sessão expirada no servidor apaga a local; `sair()` apaga a
local e depois encerra no Supabase, sem o app entrar de novo sozinho.
Visitante continua só local. As regras moram em
`src/sessao/controleSessao.ts`.

Desde a RAÍZES-25, as preferências de conta identificada sincronizam com a
tabela `preferencias` (RLS: só o dono lê e escreve). Ao entrar, o app busca a
linha da conta: se lá o onboarding está concluído, os interesses do servidor
substituem os locais; se não há linha (ou não está concluída), as locais
sobem. Depois disso, cada mudança de interesse e a conclusão do onboarding
fazem upsert por `usuario_id`. Sobem só `interesses` e `onboarding_concluido`;
temas e necessidades de acessibilidade vão vazios (dado sensível, decisão 6,
não é coletado).

Continua só no aparelho: a cidade (a tabela não tem coluna para ela). Por
isso, num aparelho novo sem cidade, os interesses chegam do servidor, mas o
onboarding local só conclui quando a pessoa escolhe a cidade. A sincronização
é melhor esforço: sem rede, a escolha local fica e a próxima mudança tenta de
novo. Visitante e modo mock (sem `.env`) continuam 100% locais, e sair da
conta não apaga as preferências do aparelho. As regras moram em
`src/preferencias/sincronizar.ts`.
