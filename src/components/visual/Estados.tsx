import type { ComponentProps } from "react";
import { View } from "react-native";
import type { Ionicons } from "@expo/vector-icons";

import { Botao, Estado } from "./Guia";

type Icone = ComponentProps<typeof Ionicons>["name"];
type Acao = { texto: string; onPress: () => void };

/**
 * Os três estados de lista e detalhe, iguais em todas as telas (H4).
 * Carregando: só o indicador e uma frase. Erro: sempre com "Tentar
 * novamente". Vazio: ícone, motivo e uma ação para sair dele.
 */
export function Carregando({ titulo }: { titulo: string }) {
  return <Estado titulo={titulo} carregando />;
}

export function ErroCarregar({
  mensagem,
  onTentarDeNovo,
  titulo = "Não conseguimos carregar",
  secundaria,
}: {
  mensagem: string;
  onTentarDeNovo: () => void;
  titulo?: string;
  secundaria?: Acao;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Estado titulo={titulo} descricao={mensagem} icone="cloud-offline-outline" />
      <Botao texto="Tentar novamente" onPress={onTentarDeNovo} />
      {secundaria ? <Botao texto={secundaria.texto} onPress={secundaria.onPress} secundario /> : null}
    </View>
  );
}

export function Vazio({
  icone = "compass-outline",
  titulo,
  mensagem,
  acao,
}: {
  icone?: Icone;
  titulo: string;
  mensagem: string;
  acao?: Acao;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Estado titulo={titulo} descricao={mensagem} icone={icone} />
      {acao ? <Botao texto={acao.texto} onPress={acao.onPress} secundario /> : null}
    </View>
  );
}
