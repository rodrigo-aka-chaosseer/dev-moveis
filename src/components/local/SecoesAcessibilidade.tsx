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

const styles = StyleSheet.create({
  secao: {
    marginBottom: 24,
  },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
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
    color: colors.text,
  },
  valorDesconhecido: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  vazio: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
});
