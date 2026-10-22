import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { locais } from "../mocks/locais";
import Mapa from "../../app/(tabs)/mapa";

const mocks = vi.hoisted(() => ({
  preferencias: { cidadeId: "salvador" as string | null, pronto: true, erro: null, escolherCidade: vi.fn() },
  locais: { locais: [] as unknown[], carregando: false, erro: null as string | null, recarregar: vi.fn() },
  localizacao: { coordenadas: null as { latitude: number; longitude: number } | null, estado: "ocioso", solicitar: vi.fn(), podePerguntarNovamente: true },
  push: vi.fn(), settings: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator", Pressable: "Pressable", ScrollView: "ScrollView", Text: "Text", View: "View",
  StyleSheet: { create: (styles: unknown) => styles }, Linking: { openSettings: mocks.settings },
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
vi.mock("../preferencias/PreferenciasProvider", () => ({ usePreferencias: () => mocks.preferencias }));
vi.mock("../locais/useLocais", () => ({ useLocais: () => mocks.locais }));
vi.mock("../localizacao", () => ({ useLocalizacao: () => mocks.localizacao }));
vi.mock("./MapaLugares", () => ({ default: "MapaLugares" }));
vi.mock("../lib/supabase", () => ({ supabase: null }));

let tela: ReactTestRenderer;
const tipo = (nome: string) => nome as unknown as Parameters<ReactTestRenderer["root"]["findByType"]>[0];
const texto = () => JSON.stringify(tela.toJSON());
async function montar() { await act(async () => { tela = create(createElement(Mapa)); }); }
async function clicar(rotulo: string) {
  const botao = tela.root.findAllByType(tipo("Pressable")).find((item) =>
    JSON.stringify(item.findAllByType(tipo("Text")).map((filho) => filho.props.children)).includes(rotulo));
  expect(botao).toBeDefined();
  await act(async () => { botao!.props.onPress(); });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.clearAllMocks();
  Object.assign(mocks.preferencias, { cidadeId: "salvador", pronto: true, erro: null });
  Object.assign(mocks.locais, { locais: locais.filter((local) => local.cidadeId === "salvador"), carregando: false, erro: null });
  Object.assign(mocks.localizacao, { coordenadas: null, estado: "ocioso", podePerguntarNovamente: true });
});
afterEach(async () => { if (tela) await act(async () => tela.unmount()); });

describe("aba Mapa", () => {
  it("envia os lugares e a posição para o mapa; tocar no marcador abre resumo e detalhe", async () => {
    mocks.localizacao.coordenadas = { latitude: -12.97, longitude: -38.5 };
    mocks.localizacao.estado = "disponivel";
    await montar();
    const mapa = tela.root.findByType(tipo("MapaLugares"));
    expect(mapa.props.locais).toEqual(mocks.locais.locais);
    expect(mapa.props.coordenadas).toEqual(mocks.localizacao.coordenadas);
    const local = locais[0];
    await act(async () => mapa.props.selecionar(local.id));
    expect(texto()).toContain(local.porQueConhecer);
    await clicar("Ver detalhes de");
    expect(mocks.push).toHaveBeenCalledWith(`/roteiro/${local.id}`);
  });

  it("remove resumo da cidade anterior ao trocar a cidade", async () => {
    await montar();
    await act(async () => tela.root.findByType(tipo("MapaLugares")).props.selecionar(locais[0].id));
    await clicar("Recife");
    expect(mocks.preferencias.escolherCidade).toHaveBeenCalledWith("recife");
    expect(texto()).not.toContain("Ver detalhes de");
  });

  it.each(["permissao_negada", "servico_desativado", "erro"])("mantém lugares acessíveis com localização %s", async (estado) => {
    mocks.localizacao.estado = estado;
    await montar();
    expect(tela.root.findByType(tipo("MapaLugares")).props.coordenadas).toBeNull();
    expect(texto()).toContain(locais[0].nome);
    await clicar("Atualizar minha localização");
    expect(mocks.localizacao.solicitar).toHaveBeenCalledOnce();
  });

  it("abre configurações quando não pode pedir permissão novamente", async () => {
    Object.assign(mocks.localizacao, { estado: "permissao_negada", podePerguntarNovamente: false });
    await montar();
    await clicar("Abrir configurações");
    expect(mocks.settings).toHaveBeenCalledOnce();
    expect(mocks.localizacao.solicitar).not.toHaveBeenCalled();
  });

  it("trata carregamento, erro com nova tentativa e lista vazia", async () => {
    mocks.locais.carregando = true;
    await montar();
    expect(texto()).toContain("Carregando lugares");
    expect(tela.root.findAllByType(tipo("MapaLugares"))).toHaveLength(0);
    Object.assign(mocks.locais, { carregando: false, erro: "Não foi possível carregar os lugares." });
    await act(async () => tela.update(createElement(Mapa)));
    await clicar("Tentar novamente");
    expect(mocks.locais.recarregar).toHaveBeenCalledOnce();
    Object.assign(mocks.locais, { erro: null, locais: [] });
    await act(async () => tela.update(createElement(Mapa)));
    expect(texto()).toContain("Ainda não temos lugares em");
  });
});
