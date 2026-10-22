import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { fotosLocais } from "../../mocks/fotos";
import type { LocalLista } from "../../mocks/locais";
import { colors } from "../../theme/tokens";
import { iconesCategoria } from "../visual/Guia";

/** Miniatura da parada: foto do banco, foto do catálogo ou ícone da categoria. */
export function FotoParada({ local, tamanho = 56 }: { local: LocalLista; tamanho?: number }) {
  const source = local.imagemUrl ? { uri: local.imagemUrl } : fotosLocais[local.id]?.source;
  return (
    <View accessible={false} style={[s.caixa, { width: tamanho, height: tamanho }]}>
      {source ? (
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <Ionicons name={iconesCategoria[local.categoria] ?? "compass-outline"} size={tamanho / 2.4} color={colors.earth} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  caixa: { borderRadius: 14, overflow: "hidden", backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" },
});
