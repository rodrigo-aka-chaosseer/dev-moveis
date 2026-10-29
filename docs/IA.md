# Roteiro gerado por IA

RAÍZES-26 (issue #49). A IA monta um roteiro **só com lugares curados** que o
app manda como candidatos. Ela escolhe, ordena e justifica; quem decide o que
pode entrar e confere a resposta é o servidor. A decisão está em
`docs/DECISOES.md` (decisão 10).

## Arquitetura

```
app (src/roteiros/ia/gerarRoteiroIa.ts)
  │  supabase.functions.invoke("gerar-roteiro", { body: pedido })
  │  token da pessoa logada vai no header Authorization
  ▼
Edge Function supabase/functions/gerar-roteiro/index.ts  (Deno)
  1. CORS / só POST / exige usuário (auth.getUser)
  2. validarPedido ─────────────────────────────┐
  3. relê os ids em `locais` (só publicados)    │ regras puras em
  4. prepararCandidatos: cidade, acessibilidade, │ supabase/functions/_shared/roteiroIa.ts
     orçamento                                  │ (testadas no Vitest)
  5. montarRequisicaoClaude ────────────────────┤
  6. Claude API (secret ANTHROPIC_API_KEY)      │
  7. interpretarMensagem + validarRespostaIa ───┘
  ▼
200 { roteiro } ou erro { erro: "mensagem para a tela" }
```

A chave da Anthropic só existe como secret da função. O app nunca vê a chave
nem fala com a Anthropic.

### Preparação dos candidatos no app

`src/roteiros/ia/prepararCandidatos.ts` transforma cidade, interesses, tempo,
orçamento, ritmo e acessibilidade em um pedido padronizado. A fonte é
`listarLocaisDetalhados`: uma única consulta ao catálogo público com
`arquivado_em is null`, já filtrada pela cidade. Antes da geração, o app:

- relaciona interesses às categorias do catálogo;
- tira lugares que não cabem no tempo ou cujo preço conhecido passa do teto;
- espelha as regras de cadeira de rodas, baixa visão e sensibilidade sensorial;
- mantém avisos de visitação, preço desconhecido e acessibilidade não confirmada;
- limita a lista a 40 candidatos e registra em cada um `id`, `categoria`,
  `duracaoMin`, `custoCentavos` e `restricoes`.

Esses metadados permitem testar e explicar a seleção local. Na transmissão,
`gerarRoteiroIa` remove todos eles e manda somente os ids; a Edge Function
relê os lugares publicados e repete os filtros de segurança. Sem Supabase o
catálogo de demonstração pode montar a lista, mas a chamada de IA é recusada.

## Contrato

Os tipos ficam em `supabase/functions/_shared/roteiroIa.ts` e o app importa
de `src/roteiros/ia/gerarRoteiroIa.ts`, que reexporta tudo (inclusive
`LIMITES_PEDIDO`, `RITMOS` e `NECESSIDADES_ACESSIBILIDADE` para o
formulário).

### Entrada — `PedidoRoteiroIa`

| Campo | Tipo | Regra |
|---|---|---|
| `cidadeId` | `"salvador" \| "recife"` | obrigatório |
| `interesses` | `string[]` | 1 a 10 slugs (`gastronomia`, `historia`...): minúsculas, sem espaço |
| `tempoDisponivelMin` | `number` | inteiro de 60 a 720 |
| `orcamentoCentavos` | `number \| null` | opcional; teto do roteiro inteiro |
| `ritmo` | `"tranquilo" \| "moderado" \| "intenso"` | opcional, padrão `moderado` |
| `acessibilidade` | `("cadeira_de_rodas" \| "baixa_visao" \| "sensibilidade_sensorial")[]` | opcional; usado só neste pedido |
| `candidatos` | `{ id: string }[]` | 1 a 40 ids de `locais` da cidade escolhida |

Pode mandar mais campos em cada candidato: o servidor usa só o `id` e relê o
resto no banco. O cliente do app já corta os extras antes de enviar.

### Saída — `RoteiroIa` (HTTP 200)

```ts
{
  titulo: string;
  descricao: string;
  paradas: {
    localId: string;        // sempre um dos candidatos
    ordem: number;          // 1..n, ordem da visita
    duracaoMin: number;
    justificativa: string;  // escrita só com os dados do lugar
    acessibilidadeNaoConfirmada: boolean; // a tela avisa nessa parada
  }[];
  duracaoMin: number;          // visitas + caminhada, de 5 em 5 (igual calcularRoteiro)
  distanciaMetros: number;     // linha reta, de 10 em 10
  custoCentavos: number | null; // null se algum lugar não tem preço
  avisos: string[];            // ex.: "Acesso para cadeira de rodas não confirmado em 2 paradas."
  geradoPorIa: true;
}
```

**Nada é salvo nesta task.** Para gravar, use `roteiros` com `tipo = 'gerado'`
e `roteiro_paradas` (tasks #51/#52).

### Erros — `{ erro: string }`

| Status | Quando | Mensagem |
|---|---|---|
| 400 | pedido fora do contrato | específica (ex.: "Escolha pelo menos um interesse.") |
| 401 | sem login | "Entre na sua conta para gerar um roteiro." |
| 422 | nenhum candidato válido sobrou | "Nenhum lugar disponível combina com esse pedido..." |
| 422 | a IA recusou o pedido | "Não foi possível sugerir um roteiro para esse pedido..." |
| 502 | resposta da IA inválida (id inventado, repetido, cortada) | "Não foi possível montar um roteiro confiável agora..." |
| 503 | banco fora, IA sobrecarregada ou fora | "...Tente de novo em instantes." |
| 504 | demorou demais | "A sugestão demorou mais que o esperado. Tente de novo." |
| 500 | configuração ou erro inesperado | genérica |

`gerarRoteiroIa` joga `ErroGerarRoteiro` com essa mensagem pronta em
`message` e o status em `status`. Sem Supabase no `.env`, joga
`ERRO_SEM_SUPABASE` sem chamar nada.

## Regras do servidor

- **Lugares:** relidos do banco com o token da pessoa (RLS dela, nunca
  `service_role`), só com `arquivado_em is null`. Id inexistente, arquivado,
  fora da cidade (30 km do centro) ou que sozinho passa do orçamento sai da
  lista sem aviso. Se não sobra nenhum, 422.
- **Acessibilidade** (tabela `REGRAS_ACESSIBILIDADE`, filtro antes da IA):

  | Necessidade | Colunas | `nao` / ruim | sem dado |
  |---|---|---|---|
  | `cadeira_de_rodas` | `acessibilidade.rampa` | sai | fica, marcado |
  | `baixa_visao` | `piso_tatil`, `audiodescricao`, `braille` (basta um `sim`/`parcial`) | fica, marcado | fica, marcado |
  | `sensibilidade_sensorial` | `ambiente_sensorial.ruido` | `alto` sai | fica, marcado |

  Baixa visão não tira lugar: falta de recurso dificulta, não impede a visita.
  As necessidades não vão para o modelo, não são gravadas nem logadas.
- **Prompt:** só preferências (interesses, tempo, orçamento, ritmo, máximo de
  paradas) e dados públicos do catálogo. O conteúdo vai como JSON dentro de
  `<pedido>`/`<lugares>`, tratado como dado; `<` é escapado.
- **Resposta:** structured outputs com JSON Schema; `localId` tem `enum` com
  os ids enviados. Mesmo assim o servidor confere tudo:
  - id fora da lista ou repetido, texto vazio/longo demais, nenhuma parada,
    JSON cortado (`max_tokens`) ou `stop_reason` diferente de `end_turn` ⇒
    **rejeita** (502). Não tenta consertar.
  - `ordem` é renumerada 1..n na ordem do array; `duracaoMin` fica entre
    15 min e o dobro do tempo médio do lugar (até 4 h e até o tempo total).
  - máximo de paradas = tempo ÷ (120 min tranquilo, 80 moderado, 50 intenso),
    entre 1 e 8. Passou disso, de `tempoDisponivelMin` (visitas + caminhada a
    75 m/min) ou do orçamento ⇒ corta as **últimas** paradas e avisa. Se o
    orçamento não deixar nenhuma, 502.

## Modelo e chamada

- `claude-opus-5-5`, `output_config.effort: "low"` (tarefa curta com a pessoa
  esperando na tela; o modelo sempre pensa, o effort controla quanto).
- `max_tokens: 16000` (o pensamento conta nele); na prática quem limita é o
  timeout.
- Timeout de 25 s por tentativa, 1 retry do SDK, teto total de 45 s.
- `fallbacks: "default"` com o beta `server-side-fallback-2026-07-01`: se os
  classificadores de segurança recusarem por engano, a própria API refaz o
  pedido no modelo de reserva indicado pela Anthropic. Recusa final vira 422.
  O log registra `modelo` para saber quando o reserva respondeu.
- SDK oficial `npm:@anthropic-ai/sdk@1.3.0`, versão fixada no import.

## Configurar

Precisa do [Supabase CLI](https://supabase.com/docs/guides/cli) e do projeto
linkado (`supabase link --project-ref <ref>`).

```bash
# chave da Anthropic só como secret da função — nunca no .env do app
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

supabase functions deploy gerar-roteiro
```

`SUPABASE_URL` e `SUPABASE_ANON_KEY` o runtime das Edge Functions já
fornece. Para rodar local: `supabase functions serve gerar-roteiro --env-file
supabase/.env.local` (com a chave nesse arquivo, que não é versionado).

Para checar tipos do código Deno: `cd supabase/functions/gerar-roteiro &&
deno check index.ts`. O `npm run typecheck` e o `npm run lint` do app
ignoram os `index.ts` das functions; o `_shared` passa pelos dois.

## Custo estimado

Preço do `claude-opus-5-5`: US$ 4 por milhão de tokens de entrada e US$ 20
por milhão de saída.

| Pedido | Entrada | Saída (pensamento + JSON) | Custo |
|---|---|---|---|
| 15 candidatos | ~5 mil tokens | ~1,5–3 mil | ~US$ 0,05–0,08 |
| 40 candidatos | ~12 mil tokens | ~2–3 mil | ~US$ 0,09–0,11 |

Retry pode dobrar uma chamada; o fallback, quando roda, cobra no preço do
modelo de reserva. Cache de prompt não compensa aqui: o que se repete (as
instruções) é pequeno e os lugares mudam a cada pedido.

## Privacidade e logs

O log de cada chamada é uma linha JSON com `resultado` (tipo do erro ou
`ok`), `status`, `duracaoMs`, `detalhe` (motivo técnico, ex.: `ia_timeout`)
e, no sucesso, número de candidatos, de paradas e o modelo. Nunca vai para o
log: corpo do pedido, coordenadas, id ou e-mail do usuário, necessidades de
acessibilidade, mensagem bruta de erro da API.

## Limites e próximos passos

- **#50** concluída: prepara até 40 candidatos publicados da cidade em
  `src/roteiros/ia/prepararCandidatos.ts`.
- **#53** é o formulário: usa `LIMITES_PEDIDO`, `RITMOS` e
  `NECESSIDADES_ACESSIBILIDADE` reexportados pelo cliente.
- **#52/#51** concluídas: `app/roteiro/criar.tsx` gera, mostra e ajusta o
  roteiro sem voltar ao formulário (`useGeracaoRoteiro` e
  `src/roteiros/ia/roteiroGerado.ts`). Remover e trocar parada são feitos no
  app, só com candidatos do mesmo pedido, sem lugar repetido e sem deixar o
  roteiro vazio; totais e horários são recalculados com `calcularParadas`.
  "Mais curto", "mais econômico", "priorizar acessibilidade" e "outra
  sugestão" pedem um novo roteiro à IA mudando só o campo do ajuste; "outra
  sugestão" manda os lugares atuais para o fim da lista de candidatos.
- Salvar o roteiro gerado (`roteiros.tipo = 'gerado'`) continua pendente.
- Sem limite de uso por pessoa ainda: qualquer conta logada pode chamar à
  vontade. Próximo passo é um limite diário (tabela de contagem por usuário
  e dia, checada antes da chamada à IA).
- Só Salvador e Recife: cidade nova precisa entrar em `CIDADES_ROTEIRO` e
  `CENTRO_CIDADE` no `_shared`, além de `src/preferencias/dados.ts`.
