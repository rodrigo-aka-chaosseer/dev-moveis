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

## Acessibilidade e ambiente sensorial (RAÍZES-24, feita)

O detalhe do lugar mostra acessibilidade (rampa, elevador, banheiro
acessível, Libras, Braille, audiodescrição) e ambiente sensorial (ruído,
iluminação, movimento, fila, espaço de descanso), lidos de `acessibilidade`
e `ambiente_sensorial`. Lugar sem informação aparece como "não informado",
nunca como "não disponível". Regras em `src/locais/acessibilidade.ts`.

Os 8 lugares curados de `src/mocks/locais.ts` estão todos como "não
informado": acessibilidade de lugar real só entra com fonte, igual ao resto
da curadoria. Levantar esses dados é trabalho editorial pendente.

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
de pessoa autenticada e oferece logout seguro. A sincronização da tabela
`preferencias` continua pendente da RAÍZES-22: a sessão atual ainda não possui
UUID/token do Supabase, portanto não existe `usuario_id` autenticado para um
upsert protegido por RLS.
