import { View } from "react-native";
import { colors } from "../theme/tokens";

export function EmptyTab() {
  return <View style={{ flex: 1, backgroundColor: colors.surface }} />;
}
