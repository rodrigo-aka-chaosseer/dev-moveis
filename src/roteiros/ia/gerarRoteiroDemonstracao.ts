import type { LocalDetalhe } from "../../locais/listarLocais";
import { calcularParadas } from "../calculos";
import type { PedidoRoteiroIa, RoteiroIa } from "./gerarRoteiroIa";
import { avaliarAcessibilidade } from "./prepararCandidatos";
import { INTERESSES, nomeCidade } from "../../preferencias/dados";

export type RoteiroDemonstracao = Omit<RoteiroIa, "geradoPorIa"> & {
  geradoPorIa: false;
};

const MINUTOS_POR_PARADA = {
  tranquilo: 120,
  moderado: 80,
  intenso: 50,
} as const;

/**
 * Fallback local para demonstrar o fluxo completo enquanto o Supabase não
 * está configurado. Não chama modelo nem rede e nunca inventa um lugar: usa
 * exclusivamente os candidatos que já passaram pelos filtros do Raízes.
 */
export function gerarRoteiroDemonstracao(
  pedido: PedidoRoteiroIa,
  catalogo: readonly LocalDetalhe[],
): RoteiroDemonstracao {
  const porId = new Map(catalogo.map((local) => [local.id, local]));
  const candidatos = pedido.candidatos
    .map(({ id }) => porId.get(id))
    .filter((local): local is LocalDetalhe => Boolean(local));
  const ritmo = pedido.ritmo ?? "moderado";
  const limiteParadas = Math.max(
    1,
    Math.min(8, Math.floor(pedido.tempoDisponivelMin / MINUTOS_POR_PARADA[ritmo])),
  );
  const escolhidos: LocalDetalhe[] = [];

  for (const local of candidatos) {
    if (escolhidos.length >= limiteParadas) break;
    const tentativa = [...escolhidos, local];
    const calculo = calcularParadas(
      tentativa.map((item) => ({ local: item, duracaoMin: item.tempoMedioMin })),
    );
    if (calculo.duracaoMin > pedido.tempoDisponivelMin) continue;
    if (
      pedido.orcamentoCentavos !== null &&
      pedido.orcamentoCentavos !== undefined &&
      calculo.custoCentavos !== null &&
      calculo.custoCentavos > pedido.orcamentoCentavos
    ) {
      continue;
    }
    escolhidos.push(local);
  }

  // A seleção anterior garante que cada candidato cabe sozinho. Esta defesa
  // mantém o retorno útil caso a função seja chamada isoladamente.
  if (escolhidos.length === 0 && candidatos[0]) escolhidos.push(candidatos[0]);

  const paradasBase = escolhidos.map((local) => ({
    local,
    duracaoMin: local.tempoMedioMin,
  }));
  const totais = calcularParadas(paradasBase);
  const necessidades = pedido.acessibilidade ?? [];
  const avisos = [
    "Roteiro de demonstração gerado localmente, sem consulta a um modelo de IA.",
  ];
  const semAcessibilidade = escolhidos.filter(
    (local) => avaliarAcessibilidade(local, necessidades).avisos.length > 0,
  ).length;
  if (semAcessibilidade > 0) {
    avisos.push(`Acessibilidade não confirmada em ${rotuloParadas(semAcessibilidade)}.`);
  }
  const semPreco = escolhidos.filter(
    (local) => !local.gratuito && local.precoCentavos === null,
  ).length;
  if (semPreco > 0) avisos.push(`Preço não informado em ${rotuloParadas(semPreco)}.`);

  const interesses = pedido.interesses.flatMap((id) => {
    const nome = INTERESSES.find((item) => item.id === id)?.nome;
    return nome ? [nome] : [];
  });
  const cidade = nomeCidade(pedido.cidadeId)?.split(",")[0] ?? "a cidade";

  return {
    titulo: `Um passeio por ${cidade}`,
    descricao: descricaoDoRoteiro(interesses),
    paradas: escolhidos.map((local, indice) => ({
      localId: local.id,
      ordem: indice + 1,
      duracaoMin: local.tempoMedioMin,
      justificativa: local.porQueConhecer,
      acessibilidadeNaoConfirmada:
        avaliarAcessibilidade(local, necessidades).avisos.length > 0,
    })),
    duracaoMin: totais.duracaoMin,
    distanciaMetros: totais.distanciaMetros,
    custoCentavos: totais.custoCentavos,
    avisos,
    geradoPorIa: false,
  };
}

function descricaoDoRoteiro(interesses: string[]): string {
  if (interesses.length === 0) {
    return "Uma sugestão local com lugares curados pelo Raízes.";
  }
  const lista = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" }).format(
    interesses,
  );
  return `Uma sugestão local que combina ${lista.toLocaleLowerCase("pt-BR")} com lugares curados pelo Raízes.`;
}

function rotuloParadas(quantidade: number): string {
  return quantidade === 1 ? "1 parada" : `${quantidade} paradas`;
}
