import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const chaveMapa = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  return {
    ...config,
    name: config.name ?? "Raízes",
    slug: config.slug ?? "raizes",
    plugins: [
      ...(config.plugins ?? []),
      ["react-native-maps", { androidGoogleMapsApiKey: chaveMapa }],
    ],
    // A tela consulta a disponibilidade sem depender do valor da chave.
    extra: { ...config.extra, mapaAndroidConfigurado: Boolean(chaveMapa) },
  };
};
