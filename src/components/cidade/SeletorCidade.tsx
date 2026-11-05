import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { usePreferencias } from "../../preferencias/PreferenciasProvider";
import { CIDADES, nomeCidade, type CidadeId } from "../../preferencias/dados";
import { colors, fonts, MIN_TOUCH, radius } from "../../theme/tokens";

/**
 * Escolha da cidade em qualquer tela (H3). Grava pelo PreferenciasProvider,
 * o mesmo lugar onde o onboarding guarda: a escolha sobrevive ao fechar o
 * app, sincroniza com a conta e os hooks que dependem de `cidadeId`
 * (useLocais, useRoteiros, o formulário de roteiro) recarregam sozinhos.
 *
 * - "cartoes": lista grande com marca de seleção (onboarding).
 * - "etiquetas": uma pílula por cidade (Início e Explorar).
 * - "linha": mostra a cidade atual e abre as opções ao tocar (Perfil).
 */
export function SeletorCidade({
  variante,
  aberto: abertoInicial = false,
  onEscolher,
}: {
  variante: "cartoes" | "etiquetas" | "linha";
  aberto?: boolean;
  onEscolher?: (id: CidadeId) => void;
}) {
  const { cidadeId, escolherCidade, pronto } = usePreferencias();
  const [aberto, setAberto] = useState(abertoInicial);

  function escolher(id: CidadeId) {
    escolherCidade(id);
    setAberto(false);
    onEscolher?.(id);
  }

  if (variante === "linha") {
    return (
      <View style={{ gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Cidade para explorar: ${nomeCidade(cidadeId) ?? "nenhuma escolhida"}. Trocar cidade`}
          accessibilityState={{ expanded: aberto }}
          onPress={() => setAberto((valor) => !valor)}
          style={s.linha}
        >
          <View style={s.icone}><Ionicons name="location-outline" size={22} color={colors.accentDark} /></View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.rotulo}>Cidade para explorar</Text>
            <Text style={s.valor}>{pronto ? nomeCidade(cidadeId) ?? "Escolha sua cidade" : "Carregando…"}</Text>
          </View>
          <Text style={s.trocar}>{aberto ? "Fechar" : "Trocar"}</Text>
        </Pressable>
        {aberto ? <Etiquetas atual={cidadeId} onEscolher={escolher} /> : null}
      </View>
    );
  }

  if (variante === "etiquetas") {
    return <Etiquetas atual={cidadeId} onEscolher={escolher} />;
  }

  return (
    <View style={{ gap: 12 }}>
      {CIDADES.map((cidade) => {
        const selecionada = cidadeId === cidade.id;
        return (
          <Pressable
            key={cidade.id}
            accessibilityRole="button"
            accessibilityLabel={`${cidade.nome}, ${cidade.uf}`}
            accessibilityState={{ selected: selecionada }}
            onPress={() => escolher(cidade.id)}
            style={({ pressed }) => [s.cartao, selecionada && s.cartaoAtivo, pressed && { opacity: 0.8 }]}
          >
            <Text style={[s.cartaoNome, selecionada && { color: colors.accentDark }]}>{cidade.nome}, {cidade.uf}</Text>
            <View style={[s.marca, selecionada && s.marcaAtiva]}>
              {selecionada ? <Ionicons name="checkmark" size={14} color={colors.onDark} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Etiquetas({ atual, onEscolher }: { atual: CidadeId | null; onEscolher: (id: CidadeId) => void }) {
  return (
    <View style={s.etiquetas}>
      {CIDADES.map((cidade) => {
        const selecionada = atual === cidade.id;
        return (
          <Pressable
            key={cidade.id}
            accessibilityRole="button"
            accessibilityLabel={`${cidade.nome}, ${cidade.uf}`}
            accessibilityState={{ selected: selecionada }}
            onPress={() => onEscolher(cidade.id)}
            style={[s.etiqueta, selecionada && s.etiquetaAtiva]}
          >
            <Ionicons name="location-outline" size={15} color={selecionada ? colors.onDark : colors.earth} />
            <Text style={[s.etiquetaTexto, selecionada && { color: colors.onDark }]}>{cidade.nome}, {cidade.uf}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", gap: 12, alignItems: "center", minHeight: 56 },
  icone: { width: 46, height: 46, backgroundColor: colors.surface2, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  rotulo: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, color: colors.textMuted },
  valor: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  trocar: { fontFamily: fonts.semibold, fontSize: 12, color: colors.accentDark },
  etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  etiqueta: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: MIN_TOUCH, paddingHorizontal: 16, borderRadius: 24, backgroundColor: colors.surface },
  etiquetaAtiva: { backgroundColor: colors.earth },
  etiquetaTexto: { fontFamily: fonts.semibold, fontSize: 12, color: colors.earth },
  cartao: { minHeight: 64, borderRadius: radius.card, borderWidth: 1.5, borderColor: colors.surface3, backgroundColor: colors.surface, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cartaoAtivo: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  cartaoNome: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  marca: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.surface3, alignItems: "center", justifyContent: "center" },
  marcaAtiva: { backgroundColor: colors.accent, borderColor: colors.accent },
});
