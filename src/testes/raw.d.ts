/** Arquivo importado como texto pelo Vitest (`import x from "./a.sql?raw"`). Só para testes. */
declare module "*?raw" {
  const conteudo: string;
  export default conteudo;
}
