import type { Local } from "../db/schema";
import type { CidadeId } from "../preferencias/dados";
import type { Acessibilidade } from "../locais/acessibilidade";

export type LocalLista = Local & { cidadeId: CidadeId; tags: string[]; distancia: string; acessibilidade?: Acessibilidade };
export type CategoriaLocal = "gastronomia" | "historia" | "cultura" | "arte" | "musica" | "religiao" | "patrimonio" | "comunidade" | "natureza" | "evento";
export type LocalCurado = { id: string; cidadeId: CidadeId; nome: string; categoria: CategoriaLocal; latitude: number; longitude: number; endereco: string; horarios: Record<string, { abre: string; fecha: string } | null>; gratuito: boolean; precoCentavos: number | null; tempoMedioMin: number; porQueConhecer: string; historia: string; avisoVisitacao: string | null; fonte: string; atualizadoEm: string };

const SEM_HORARIO: Record<string, null> = { segunda: null, terca: null, quarta: null, quinta: null, sexta: null, sabado: null, domingo: null };

/** Catálogo inicial do piloto, exclusivamente com atrativos de Palmas–TO. */
const LOCAIS_CURADOS: LocalCurado[] = [
  {
    id: "praca-dos-girassois", cidadeId: "palmas", nome: "Praça dos Girassóis", categoria: "patrimonio", latitude: -10.1838, longitude: -48.3337,
    endereco: "Praça dos Girassóis, Plano Diretor Norte, Palmas - TO", horarios: SEM_HORARIO, gratuito: true, precoCentavos: 0, tempoMedioMin: 90,
    porQueConhecer: "Reúne monumentos, obras de arte e marcos da criação do Tocantins em um dos principais cartões-postais da capital.",
    historia: "A praça abriga as sedes dos três poderes e monumentos como a Rosa dos Ventos, o Cruzeiro, o Relógio do Sol e o Monumento aos Dezoito do Forte.",
    avisoVisitacao: "O percurso é extenso e possui áreas abertas; leve água e prefira horários de menor incidência solar.",
    fonte: "https://portal2013.palmas.to.gov.br/conheca_palmas/visite-palmas/praca-dos-girassois/", atualizadoEm: "2026-11-08",
  },
  {
    id: "memorial-coluna-prestes", cidadeId: "palmas", nome: "Memorial Coluna Prestes", categoria: "historia", latitude: -10.1844, longitude: -48.3341,
    endereco: "Praça dos Girassóis, Plano Diretor Norte, Palmas - TO", horarios: SEM_HORARIO, gratuito: true, precoCentavos: 0, tempoMedioMin: 60,
    porQueConhecer: "Apresenta documentos, fotografias e objetos ligados à passagem da Coluna Prestes pelo território tocantinense.",
    historia: "Projetado por Oscar Niemeyer e inaugurado em 2001, o memorial também abriga a escultura Cavaleiro da Luz, de Maurício Bentes.",
    avisoVisitacao: "Confirme o horário de visitação antes de sair; exposições e acesso interno podem variar.",
    fonte: "https://palmas.to.gov.br/core/noticias/fundacao-cultural-de-palmas-representa-prefeitura-em-reinauguracao-do-memorial-coluna-prestes/", atualizadoEm: "2026-11-08",
  },
  {
    id: "palacinho", cidadeId: "palmas", nome: "Museu Histórico do Tocantins — Palacinho", categoria: "historia", latitude: -10.1687, longitude: -48.3319,
    endereco: "Av. NS 10, Quadra 112 Norte, Palmas - TO", horarios: SEM_HORARIO, gratuito: true, precoCentavos: 0, tempoMedioMin: 60,
    porQueConhecer: "Guarda a memória da criação do Tocantins e oferece uma leitura direta dos primeiros anos de Palmas.",
    historia: "Construído em madeira de jatobá, foi a primeira sede do Poder Executivo estadual e o primeiro edifício erguido na nova capital.",
    avisoVisitacao: "Confirme previamente os horários de abertura do museu.", fonte: "https://turismo-palmas.palmas.to.gov.br/pt/atracoes/museu-historico-do-tocantins-palacinho", atualizadoEm: "2026-11-08",
  },
  {
    id: "parque-cesamar", cidadeId: "palmas", nome: "Parque Cesamar", categoria: "natureza", latitude: -10.2053, longitude: -48.3193,
    endereco: "Área Verde 506 Sul, Palmas - TO", horarios: SEM_HORARIO, gratuito: true, precoCentavos: 0, tempoMedioMin: 90,
    porQueConhecer: "Combina área verde, lago, trilhas e patrimônio histórico em um espaço muito frequentado por moradores.",
    historia: "O parque integra a paisagem urbana planejada de Palmas e abriga a Casa Suçuapara, ligada à memória da primeira prefeitura.",
    avisoVisitacao: "Respeite a fauna, não alimente animais e use os percursos sinalizados.", fonte: "https://palmas.to.gov.br/core/noticias/parques-e-praias-da-capital-possuem-equipe-de-zeladoria-para-limpeza-frequente/", atualizadoEm: "2026-11-08",
  },
  {
    id: "espaco-cultural-jose-gomes-sobrinho", cidadeId: "palmas", nome: "Espaço Cultural José Gomes Sobrinho", categoria: "cultura", latitude: -10.1938, longitude: -48.3265,
    endereco: "Av. Teotônio Segurado, Área Verde 302 Sul, Palmas - TO", horarios: SEM_HORARIO, gratuito: true, precoCentavos: 0, tempoMedioMin: 75,
    porQueConhecer: "Concentra cinema, teatro, galeria, biblioteca e formação artística em um dos principais polos culturais municipais.",
    historia: "O complexo reúne o Cine Cultura, o Theatro Fernanda Montenegro, a Galeria Municipal de Artes e a Biblioteca Jornalista Jaime Câmara.",
    avisoVisitacao: "Consulte a programação; sessões, exposições e espetáculos podem ter horários e ingressos próprios.", fonte: "https://diariooficial.palmas.to.gov.br/media/diario/1870-suplemento-1-6-11-2017-9-23-17.pdf", atualizadoEm: "2026-11-08",
  },
  {
    id: "praia-da-graciosa", cidadeId: "palmas", nome: "Praia da Graciosa", categoria: "natureza", latitude: -10.1848, longitude: -48.4004,
    endereco: "Orla da Graciosa, Palmas - TO", horarios: SEM_HORARIO, gratuito: true, precoCentavos: 0, tempoMedioMin: 120,
    porQueConhecer: "É um dos principais espaços de convivência à beira do Lago de Palmas, conhecido pelo pôr do sol e pela orla.",
    historia: "A praia integra o Projeto Orla e consolidou-se como área de lazer, gastronomia e realização de eventos na capital.",
    avisoVisitacao: "Observe as condições de banho e orientações locais; crianças devem permanecer acompanhadas.", fonte: "https://palmas.to.gov.br/core/noticias/parques-e-praias-da-capital-possuem-equipe-de-zeladoria-para-limpeza-frequente/", atualizadoEm: "2026-11-08",
  },
  {
    id: "feira-304-sul", cidadeId: "palmas", nome: "Feira da 304 Sul", categoria: "gastronomia", latitude: -10.1957, longitude: -48.3334,
    endereco: "Quadra 304 Sul, Palmas - TO", horarios: SEM_HORARIO, gratuito: true, precoCentavos: 0, tempoMedioMin: 75,
    porQueConhecer: "Aproxima visitantes da alimentação, do artesanato e do cotidiano dos produtores e feirantes locais.",
    historia: "Reconhecida na rota turística oficial de Palmas, a feira é um ponto tradicional de compras e encontro da comunidade.",
    avisoVisitacao: "O acesso é gratuito, mas alimentação e produtos são pagos; confirme os dias e horários da feira.", fonte: "https://doe.to.gov.br/diario/5066/download", atualizadoEm: "2026-11-08",
  },
  {
    id: "parque-povos-indigenas", cidadeId: "palmas", nome: "Parque dos Povos Indígenas", categoria: "natureza", latitude: -10.1729, longitude: -48.3268,
    endereco: "Quadra 203 Norte, Palmas - TO", horarios: SEM_HORARIO, gratuito: true, precoCentavos: 0, tempoMedioMin: 75,
    porQueConhecer: "Oferece área verde para caminhada e convivência em uma região central da cidade.",
    historia: "O parque faz parte da rede de áreas públicas de lazer e visitação mantidas pelo Município de Palmas.",
    avisoVisitacao: "Use os caminhos existentes, preserve a vegetação e evite horários de calor intenso.", fonte: "https://palmas.to.gov.br/core/noticias/parques-e-praias-da-capital-possuem-equipe-de-zeladoria-para-limpeza-frequente/", atualizadoEm: "2026-11-08",
  },
];

const APRESENTACAO: Record<string, { tags: string[]; distancia: string }> = {
  "praca-dos-girassois": { tags: ["Patrimônio", "História"], distancia: "Plano Diretor Norte" },
  "memorial-coluna-prestes": { tags: ["História", "Arquitetura"], distancia: "Praça dos Girassóis" },
  palacinho: { tags: ["Museu", "Memória"], distancia: "112 Norte" },
  "parque-cesamar": { tags: ["Natureza", "Lazer"], distancia: "506 Sul" },
  "espaco-cultural-jose-gomes-sobrinho": { tags: ["Arte", "Cultura"], distancia: "302 Sul" },
  "praia-da-graciosa": { tags: ["Natureza", "Pôr do sol"], distancia: "Orla da Graciosa" },
  "feira-304-sul": { tags: ["Gastronomia", "Artesanato"], distancia: "304 Sul" },
  "parque-povos-indigenas": { tags: ["Natureza", "Lazer"], distancia: "203 Norte" },
};

export const locais: LocalLista[] = LOCAIS_CURADOS.map((local) => ({ ...local, atualizadoEm: new Date(`${local.atualizadoEm}T12:00:00`), imagemUrl: null, audioUrl: null, tags: APRESENTACAO[local.id].tags, distancia: APRESENTACAO[local.id].distancia }));
