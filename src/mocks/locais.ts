import type { Local } from "../db/schema";
import type { CidadeId } from "../preferencias/dados";

export type LocalLista = Local & {
  cidadeId: CidadeId;
  tags: string[];
  distancia: string;
};

export type CategoriaLocal =
  | "gastronomia"
  | "historia"
  | "cultura"
  | "arte"
  | "musica"
  | "religiao"
  | "patrimonio"
  | "comunidade"
  | "natureza"
  | "evento";

export type LocalCurado = {
  id: string;
  cidadeId: CidadeId;
  nome: string;
  categoria: CategoriaLocal;
  latitude: number;
  longitude: number;
  endereco: string;
  horarios: Record<string, { abre: string; fecha: string } | null>;
  gratuito: boolean;
  precoCentavos: number | null;
  tempoMedioMin: number;
  porQueConhecer: string;
  historia: string;
  /** Segurança cultural: null significa visitação livre. */
  avisoVisitacao: string | null;
  fonte: string;
  atualizadoEm: string;
};

/**
 * Primeiro lote editorial do catálogo. O texto foi sintetizado de páginas
 * oficiais de turismo e cultura; `fonte` mantém o caminho de auditoria.
 * Horários e preços são voláteis e devem ser reconferidos antes da publicação.
 */
const LOCAIS_CURADOS: LocalCurado[] = [
  {
    id: "casa-carnaval-bahia",
    cidadeId: "salvador",
    nome: "Casa do Carnaval da Bahia",
    categoria: "cultura",
    latitude: -12.9724,
    longitude: -38.509,
    endereco: "Praça Ramos de Queirós, s/n, Pelourinho, Salvador - BA",
    horarios: {
      segunda: null,
      terca: { abre: "10:00", fecha: "18:00" },
      quarta: { abre: "10:00", fecha: "18:00" },
      quinta: { abre: "10:00", fecha: "18:00" },
      sexta: { abre: "10:00", fecha: "18:00" },
      sabado: { abre: "10:00", fecha: "18:00" },
      domingo: { abre: "10:00", fecha: "18:00" },
    },
    gratuito: false,
    precoCentavos: null,
    tempoMedioMin: 90,
    porQueConhecer:
      "Apresenta o Carnaval baiano como memória coletiva, linguagem artística e força de transformação social, não apenas como festa.",
    historia:
      "Instalado no Centro Histórico, o museu ocupa quatro pavimentos e reúne roupas, instrumentos, maquetes, documentos, cinemas e experiências interativas sobre os ritmos e personagens da folia baiana.",
    avisoVisitacao: null,
    fonte: "https://www.salvadordabahia.com/experiencias/casa-do-carnaval/",
    atualizadoEm: "2026-10-10",
  },
  {
    id: "casa-rio-vermelho",
    cidadeId: "salvador",
    nome: "Casa do Rio Vermelho",
    categoria: "historia",
    latitude: -13.016,
    longitude: -38.4871,
    endereco: "Rua Alagoinhas, 33, Rio Vermelho, Salvador - BA",
    horarios: {
      segunda: null,
      terca: { abre: "09:00", fecha: "17:00" },
      quarta: { abre: "09:00", fecha: "17:00" },
      quinta: { abre: "09:00", fecha: "17:00" },
      sexta: { abre: "09:00", fecha: "17:00" },
      sabado: { abre: "09:00", fecha: "17:00" },
      domingo: { abre: "09:00", fecha: "17:00" },
    },
    gratuito: false,
    precoCentavos: 2000,
    tempoMedioMin: 90,
    porQueConhecer:
      "A residência aproxima literatura, memória urbana e vida cotidiana ao preservar a trajetória de Jorge Amado e Zélia Gattai.",
    historia:
      "O casal viveu ali por cerca de quarenta anos. A casa virou memorial com objetos, cartas, biblioteca, obras de arte, vídeos e o jardim onde estão depositadas suas cinzas.",
    avisoVisitacao: "A visita percorre uma antiga residência e um jardim memorial; preserve os ambientes e siga a orientação da equipe.",
    fonte: "https://www.salvadordabahia.com/experiencias/casa-do-rio-vermelho/",
    atualizadoEm: "2026-10-10",
  },
  {
    id: "casa-benin",
    cidadeId: "salvador",
    nome: "Casa do Benin",
    categoria: "arte",
    latitude: -12.9705,
    longitude: -38.5067,
    endereco: "Baixa dos Sapateiros, 7, Pelourinho, Salvador - BA",
    horarios: {
      segunda: null,
      terca: { abre: "10:00", fecha: "17:00" },
      quarta: { abre: "10:00", fecha: "17:00" },
      quinta: { abre: "10:00", fecha: "17:00" },
      sexta: { abre: "10:00", fecha: "17:00" },
      sabado: { abre: "09:00", fecha: "16:00" },
      domingo: null,
    },
    gratuito: true,
    precoCentavos: 0,
    tempoMedioMin: 60,
    porQueConhecer:
      "Materializa as conexões históricas entre a Bahia, o Golfo do Benin e a diáspora africana por meio de arte, arquitetura e educação.",
    historia:
      "Inaugurada em 1988, reúne cerca de duzentas peças coletadas por Pierre Verger, exposições afro-diaspóricas e espaços projetados por Lina Bo Bardi.",
    avisoVisitacao: "Algumas obras tratam de práticas religiosas e memória da diáspora; fotografe apenas onde a equipe autorizar.",
    fonte: "https://www.salvadordabahia.com/experiencias/casa-do-benin/",
    atualizadoEm: "2026-10-10",
  },
  {
    id: "mafro-ufba",
    cidadeId: "salvador",
    nome: "Museu Afro-Brasileiro da UFBA",
    categoria: "historia",
    latitude: -12.9725,
    longitude: -38.5092,
    endereco: "Largo Terreiro de Jesus, s/n, Pelourinho, Salvador - BA",
    horarios: {
      segunda: { abre: "09:00", fecha: "17:00" },
      terca: { abre: "09:00", fecha: "17:00" },
      quarta: { abre: "09:00", fecha: "17:00" },
      quinta: { abre: "09:00", fecha: "17:00" },
      sexta: { abre: "09:00", fecha: "17:00" },
      sabado: null,
      domingo: null,
    },
    gratuito: false,
    precoCentavos: null,
    tempoMedioMin: 75,
    porQueConhecer:
      "É um dos poucos museus brasileiros dedicados exclusivamente às culturas africanas e à presença dessas matrizes na formação do Brasil.",
    historia:
      "Organizado inicialmente com participação de Pierre Verger, ocupa o edifício da antiga Faculdade de Medicina e guarda objetos africanos, peças afro-brasileiras e painéis de orixás talhados por Carybé.",
    avisoVisitacao: "O acervo inclui objetos ligados a religiões afro-brasileiras; observe as orientações do museu sobre fotografia e tratamento respeitoso das peças.",
    fonte: "https://www.salvadordabahia.com/experiencias/mafro-museu-afro-brasileiro-da-ufba/",
    atualizadoEm: "2026-10-10",
  },
  {
    id: "igreja-rosario-pretos",
    cidadeId: "salvador",
    nome: "Igreja Nossa Senhora do Rosário dos Pretos",
    categoria: "religiao",
    latitude: -12.971,
    longitude: -38.508,
    endereco: "Largo do Pelourinho, s/n, Salvador - BA",
    horarios: {
      segunda: { abre: "08:00", fecha: "16:45" },
      terca: { abre: "08:00", fecha: "16:45" },
      quarta: { abre: "08:00", fecha: "16:45" },
      quinta: { abre: "08:00", fecha: "16:45" },
      sexta: { abre: "08:00", fecha: "16:45" },
      sabado: { abre: "08:00", fecha: "11:45" },
      domingo: null,
    },
    gratuito: true,
    precoCentavos: 0,
    tempoMedioMin: 45,
    porQueConhecer:
      "É um símbolo vivo da fé, organização comunitária e resistência negra em Salvador, com liturgia que preserva referências africanas.",
    historia:
      "A irmandade foi fundada por africanos escravizados no século XVII, e o templo foi erguido no século XVIII. A tradição católica dialoga com cantos, atabaques e devoções afro-baianas.",
    avisoVisitacao: "É um templo religioso em atividade. Não interrompa celebrações, use roupa adequada e solicite autorização antes de fotografar pessoas ou ritos.",
    fonte: "https://www.salvadordabahia.com/experiencias/igreja-nossa-senhora-do-rosario-dos-pretos/",
    atualizadoEm: "2026-10-10",
  },
  {
    id: "paco-frevo",
    cidadeId: "recife",
    nome: "Paço do Frevo",
    categoria: "musica",
    latitude: -8.0612,
    longitude: -34.8712,
    endereco: "Praça do Arsenal da Marinha, s/n, Bairro do Recife, Recife - PE",
    horarios: {
      segunda: null,
      terca: { abre: "10:00", fecha: "17:00" },
      quarta: { abre: "10:00", fecha: "17:00" },
      quinta: { abre: "10:00", fecha: "17:00" },
      sexta: { abre: "10:00", fecha: "17:00" },
      sabado: { abre: "11:00", fecha: "18:00" },
      domingo: { abre: "11:00", fecha: "18:00" },
    },
    gratuito: false,
    precoCentavos: 1000,
    tempoMedioMin: 90,
    porQueConhecer:
      "Une documentação, formação, dança e música para manter vivo o frevo, reconhecido como Patrimônio Cultural Imaterial da Humanidade.",
    historia:
      "O centro ocupa um edifício histórico que já abrigou a Western Telegraph Company e oferece quatro pavimentos de exposições, oficinas, pesquisa e apresentações.",
    avisoVisitacao: null,
    fonte: "https://www2.recife.pe.gov.br/servico/paco-do-frevo?op=MTMy",
    atualizadoEm: "2026-10-10",
  },
  {
    id: "cais-sertao",
    cidadeId: "recife",
    nome: "Cais do Sertão",
    categoria: "cultura",
    latitude: -8.0637,
    longitude: -34.8718,
    endereco: "Armazém 10, Avenida Alfredo Lisboa, s/n, Recife - PE",
    horarios: {
      segunda: null,
      terca: { abre: "10:00", fecha: "16:00" },
      quarta: { abre: "10:00", fecha: "16:00" },
      quinta: { abre: "10:00", fecha: "16:00" },
      sexta: { abre: "10:00", fecha: "16:00" },
      sabado: { abre: "13:00", fecha: "18:00" },
      domingo: { abre: "13:00", fecha: "18:00" },
    },
    gratuito: false,
    precoCentavos: null,
    tempoMedioMin: 90,
    porQueConhecer:
      "Conecta litoral e interior por uma experiência sensorial sobre paisagens, trabalho, religiosidade e música do sertão nordestino.",
    historia:
      "Instalado em um antigo armazém portuário, o museu usa instalações audiovisuais e ambientes imersivos, tendo a obra de Luiz Gonzaga como um de seus eixos centrais.",
    avisoVisitacao: null,
    fonte: "https://visit.recife.pe.gov.br/lugar/cais-do-sertao/",
    atualizadoEm: "2026-10-10",
  },
  {
    id: "casa-cultura-pernambuco",
    cidadeId: "recife",
    nome: "Casa da Cultura de Pernambuco",
    categoria: "patrimonio",
    latitude: -8.0677,
    longitude: -34.8844,
    endereco: "Rua Floriano Peixoto, s/n, São José, Recife - PE",
    horarios: {
      segunda: { abre: "09:00", fecha: "17:00" },
      terca: { abre: "09:00", fecha: "17:00" },
      quarta: { abre: "09:00", fecha: "17:00" },
      quinta: { abre: "09:00", fecha: "17:00" },
      sexta: { abre: "09:00", fecha: "17:00" },
      sabado: { abre: "09:00", fecha: "17:00" },
      domingo: { abre: "09:00", fecha: "14:00" },
    },
    gratuito: true,
    precoCentavos: 0,
    tempoMedioMin: 75,
    porQueConhecer:
      "Transforma um antigo espaço de confinamento em centro de artesanato, memória e produção cultural pernambucana.",
    historia:
      "O prédio do século XIX abrigou a Casa de Detenção do Recife. Suas antigas celas hoje funcionam como lojas e ateliês de artesanato e produtos regionais.",
    avisoVisitacao: null,
    fonte: "https://visit.recife.pe.gov.br/lugar/casa-da-cultura-de-pernambuco/",
    atualizadoEm: "2026-10-10",
  },
];
const APRESENTACAO: Record<string, { tags: string[]; distancia: string }> = {
  "casa-carnaval-bahia": { tags: ["Cultura", "Música"], distancia: "Centro Histórico" },
  "casa-rio-vermelho": { tags: ["Literatura", "Memória"], distancia: "Rio Vermelho" },
  "casa-benin": { tags: ["Afro-brasileira", "Arte"], distancia: "Centro Histórico" },
  "mafro-ufba": { tags: ["Afro-brasileira", "História"], distancia: "Centro Histórico" },
  "igreja-rosario-pretos": { tags: ["Religiosa", "Afro-brasileira"], distancia: "Pelourinho" },
  "paco-frevo": { tags: ["Música", "Dança"], distancia: "Recife Antigo" },
  "cais-sertao": { tags: ["Cultura", "Música"], distancia: "Recife Antigo" },
  "casa-cultura-pernambuco": { tags: ["Patrimônio", "Artesanato"], distancia: "São José" },
};

export const locais: LocalLista[] = LOCAIS_CURADOS.map((local) => ({
  ...local,
  atualizadoEm: new Date(`${local.atualizadoEm}T12:00:00`),
  imagemUrl: null,
  audioUrl: null,
  tags: APRESENTACAO[local.id].tags,
  distancia: APRESENTACAO[local.id].distancia,
}));
