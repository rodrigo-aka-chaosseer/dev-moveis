import { describe, expect, it } from "vitest";

import { tituloDaRota, tituloDocumento } from "./titulos";

describe("títulos de tela", () => {
  it("nunca devolve o nome técnico da rota", () => {
    expect(tituloDaRota("/local/casa-benin", true)).toBe("Lugar");
    expect(tituloDaRota("/roteiro/caminhos-afro-salvador", true)).toBe("Roteiro");
    expect(tituloDaRota("/roteiro/criar", true)).toBe("Criar roteiro");
    expect(tituloDaRota("/rota-que-nao-existe", true)).toBe("Raízes");
  });

  it("a raiz é a Início com sessão e a abertura sem", () => {
    expect(tituloDaRota("/", true)).toBe("Início");
    expect(tituloDaRota("/", false)).toBe("Raízes");
    expect(tituloDaRota("/explorar/", true)).toBe("Explorar");
  });

  it("monta o título da aba do navegador", () => {
    expect(tituloDocumento("Casa do Benin")).toBe("Casa do Benin · Raízes");
    expect(tituloDocumento("Raízes")).toBe("Raízes");
  });
});
