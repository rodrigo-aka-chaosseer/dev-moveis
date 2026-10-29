/**
 * Acessibilidade e ambiente sensorial de um lugar, lidos das tabelas
 * `acessibilidade` e `ambiente_sensorial` (1:1 com `locais`).
 *
 * "Não informado" e "não disponível" são coisas diferentes e nunca se
 * confundem aqui: lugar sem linha, coluna ausente ou valor fora do esperado
 * vira "desconhecido", nunca "nao". Dizer que um lugar não tem rampa quando
 * só não sabemos afasta justamente quem mais precisa da informação.
 */

export type NivelAcessibilidade = "sim" | "parcial" | "nao" | "desconhecido";

export type Acessibilidade = {
  rampa: NivelAcessibilidade;
  elevador: NivelAcessibilidade;
  banheiroAcessivel: NivelAcessibilidade;
  libras: NivelAcessibilidade;
  braille: NivelAcessibilidade;
  audiodescricao: NivelAcessibilidade;
};

type Intensidade = "baixa" | "media" | "alta";

export type AmbienteSensorial = {
  ruido: "baixo" | "medio" | "alto";
  iluminacao: Intensidade;
  movimentacao: Intensidade;
  temFila: boolean;
  espacoDescanso: boolean;
};

export const ACESSIBILIDADE_DESCONHECIDA: Acessibilidade = {
  rampa: "desconhecido",
  elevador: "desconhecido",
  banheiroAcessivel: "desconhecido",
  libras: "desconhecido",
  braille: "desconhecido",
  audiodescricao: "desconhecido",
};

const COLUNAS: Record<keyof Acessibilidade, string> = {
  rampa: "rampa",
  elevador: "elevador",
  banheiroAcessivel: "banheiro_acessivel",
  libras: "libras",
  braille: "braille",
  audiodescricao: "audiodescricao",
};

const NIVEIS: readonly NivelAcessibilidade[] = ["sim", "parcial", "nao", "desconhecido"];

// O PostgREST devolve a relação 1:1 como objeto, mas versões e consultas
// diferentes podem devolver lista. As duas formas valem.
function primeiraLinha(valor: unknown): Record<string, unknown> | null {
  const linha = Array.isArray(valor) ? valor[0] : valor;
  return linha && typeof linha === "object" ? (linha as Record<string, unknown>) : null;
}

export function lerAcessibilidade(valor: unknown): Acessibilidade {
  const linha = primeiraLinha(valor);
  if (!linha) return ACESSIBILIDADE_DESCONHECIDA;

  const resultado = { ...ACESSIBILIDADE_DESCONHECIDA };
  for (const chave of Object.keys(COLUNAS) as (keyof Acessibilidade)[]) {
    const nivel = linha[COLUNAS[chave]];
    if (NIVEIS.includes(nivel as NivelAcessibilidade)) {
      resultado[chave] = nivel as NivelAcessibilidade;
    }
  }
  return resultado;
}

/** `null` quando não há informação confiável sobre o ambiente. */
export function lerAmbienteSensorial(valor: unknown): AmbienteSensorial | null {
  const linha = primeiraLinha(valor);
  if (!linha) return null;

  const { ruido, iluminacao, movimentacao, tem_fila, espaco_descanso } = linha;
  const intensidades = ["baixa", "media", "alta"];
  const valido =
    ["baixo", "medio", "alto"].includes(ruido as string) &&
    intensidades.includes(iluminacao as string) &&
    intensidades.includes(movimentacao as string) &&
    typeof tem_fila === "boolean" &&
    typeof espaco_descanso === "boolean";
  if (!valido) return null;

  return {
    ruido: ruido as AmbienteSensorial["ruido"],
    iluminacao: iluminacao as Intensidade,
    movimentacao: movimentacao as Intensidade,
    temFila: tem_fila as boolean,
    espacoDescanso: espaco_descanso as boolean,
  };
}

/* ─────────────── Texto para a tela ─────────────── */

const ROTULOS_RECURSO: Record<keyof Acessibilidade, string> = {
  rampa: "Rampa",
  elevador: "Elevador",
  banheiroAcessivel: "Banheiro acessível",
  libras: "Libras",
  braille: "Braille",
  audiodescricao: "Audiodescrição",
};

const ROTULOS_NIVEL: Record<NivelAcessibilidade, string> = {
  sim: "Disponível",
  parcial: "Parcial",
  nao: "Não disponível",
  desconhecido: "Não informado",
};

export type ItemAcessibilidade = {
  chave: keyof Acessibilidade;
  rotulo: string;
  nivel: NivelAcessibilidade;
  situacao: string;
  /** Frase completa para leitor de tela, como "Rampa: disponível". */
  descricao: string;
};

export function itensAcessibilidade(acessibilidade: Acessibilidade): ItemAcessibilidade[] {
  return (Object.keys(ROTULOS_RECURSO) as (keyof Acessibilidade)[]).map((chave) => {
    const nivel = acessibilidade[chave];
    const rotulo = ROTULOS_RECURSO[chave];
    const situacao = ROTULOS_NIVEL[nivel];
    return {
      chave,
      rotulo,
      nivel,
      situacao,
      descricao: `${rotulo}: ${situacao.toLowerCase()}`,
    };
  });
}

/** Verdadeiro quando nenhum recurso tem informação: a tela mostra um aviso só. */
export function acessibilidadeDesconhecida(acessibilidade: Acessibilidade): boolean {
  return Object.values(acessibilidade).every((nivel) => nivel === "desconhecido");
}

export type ItemAmbiente = {
  rotulo: string;
  valor: string;
  descricao: string;
};

const INTENSIDADE_FEMININA: Record<Intensidade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

const RUIDO: Record<AmbienteSensorial["ruido"], string> = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
};

export function itensAmbiente(ambiente: AmbienteSensorial): ItemAmbiente[] {
  const itens: [string, string][] = [
    ["Ruído", RUIDO[ambiente.ruido]],
    ["Iluminação", INTENSIDADE_FEMININA[ambiente.iluminacao]],
    ["Movimento de pessoas", INTENSIDADE_FEMININA[ambiente.movimentacao]],
    ["Fila", ambiente.temFila ? "Costuma ter" : "Não costuma ter"],
    ["Espaço de descanso", ambiente.espacoDescanso ? "Tem" : "Não tem"],
  ];
  return itens.map(([rotulo, valor]) => ({
    rotulo,
    valor,
    descricao: `${rotulo}: ${valor.toLowerCase()}`,
  }));
}
