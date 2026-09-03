import { router } from "expo-router";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Perfil() {
  return (
    <SafeAreaView>
      <Text>Perfil</Text>
      <Button title="Voltar" onPress={() => router.back()} />
    </SafeAreaView>
  );
}