import { describe, expect, it } from "vitest";

import {
  ACESSIBILIDADE_DESCONHECIDA,
  acessibilidadeDesconhecida,
  itensAcessibilidade,
  itensAmbiente,
  lerAcessibilidade,
  lerAmbienteSensorial,
} from "./acessibilidade";

const LINHA_ACESSIBILIDADE = {
  local_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  rampa: "sim",
  elevador: "nao",
  banheiro_acessivel: "parcial",
  piso_tatil: "sim",
  estacionamento_acessivel: "nao",
  audiodescricao: "desconhecido",
  libras: "sim",
  braille: "nao",
};

const LINHA_AMBIENTE = {
  local_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  ruido: "medio",
  iluminacao: "baixa",
  movimentacao: "alta",
  tem_fila: true,
  espaco_descanso: false,
};

describe("lerAcessibilidade", () => {
  it("lê os seis recursos da linha do banco", () => {
    expect(lerAcessibilidade(LINHA_ACESSIBILIDADE)).toEqual({
      rampa: "sim",
      elevador: "nao",
      banheiroAcessivel: "parcial",
      libras: "sim",
      braille: "nao",
      audiodescricao: "desconhecido",
    });
  });

  it("aceita a relação vinda como lista", () => {
    expect(lerAcessibilidade([LINHA_ACESSIBILIDADE]).rampa).toBe("sim");
  });

  it("lugar sem linha é desconhecido, nunca 'não disponível'", () => {
    expect(lerAcessibilidade(null)).toEqual(ACESSIBILIDADE_DESCONHECIDA);
    expect(lerAcessibilidade(undefined)).toEqual(ACESSIBILIDADE_DESCONHECIDA);
    expect(lerAcessibilidade([])).toEqual(ACESSIBILIDADE_DESCONHECIDA);
  });

  it("valor ausente ou fora do esperado vira desconhecido", () => {
    const lida = lerAcessibilidade({ rampa: "talvez", elevador: null, libras: true });

    expect(lida.rampa).toBe("desconhecido");
    expect(lida.elevador).toBe("desconhecido");
    expect(lida.libras).toBe("desconhecido");
    expect(lida.braille).toBe("desconhecido");
  });
});

describe("lerAmbienteSensorial", () => {
  it("lê ruído, iluminação, movimento, fila e descanso", () => {
    expect(lerAmbienteSensorial(LINHA_AMBIENTE)).toEqual({
      ruido: "medio",
      iluminacao: "baixa",
      movimentacao: "alta",
      temFila: true,
      espacoDescanso: false,
    });
  });

  it("sem linha não há ambiente informado", () => {
    expect(lerAmbienteSensorial(null)).toBeNull();
    expect(lerAmbienteSensorial([])).toBeNull();
  });

  it("linha incompleta não vira informação inventada", () => {
    expect(lerAmbienteSensorial({ ...LINHA_AMBIENTE, ruido: "ensurdecedor" })).toBeNull();
    expect(lerAmbienteSensorial({ ...LINHA_AMBIENTE, tem_fila: null })).toBeNull();
  });
});

describe("texto para a tela", () => {
  it("diferencia disponível, parcial, não disponível e não informado", () => {
    const itens = itensAcessibilidade(lerAcessibilidade(LINHA_ACESSIBILIDADE));
    const porChave = Object.fromEntries(itens.map((item) => [item.chave, item.situacao]));

    expect(porChave).toEqual({
      rampa: "Disponível",
      elevador: "Não disponível",
      banheiroAcessivel: "Parcial",
      libras: "Disponível",
      braille: "Não disponível",
      audiodescricao: "Não informado",
    });
  });

  it("monta frases completas para o leitor de tela", () => {
    const itens = itensAcessibilidade(lerAcessibilidade(LINHA_ACESSIBILIDADE));

    expect(itens.map((item) => item.descricao)).toEqual([
      "Rampa: disponível",
      "Elevador: não disponível",
      "Banheiro acessível: parcial",
      "Libras: disponível",
      "Braille: não disponível",
      "Audiodescrição: não informado",
    ]);
  });

  it("reconhece quando nada foi informado", () => {
    expect(acessibilidadeDesconhecida(ACESSIBILIDADE_DESCONHECIDA)).toBe(true);
    expect(acessibilidadeDesconhecida(lerAcessibilidade(LINHA_ACESSIBILIDADE))).toBe(false);
  });

  it("descreve o ambiente sensorial", () => {
    const itens = itensAmbiente(lerAmbienteSensorial(LINHA_AMBIENTE)!);

    expect(itens.map((item) => item.descricao)).toEqual([
      "Ruído: médio",
      "Iluminação: baixa",
      "Movimento de pessoas: alta",
      "Fila: costuma ter",
      "Espaço de descanso: não tem",
    ]);
  });
});
