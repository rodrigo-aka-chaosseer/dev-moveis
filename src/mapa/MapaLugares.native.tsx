import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import MapView, { Marker } from "react-native-maps";
import { colors, MIN_TOUCH } from "../theme/tokens";
import { regiaoDosLocais, type PropsMapa } from "./modelo";

export default function MapaLugares(props: PropsMapa) {
  const configurado = Platform.OS !== "android"
    || Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    || Constants.expoConfig?.extra?.mapaAndroidConfigurado === true;
  if (!configurado) {
    return <Text style={styles.aviso}>Mapa indisponível nesta versão. Consulte os lugares abaixo.</Text>;
  }
  return <MapaConfigurado {...props} />;
}

function MapaConfigurado({ cidadeId, locais, coordenadas, selecionadoId, selecionar }: PropsMapa) {
  const mapa = useRef<MapView>(null);
  const [pronto, setPronto] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const regiao = useMemo(() => regiaoDosLocais(cidadeId, locais), [cidadeId, locais]);

  useEffect(() => {
    if (pronto) mapa.current?.animateToRegion(regiao, 400);
  }, [pronto, regiao]);

  useEffect(() => {
    if (carregado) return;
    const tempo = setTimeout(() => setFalhou(true), 15000);
    return () => clearTimeout(tempo);
  }, [carregado, tentativa]);

  return (
    <View style={styles.container}>
      <MapView
        key={tentativa}
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={regiao}
        onMapReady={() => { setPronto(true); if (Platform.OS === "ios") setCarregado(true); }}
        onMapLoaded={() => { setPronto(true); setCarregado(true); setFalhou(false); }}
        showsMyLocationButton={false}
        showsUserLocation={false}
        toolbarEnabled={false}
      >
        {locais.map((local) => (
          <Marker
            key={local.id}
            identifier={local.id}
            coordinate={{ latitude: local.latitude, longitude: local.longitude }}
            title={local.nome}
            description="Toque para ver o resumo"
            pinColor={local.id === selecionadoId ? colors.accentDark : colors.accent}
            onPress={() => selecionar(local.id)}
          />
        ))}
        {coordenadas ? (
          <Marker identifier="posicao-usuario" coordinate={coordenadas} title="Sua localização" pinColor={colors.userLocation} />
        ) : null}
      </MapView>
      {!carregado ? (
        <View style={styles.carregando} pointerEvents="box-none">
          {falhou ? (
            <View style={styles.aviso}>
              <Text>O mapa demorou para carregar. Você pode consultar os lugares abaixo.</Text>
              <Pressable accessibilityRole="button" style={styles.botao} onPress={() => {
                setPronto(false); setCarregado(false); setFalhou(false); setTentativa((valor) => valor + 1);
              }}><Text style={styles.rotulo}>Tentar carregar o mapa novamente</Text></Pressable>
            </View>
          ) : <ActivityIndicator accessibilityLabel="Carregando mapa" color={colors.accent} />}
        </View>
      ) : null}
      {coordenadas && pronto ? (
        <Pressable accessibilityRole="button" style={styles.posicao} onPress={() => mapa.current?.animateToRegion({
          ...coordenadas, latitudeDelta: 0.02, longitudeDelta: 0.02,
        }, 400)}><Text style={styles.rotulo}>Minha posição</Text></Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 390, marginHorizontal: 24, borderRadius: 26, overflow: "hidden", backgroundColor: colors.paper },
  carregando: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  aviso: { padding: 16, backgroundColor: colors.surface2, color: colors.text },
  botao: { minHeight: MIN_TOUCH, justifyContent: "center" },
  posicao: { position: "absolute", right: 12, bottom: 12, backgroundColor: colors.surface, padding: 12, minHeight: MIN_TOUCH, borderRadius: 10 },
  rotulo: { color: colors.accentDark, fontWeight: "600" },
});
