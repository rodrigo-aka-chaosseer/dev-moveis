# RAÍZES-05 — tela de login: design

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

## Direção visual: bloco terracota

Terço superior em `colors.accent` chapado com a marca e a frase "Quem chega,
chega com nome." Folha branca sobe por cima com raio só nos cantos de cima e
carrega o formulário. Campos com fundo creme e borda `surface3`; borda
terracota no foco, vermelha com erro, mensagem inline abaixo do campo.
Botão "Entrar na cidade" em gradiente terracota, 52 de altura, como na
abertura. Link "Só dar uma olhada por hoje" sem borda. Nota: "Por enquanto
sua entrada fica só neste aparelho."

## Fora desta task

Restrição de abas para visitante, ligar o "Continuar" dos interesses, tela
de perfil com "sair", qualquer chamada de rede.
