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
