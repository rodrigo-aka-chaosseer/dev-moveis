import { Tabs } from "expo-router";
import { View } from "react-native";
import { colors, fonts } from "../../src/theme/tokens";
import { Ionicons } from "@expo/vector-icons";

const icons = {
  index: "home-outline",
  explorar: "search-outline",
  mapa: "map-outline",
  roteiros: "git-branch-outline",
  perfil: "person-outline",
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: 72,
          paddingTop: 7,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: colors.tabBorder,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.regular,
          fontSize: 10,
          marginTop: 2,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <View style={styles.iconWrapper}>
            {focused && <View style={styles.activeIndicator} />}
            <Ionicons
              name={icons[route.name as keyof typeof icons]}
              size={size}
              color={color}
            />
          </View>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="explorar" options={{ title: "Explorar" }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa" }} />
      <Tabs.Screen name="roteiros" options={{ title: "Roteiros" }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil" }} />
    </Tabs>
  );
}

const styles = {
  iconWrapper: {
    width: 40,
    height: 32,
    alignItems: "center" as const,
    justifyContent: "flex-end" as const,
  },
  activeIndicator: {
    position: "absolute" as const,
    top: 0,
    width: 15,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
};
