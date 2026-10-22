import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../../src/theme/tokens";

const icons = { index: "home-outline", explorar: "search-outline", mapa: "map-outline", roteiros: "trail-sign-outline", perfil: "person-outline" } as const;
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return <Tabs backBehavior="history" screenOptions={({ route }) => ({
    headerShown: false, tabBarActiveTintColor: colors.accentDark, tabBarInactiveTintColor: colors.textMuted,
    tabBarStyle: { height: 72 + insets.bottom, paddingTop: 10, paddingBottom: Math.max(10, insets.bottom), borderTopWidth: 0, backgroundColor: colors.surface },
    tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 10, marginTop: 3 },
    tabBarIcon: ({ color, focused }) => <View style={{ width: 48, height: 30, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: focused ? colors.accentTint : "transparent" }}><Ionicons name={icons[route.name as keyof typeof icons]} size={21} color={color} /></View>,
  })}>
    <Tabs.Screen name="index" options={{ title: "Início", tabBarLabel: "Início" }} />
    <Tabs.Screen name="explorar" options={{ title: "Explorar", tabBarLabel: "Explorar" }} />
    <Tabs.Screen name="mapa" options={{ title: "Mapa", tabBarLabel: "Mapa" }} />
    <Tabs.Screen name="roteiros" options={{ title: "Roteiros", tabBarLabel: "Roteiros" }} />
    <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarLabel: "Perfil" }} />
  </Tabs>;
}
