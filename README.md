# Raízes

App de descoberta cultural e turística por localização, interesses e diversidade.
Projeto da disciplina de Desenvolvimento de Software para Dispositivos Móveis,
CEULP/ULBRA 2026/2.

## Rodando

Precisa de Node 22 ou mais novo.

```bash
npm install
npx expo start
```

Abre no celular com o Expo Go lendo o QR code, ou aperta `a` para abrir no
emulador Android.

Se der erro estranho depois de trocar de branch, geralmente é cache:

```bash
npx expo start --clear
```

## Estrutura

```
app/          telas (o nome do arquivo vira a rota)
src/theme/    cores, fontes e medidas do app
src/db/       modelo de dados
assets/       imagens
docs/         estado do projeto e decisões
```

Regra: `app/` só monta a tela. Lógica e regra de negócio ficam em `src/`.

## Como trabalhar

Uma branch por task, com o número dela no nome:

```bash
git checkout main
git pull
git checkout -b feat/raizes-02-interesses
```

Termina, sobe e abre um Pull Request. Pelo menos uma pessoa do grupo revisa
antes de entrar no main. Antes de abrir o PR, roda:

```bash
npm run typecheck
npm run lint
```

## Cores e fontes

Tudo em `src/theme/tokens.ts`. Se precisar de uma cor que não está lá,
adiciona no arquivo primeiro e importa na tela, assim nossas telas não ficam
cada uma de um jeito.
