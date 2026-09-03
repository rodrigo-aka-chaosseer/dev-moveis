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
- [ ] RAÍZES-05 — login e sessão no aparelho (Josias)

## Pendências que nasceram do login (decisão 4)

- **Visitante só vê Explorar.** O login entrega `useSessao()` em
  `src/sessao/`; aplicar a restrição nas outras abas é do dono das abas
  (RAÍZES-03).
- **"Continuar" dos interesses ainda não leva a lugar nenhum.** Quando levar
  às abas (RAÍZES-02), o login troca uma linha para mandar para
  `/onboarding` em vez de direto para as abas.
- **Sair da conta** fica na tela de perfil (RAÍZES-04), chamando `sair()` do
  mesmo hook.

## Decisões em aberto

1. **Cidade piloto do conteúdo.** O app aceita qualquer cidade (os lugares são
   guardados por coordenada). O que falta decidir é de qual cidade a gente vai
   ter conteúdo curado até a apresentação.
2. **Mapa.** `expo-maps` ou `react-native-maps`? Os dois precisam de chave de
   API e de development build. É o maior risco técnico do projeto.
3. **Backend.** Supabase ou API própria. Dá pra adiar, mas não muito.
4. **Onde guardar o token na web.** No aparelho vai para `expo-secure-store`,
   mas ele não existe na web. Só importa quando houver back-end.

## Risco principal

O diferencial do app é conteúdo curado, não código. Cada lugar precisa de
história, fonte, acessibilidade e ambiente sensorial escritos à mão, e isso
não sai de API nenhuma. Sem uns 20 a 30 lugares prontos, o app chega vazio na
apresentação, e essa é a única parte que não dá pra virar na véspera.

Hoje nenhuma das quatro tasks é de conteúdo. Falta dono pra isso.
