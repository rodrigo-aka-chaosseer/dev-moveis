# RAÍZES-07: tela de login, design

Data: 03/09/2026. Decisões tomadas com o dono do produto. Decisão
arquitetural correspondente: `docs/DECISOES.md`, bloco 4.

## O que a tela faz

Recebe e-mail e senha, grava no aparelho que a pessoa entrou, e manda para
as abas. Sem servidor nesta etapa. A senha não sai do formulário e não é
gravada.

## Decisões de produto

| Pergunta | Resposta |
|---|---|
| Identificação | E-mail + senha. Senha só em memória, conferida como "preenchida", descartada ao entrar. |
| Entrar sem conta | Sim, "Só dar uma olhada por hoje". Visitante deve ver só a aba Explorar; a restrição das outras abas é do dono das abas, usando `useSessao()`. |
| Onde vive | `app/login.tsx`. Abertura → login → abas. Quando o "Continuar" dos interesses for ligado, o login passa a mandar para `/onboarding`. |
| Reabertura | Com sessão gravada, a abertura redireciona direto para Explorar, atrás da splash, sem piscar. |
| Sair | `sair()` no hook; a tela de perfil chama. |

## Arquitetura

- `src/sessao/armazenamento.ts`: leitura e gravação em AsyncStorage, chave
  `raizes.sessao.v1`, registro `{ modo, email?, entradoEm }`. Registro
  corrompido vira `null` com aviso no console. Leitura com limite de tempo
  para storage quebrado não prender a splash.
- `src/sessao/validarLogin.ts`: validação de formato, pura. Nunca de
  credencial.
- `src/sessao/SessaoProvider.tsx`: contexto com `estado`
  (`nenhuma | visitante | identificado`), `email`, `temSessao`, `entrar`,
  `entrarComoVisitante`, `sair`. `useSessaoInicial()` carrega a sessão para a
  raiz segurar a splash.
- `app/_layout.tsx`: espera fontes e sessão; envolve o Stack no provider.
- `app/index.tsx`: `<Redirect>` para `/(tabs)/explorar` quando há sessão;
  "Começar a explorar" → `/login`; "Explorar sem responder" → visitante.
- Navegação para as abas sempre pelo caminho explícito `/(tabs)/explorar`,
  porque `app/index.tsx` e `app/(tabs)/index.tsx` disputam `/`.

## Falhas

- `entrar()` grava antes de mudar o estado e lança erro. A tela mostra um
  aviso e a pessoa tenta de novo. Nada fica pela metade.
- `entrarComoVisitante()` muda o estado primeiro e grava sem lançar erro.
  Perder sessão de visitante só significa ver a abertura de novo.

## Direção visual: bloco terracota sobre a foto da abertura

Pesquisa em telas premiadas (Duolingo ADA 2023, Arc ADA 2024, Nubank,
Headspace, Cash App, Monzo) apontou o que separa formulário de produto:
marca com território próprio que sobrevive ao teclado, entrada em
sequência, feedback no lugar e visitante com o mesmo peso do login.

Terço superior com a mesma foto da abertura sob um véu terracota que
escurece para o pé (`gradients.loginVeil`), com saudação pela hora do
aparelho, a marca e a frase "Quem chega, chega com nome." Em repouso o bloco
ocupa 44% da tela; ao focar um campo ele encolhe em 280 ms. Folha branca
sobe por cima com raio só nos cantos de cima. Campos com rótulo pequeno em
caixa alta e só linha inferior: terracota no foco, vermelha com erro,
mensagem inline abaixo. Botão "Entrar na cidade" em gradiente terracota,
52 de altura; "Só dar uma olhada por hoje" é botão fantasma de 48, mesmo
peso. Nota: "Sua entrada fica só neste aparelho e funciona sem internet."

Movimento (Animated puro, driver nativo, tudo desligado com "reduzir
movimento"): entrada escalonada de 80 ms entre peças e 280 ms cada; botão
encolhe 4% com mola firme e vibra leve ao pressionar; ao entrar, spinner no
lugar do rótulo, depois check que cresce, vibração de sucesso e navegação;
campo inválido treme 200 ms com amplitude caindo e vibra erro, sem travar a
digitação.

Guarda de rotas em `app/_layout.tsx` com `Stack.Protected`: com sessão a
abertura sai da pilha (voltar a partir das abas não cai nela); sem sessão as
abas não existem. Visitante ainda alcança o login. Sessão de visitante vale
só no dia em que foi criada.

## Fora desta task

Restrição de abas para visitante, ligar o "Continuar" dos interesses, tela
de perfil com "sair", qualquer chamada de rede.
