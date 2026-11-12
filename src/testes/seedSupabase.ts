// `?raw` é do Vite/Vitest: traz o arquivo como texto, sem depender de tipos do Node.
import seedSql from "../../supabase/seed.sql?raw";

/**
 * Lê o `supabase/seed.sql` e devolve os lugares no formato que o Supabase
 * entrega para `select *, locais_tags(tags_diversidade(nome)),
 * acessibilidade(*), ambiente_sensorial(*)`. Só para testes: os casos usam
 * os dados reais do piloto em vez de lugares inventados (RAÍZES-36).
 */
export type LinhaSeed = Record<string, unknown> & {
  id: string;
  cidade_id: string;
  nome: string;
  arquivado_em: string | null;
  locais_tags: { tags_diversidade: { nome: string } }[];
  acessibilidade: Record<string, unknown> | null;
  ambiente_sensorial: Record<string, unknown> | null;
};

const AGORA = "2026-11-01T12:00:00.000Z";

export function linhasDoSeed(): LinhaSeed[] {
  const sql = seedSql;
  const locais = inserts(sql, "locais");
  const tags = new Map(inserts(sql, "tags_diversidade").map((tag) => [tag.id, tag.nome]));
  const locaisTags = inserts(sql, "locais_tags");
  const acessibilidade = new Map(inserts(sql, "acessibilidade").map((linha) => [linha.local_id, linha]));
  const ambiente = new Map(inserts(sql, "ambiente_sensorial").map((linha) => [linha.local_id, linha]));

  return locais.map((local) => ({
    ...local,
    horarios: typeof local.horarios === "string" ? JSON.parse(local.horarios) : null,
    locais_tags: locaisTags
      .filter((relacao) => relacao.local_id === local.id)
      .map((relacao) => ({ tags_diversidade: { nome: String(tags.get(relacao.tag_id)) } })),
    acessibilidade: acessibilidade.get(local.id) ?? null,
    ambiente_sensorial: ambiente.get(local.id) ?? null,
  })) as unknown as LinhaSeed[];
}

/** Linhas de um `insert into public.<tabela> (colunas) values (...), (...)`. */
function inserts(sql: string, tabela: string): Record<string, unknown>[] {
  const inicio = sql.indexOf(`insert into public.${tabela} (`);
  if (inicio < 0) throw new Error(`seed.sql sem insert em ${tabela}`);
  const fimColunas = sql.indexOf(")", inicio);
  const colunas = sql
    .slice(sql.indexOf("(", inicio) + 1, fimColunas)
    .split(",")
    .map((coluna) => coluna.trim());
  const inicioValores = sql.indexOf("values", fimColunas) + "values".length;
  const fim = sql.indexOf("on conflict", inicioValores);
  return tuplas(sql.slice(inicioValores, fim)).map((valores) =>
    Object.fromEntries(colunas.map((coluna, indice) => [coluna, valores[indice]])),
  );
}

/** Separa `(a,'b',1),(...)` em valores, respeitando aspas e '' dentro do texto. */
function tuplas(trecho: string): unknown[][] {
  const resultado: unknown[][] = [];
  let atual: unknown[] | null = null;
  let token = "";
  let emTexto = false;
  let foiTexto = false;

  const fecharValor = () => {
    if (!atual) return;
    const bruto = token.trim();
    atual.push(foiTexto ? token : valorSql(bruto));
    token = "";
    foiTexto = false;
  };

  for (let i = 0; i < trecho.length; i++) {
    const c = trecho[i];
    if (emTexto) {
      if (c === "'" && trecho[i + 1] === "'") {
        token += "'";
        i++;
      } else if (c === "'") {
        emTexto = false;
      } else {
        token += c;
      }
      continue;
    }
    if (c === "'") {
      emTexto = true;
      foiTexto = true;
      token = "";
    } else if (c === "(" && !atual) {
      atual = [];
      token = "";
    } else if (c === "(" && atual) {
      token += c; // now(
    } else if (c === ")" && atual && token.trim() === "now(") {
      token += c;
    } else if (c === ")" && atual) {
      fecharValor();
      resultado.push(atual);
      atual = null;
    } else if (c === "," && atual) {
      fecharValor();
    } else if (atual) {
      token += c;
    }
  }
  return resultado;
}

function valorSql(bruto: string): unknown {
  if (bruto === "null") return null;
  if (bruto === "true") return true;
  if (bruto === "false") return false;
  if (bruto === "now()") return AGORA;
  const numero = Number(bruto);
  if (bruto !== "" && Number.isFinite(numero)) return numero;
  return bruto;
}
