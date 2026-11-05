import { describe, expect, it } from "vitest";

import { combinaComInteresse, interessesQueCombinam } from "./afinidade";

describe("afinidade entre preferências e lugares", () => {
  it("reconhece categorias relacionadas", () => {
    const local = { categoria: "patrimonio" as const, tags: [] };
    expect(interessesQueCombinam(local, ["historia", "cultura", "musica"]))
      .toEqual(["historia", "cultura"]);
  });

  it("reconhece tags sem depender de acentos", () => {
    const local = { categoria: "comunidade" as const, tags: ["Música popular"] };
    expect(combinaComInteresse(local, "musica")).toBe(true);
  });
});
