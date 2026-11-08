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

## Supabase

O app funciona em dois modos:

- sem `.env`, usa os dados locais de demonstração e não faz chamadas de rede;
- com as duas variáveis abaixo, usa Auth, banco e Edge Functions do Supabase.

Copie `.env.example` para `.env` e preencha apenas valores públicos obtidos em
**Supabase Dashboard → Project Settings → API**:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Depois reinicie o Expo com `npx expo start --clear`. Variáveis `EXPO_PUBLIC_*`
fazem parte do aplicativo compilado: nunca coloque nelas `service_role`, senha
do banco ou chave de provedor de IA. O `.env` e suas variações estão ignorados
pelo Git; somente `.env.example`, sem segredos, é versionado.

### Criar ou recriar o banco

1. Crie um projeto de desenvolvimento no Supabase.
2. No SQL Editor, execute [docs/banco/esquema.sql](docs/banco/esquema.sql).
3. Execute [supabase/seed.sql](supabase/seed.sql) para carregar os dados
   sintéticos de demonstração.
4. Execute [docs/banco/validar.sql](docs/banco/validar.sql); todas as colunas
   `ok` devem retornar `true`.
5. Crie duas contas pela tela de cadastro. Confirme em `usuarios` que o trigger
   criou os perfis automaticamente.
6. Com cada conta, altere cidade e interesses. Confirme que cada sessão só
   consegue ler/editar sua própria linha em `preferencias` e seus próprios
   roteiros gerados. Desconectado, o catálogo público continua legível, mas as
   preferências privadas não.

O arquivo [supabase/config.toml](supabase/config.toml) configura o ambiente
local, e `supabase/seed.sql` é reaplicável. Com Docker e a CLI disponíveis,
`npx supabase start` inicia a stack local. Para um projeto remoto, vincule-o com
`npx supabase link --project-ref SEU_PROJECT_REF`; não versione os arquivos
temporários criados pela CLI.

## Estrutura

```
app/          telas (o nome do arquivo vira a rota)
src/theme/    cores, fontes e medidas do app
src/db/       modelo de dados
supabase/     configuração, seed e Edge Functions
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
