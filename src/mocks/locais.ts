import type { Local } from "../db/schema";


export type LocalLista = Local & {
  tags: string[];
  distancia: string;
};

export const locais: LocalLista[] = [
  {
    id: "terreiro-ile-axe-opo-afonja",
    nome: "Terreiro Ilê Axé Opô Afonjá",
    categoria: "religiao",
    latitude: -12.9312,
    longitude: -38.4794,
    endereco: "Rua Direita de São Bento, Salvador",
    horarios: {
      sabado: { abre: "10:00", fecha: "18:00" },
    },
    gratuito: true,
    precoCentavos: null,
    tempoMedioMin: 60,
    porQueConhecer:
      "Casa de Candomblé reconhecida como patrimônio vivo. A visitação, quando permitida, é um convite a ouvir — não a consumir — uma tradição que segue em atividade.",
    historia:
      "Fundado no século XIX, o Ilê Axé Opô Afonjá é uma das casas mais antigas do Candomblé ketu em Salvador. O terreiro preserva ritos, línguas e saberes que atravessaram o Atlântico e seguem sendo transmitidos por gerações.",
    avisoVisitacao:
      "Espaço religioso em atividade. Visitas só ocorrem com autorização da casa e em dias definidos pela comunidade. Não é atração turística.",
    fonte: "IPHAN · Secretaria de Cultura da Bahia",
    atualizadoEm: new Date("2026-03-01T12:00:00"),
    imagemUrl:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad508fa?auto=format&fit=crop&w=800&q=80",
    audioUrl: null,
    tags: ["Afro-brasileira", "Religiosa"],
    distancia: "3,4 km",
  },
  {
    id: "restaurante-sabor-da-bahia",
    nome: "Restaurante do Sabor da Bahia",
    categoria: "gastronomia",
    latitude: -12.9714,
    longitude: -38.5124,
    endereco: "Pelourinho, Salvador",
    horarios: {
      terca: { abre: "11:00", fecha: "22:00" },
      quarta: { abre: "11:00", fecha: "22:00" },
      quinta: { abre: "11:00", fecha: "22:00" },
      sexta: { abre: "11:00", fecha: "22:00" },
      sabado: { abre: "11:00", fecha: "22:00" },
      domingo: { abre: "11:00", fecha: "16:00" },
    },
    gratuito: false,
    precoCentavos: 4500,
    tempoMedioMin: 75,
    porQueConhecer:
      "Cozinha de recôncavo feita por quem aprendeu a receita em casa, não em escola de gastronomia. O cardápio muda com o que chega da feira.",
    historia:
      "O restaurante nasceu de uma cozinha comunitária no Centro Histórico e virou ponto de encontro de quem quer a Bahia no prato sem o circuito só para turista. A casa segue de família e compra de produtores da região.",
    avisoVisitacao: null,
    fonte: "Secretaria de Cultura da Bahia",
    atualizadoEm: new Date("2026-03-01T12:00:00"),
    imagemUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
    audioUrl: null,
    tags: ["Comunitário", "Tradicional"],
    distancia: "800 m",
  },
  {
    id: "galeria-arte-negra",
    nome: "Galeria Arte Negra",
    categoria: "arte",
    latitude: -12.9811,
    longitude: -38.5152,
    endereco: "Rua Chile, Salvador",
    horarios: {
      terca: { abre: "10:00", fecha: "18:00" },
      quarta: { abre: "10:00", fecha: "18:00" },
      quinta: { abre: "10:00", fecha: "18:00" },
      sexta: { abre: "10:00", fecha: "18:00" },
      sabado: { abre: "10:00", fecha: "16:00" },
    },
    gratuito: true,
    precoCentavos: null,
    tempoMedioMin: 40,
    porQueConhecer:
      "Espaço de arte negra contemporânea com programação que cruza raça, gênero e território. Entrada livre, exposições rotativas.",
    historia:
      "A galeria foi aberta por artistas negros de Salvador que não encontravam parede nos circuitos oficiais. Desde então reúne mostra, conversa e ocupação do centro da cidade.",
    avisoVisitacao: null,
    fonte: "Secretaria de Cultura da Bahia",
    atualizadoEm: new Date("2026-03-01T12:00:00"),
    imagemUrl:
      "https://images.unsplash.com/photo-1531243268764-789783257831?auto=format&fit=crop&w=800&q=80",
    audioUrl: null,
    tags: ["LGBTQIA+", "Arte"],
    distancia: "1,5 km",
  },
];
