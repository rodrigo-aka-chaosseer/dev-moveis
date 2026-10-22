import { Text, View } from "react-native";
import { colors } from "../theme/tokens";
import type { PropsMapa } from "./modelo";

export default function MapaLugares(_props: PropsMapa) {
  return (
    <View style={{ padding: 24, backgroundColor: colors.surface2 }}>
      <Text style={{ color: colors.text }}>O mapa interativo está disponível no aplicativo Android e iOS. Consulte os lugares abaixo.</Text>
    </View>
  );
}
