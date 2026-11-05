import { Ionicons } from "@expo/vector-icons";
import { useState, type ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  const [ajudaAberta, setAjudaAberta] = useState(false);
  if (acessibilidadeDesconhecida(acessibilidade)) return null;
  const itens = itensAcessibilidade(acessibilidade).filter((item) => item.nivel !== "desconhecido");
  return (
    <View style={styles.secao}>
      <TituloComAjuda titulo="Acessibilidade" aberta={ajudaAberta} onPress={() => setAjudaAberta((valor) => !valor)} />
      {ajudaAberta ? <Text accessibilityLiveRegion="polite" style={styles.ajuda}>Mostra recursos de acesso informados pelo local. ✓ significa disponível, − parcialmente disponível e × não disponível.</Text> : null}
      {itens.map((item) => (
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
        ))}
    </View>
  );
}

export function SecaoAmbienteSensorial({ ambiente }: { ambiente: AmbienteSensorial | null }) {
  const [ajudaAberta, setAjudaAberta] = useState(false);
  if (ambiente === null) return null;
  return (
    <View style={styles.secao}>
      <TituloComAjuda titulo="Ambiente sensorial" aberta={ajudaAberta} onPress={() => setAjudaAberta((valor) => !valor)} />
      {ajudaAberta ? <Text accessibilityLiveRegion="polite" style={styles.ajuda}>Ajuda a antecipar estímulos da visita, como ruído, iluminação, movimento de pessoas, filas e espaços de descanso.</Text> : null}
      {itensAmbiente(ambiente).map((item) => (
          <View
            key={item.rotulo}
            accessible
            accessibilityLabel={item.descricao}
            style={styles.linha}
          >
            <Text style={styles.rotulo}>{item.rotulo}</Text>
            <Text style={styles.valor}>{item.valor}</Text>
          </View>
        ))}
    </View>
  );
}

function TituloComAjuda({ titulo, aberta, onPress }: { titulo: string; aberta: boolean; onPress: () => void }) {
  return <View style={styles.tituloLinha}>
    <Text accessibilityRole="header" style={styles.titulo}>{titulo}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`Explicar ${titulo.toLowerCase()}`} accessibilityState={{ expanded: aberta }} hitSlop={8} onPress={onPress} style={styles.ajudaBotao}>
      <Ionicons name="help-circle-outline" size={22} color={colors.accentDark} />
    </Pressable>
  </View>;
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
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 19,
    letterSpacing: -0.5,
    color: colors.text,
    marginBottom: 6,
  },
  tituloLinha: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  ajudaBotao: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  ajuda: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, color: colors.textMuted, paddingBottom: 6 },
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
});
