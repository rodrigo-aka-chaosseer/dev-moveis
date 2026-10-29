import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  acessibilidadeDesconhecida,
  itensAcessibilidade,
  itensAmbiente,
  type Acessibilidade,
  type AmbienteSensorial,
  type NivelAcessibilidade,
} from "../../locais/acessibilidade";
import { colors, fonts } from "../../theme/tokens";

type NomeIcone = ComponentProps<typeof Ionicons>["name"];

// O ícone só reforça: a situação sempre aparece escrita ao lado, e o leitor
// de tela lê a frase inteira, nunca o ícone.
const ICONES: Record<NivelAcessibilidade, { nome: NomeIcone; cor: string }> = {
  sim: { nome: "checkmark-circle", cor: colors.accent },
  parcial: { nome: "remove-circle", cor: colors.accent },
  nao: { nome: "close-circle", cor: colors.textMuted },
  desconhecido: { nome: "help-circle-outline", cor: colors.tabInactive },
};

export function SecaoAcessibilidade({ acessibilidade }: { acessibilidade: Acessibilidade }) {
  return (
    <View style={styles.secao}>
      <Text accessibilityRole="header" style={styles.titulo}>
        Acessibilidade
      </Text>
      {acessibilidadeDesconhecida(acessibilidade) ? (
        <Text style={styles.vazio}>
          Ainda não temos informações de acessibilidade deste lugar.
        </Text>
      ) : (
        itensAcessibilidade(acessibilidade).map((item) => (
          <View
            key={item.chave}
            accessible
            accessibilityLabel={item.descricao}
            style={styles.linha}
          >
            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              name={ICONES[item.nivel].nome}
              size={18}
              color={ICONES[item.nivel].cor}
            />
            <Text style={styles.rotulo}>{item.rotulo}</Text>
            <Text
              style={[styles.valor, item.nivel === "desconhecido" && styles.valorDesconhecido]}
            >
              {item.situacao}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export function SecaoAmbienteSensorial({ ambiente }: { ambiente: AmbienteSensorial | null }) {
  return (
    <View style={styles.secao}>
      <Text accessibilityRole="header" style={styles.titulo}>
        Ambiente sensorial
      </Text>
      {ambiente === null ? (
        <Text style={styles.vazio}>
          Ainda não temos informações sobre o ambiente deste lugar.
        </Text>
      ) : (
        itensAmbiente(ambiente).map((item) => (
          <View
            key={item.rotulo}
            accessible
            accessibilityLabel={item.descricao}
            style={styles.linha}
          >
            <Text style={styles.rotulo}>{item.rotulo}</Text>
            <Text style={styles.valor}>{item.valor}</Text>
          </View>
        ))
      )}
    </View>
  );
}

// Mesmo visual dos cartões de `components/visual/Guia` (v.bloco e
// v.secaoTitulo). Os valores ficam aqui para o teste de componente não
// precisar carregar o Guia inteiro.
const styles = StyleSheet.create({
  secao: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 24,
    gap: 4,
  },
  titulo: {
    fontFamily: fonts.semibold,
    fontSize: 19,
    letterSpacing: -0.5,
    color: colors.text,
    marginBottom: 6,
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface3,
  },
  rotulo: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  valor: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.earth,
  },
  valorDesconhecido: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  vazio: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    color: colors.textMuted,
  },
});
