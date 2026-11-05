import Head from "expo-router/head";

import { tituloDocumento } from "../../navegacao/titulos";

/**
 * Título da aba do navegador. O expo-router desliga o título automático na
 * web, então cada tela que tem nome próprio (um lugar, um roteiro) o
 * declara aqui; o resto vem do layout raiz. No celular o `<Head>` não faz
 * nada: lá vale o `title` do Stack.
 */
export function TituloPagina({ titulo }: { titulo: string }) {
  return (
    <Head>
      <title>{tituloDocumento(titulo)}</title>
    </Head>
  );
}
