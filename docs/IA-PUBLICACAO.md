# Publicar e atualizar a função `gerar-roteiro`

RAÍZES-35 (issue #84). Este é o passo a passo para colocar a Edge Function
no ar e mantê-la atualizada. Como ela funciona por dentro está em
[`IA.md`](IA.md).

## O que já está garantido no código

| Critério | Onde |
| --- | --- |
| Chave da IA só como secret do Supabase | `ANTHROPIC_API_KEY` é lida em `supabase/functions/gerar-roteiro/index.ts` com `Deno.env`; o app nunca a recebe. Nenhuma variável `EXPO_PUBLIC_*` guarda essa chave (`.env.example`). |
| Só usuário autenticado | `verify_jwt = true` em `supabase/config.toml` barra a chamada no gateway; dentro da função, `auth.getUser()` exige uma pessoa logada (a chave pública sozinha recebe 401). |
| Timeout | 25 s por tentativa, 1 nova tentativa, teto de 45 s no total. O app espera até 60 s. |
| Limite de tamanho | Corpo acima de `LIMITES_PEDIDO.maxBytesCorpo` é recusado com 400, medido em bytes antes e depois da leitura. |
| Logs sem dado sensível | Uma linha JSON por chamada com resultado, status, duração e contagens. Nunca entra corpo do pedido, coordenadas, usuário, e-mail, necessidades de acessibilidade ou mensagem bruta da API. |
| Só lugares válidos | A função relê os ids no banco com o token da pessoa (RLS dela), só `arquivado_em is null`, da cidade (30 km do centro), dentro do tempo, do orçamento e da acessibilidade. Sem candidatos suficientes, devolve 422 sem chamar a IA (RAÍZES-36). |

## Antes da primeira publicação

Você precisa de:

- acesso de administrador ao projeto Supabase do grupo;
- uma chave da Anthropic (`sk-ant-...`) criada no [Console](https://platform.claude.com) para este projeto;
- Node instalado. O CLI do Supabase roda pelo `npx`, sem instalar nada global.

Na pasta do repositório:

```bash
npx supabase login
```

```bash
npx supabase link --project-ref SEU_PROJECT_REF
```

O `project-ref` é o trecho antes de `.supabase.co` na URL do projeto.

## Publicar

1. **Guardar a chave como secret.** Copie o modelo, preencha a chave e envie.
   Usar arquivo evita que a chave fique no histórico do terminal.

   ```bash
   cp supabase/functions/.env.example supabase/functions/.env.producao
   ```

   Edite `supabase/functions/.env.producao` e preencha `ANTHROPIC_API_KEY=`.
   O arquivo é ignorado pelo git (`.env.*`).

   ```bash
   npx supabase secrets set --env-file supabase/functions/.env.producao
   ```

2. **Publicar a função.** O CLI lê `verify_jwt = true` do `config.toml`.

   ```bash
   npx supabase functions deploy gerar-roteiro
   ```

3. **Conferir.** `npx supabase secrets list` mostra `ANTHROPIC_API_KEY`
   (só o nome e um resumo, nunca o valor). No Dashboard, em Edge
   Functions, `gerar-roteiro` aparece com a data da publicação.

4. **Testar pelo app.** Com o `.env` do app apontando para o projeto, entre
   com uma conta, abra Roteiros > Criar roteiro com IA e gere um roteiro.
   Teste também sem login (deve pedir para entrar) e com filtros sem lugar
   (deve explicar o que mudar).

5. **Ver os logs.** Dashboard > Edge Functions > `gerar-roteiro` > Logs.
   Cada chamada é uma linha como:

   ```json
   {"funcao":"gerar-roteiro","resultado":"ok","status":200,"candidatos":6,"paradas":3,"modelo":"claude-opus-5-5","duracaoMs":8120}
   ```

   `resultado` diferente de `ok` traz o tipo do erro (`sem_candidatos`,
   `timeout`, `configuracao`...) e um `detalhe` técnico, nunca dados da pessoa.

## Atualizar

Depois de mesclar no `main` uma mudança em `supabase/functions/`:

```bash
git checkout main
```

```bash
git pull
```

```bash
npx supabase functions deploy gerar-roteiro
```

A função não guarda estado: a nova versão vale a partir da próxima chamada.
Mudança só no app (telas) não exige publicar a função de novo.

## Voltar uma versão

Volte o código da função para o commit anterior e publique de novo:

```bash
git checkout COMMIT_ANTERIOR -- supabase/functions
```

```bash
npx supabase functions deploy gerar-roteiro
```

Depois desfaça a mudança local com `git checkout main -- supabase/functions`.

## Trocar a chave da IA

Se a chave vazar ou expirar: crie uma nova no Console da Anthropic, troque o
valor em `supabase/functions/.env.producao`, rode de novo o
`secrets set` e só então revogue a antiga no Console. Não é preciso publicar
a função de novo: o secret vale na próxima chamada.

## Rodar no computador

```bash
npx supabase functions serve gerar-roteiro --env-file supabase/functions/.env.producao
```

Para checar os tipos do código Deno: `cd supabase/functions/gerar-roteiro &&
deno check index.ts`. Os testes das regras (`_shared`) rodam no `npx vitest run`.
