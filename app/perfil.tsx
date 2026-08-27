import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlocoDocumento } from "@/components/perfil/BlocoDocumento";
import { CampoDocumento } from "@/components/perfil/CampoDocumento";
import { CarimboDiversidade } from "@/components/perfil/CarimboDiversidade";
import { LinhaFavoritos } from "@/components/perfil/LinhaFavoritos";
import { MolduraDocumento } from "@/components/perfil/MolduraDocumento";
import { PERFIL_FICTICIO } from "@/mocks/perfil";
import { MIN_TOUCH, colors, fonts, radius, spacing } from "@/theme/tokens";

export default function Perfil() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const perfil = PERFIL_FICTICIO;
  const carimbadas = perfil.carimbos.filter((c) => c.carimbadoEm !== null).length;

  return (
    <View style={styles.tela}>
      {/* A raiz do app usa barra clara; sobre creme os ícones sumiriam. */}
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.conteudo,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MolduraDocumento>
          <BlocoDocumento primeiro>
            <View style={styles.cabecalhoDocumento}>
              <Text style={styles.selo}>Passaporte cultural</Text>
              <Text style={styles.serie}>{perfil.numeroSerie}</Text>
            </View>

            <View style={styles.identidade}>
              <View style={styles.disco} accessible={false}>
                <Text style={styles.iniciais}>{perfil.iniciais}</Text>
              </View>
              <View style={styles.camposIdentidade}>
                <CampoDocumento rotulo="Nome" valor={perfil.nome} />
                <CampoDocumento rotulo="Origem" valor={perfil.origem} />
              </View>
            </View>

            <View style={styles.rodapeIdentidade}>
              <CampoDocumento rotulo="Explorando desde" valor={perfil.membroDesde} />
            </View>
          </BlocoDocumento>

          <BlocoDocumento titulo="Preferências">
            <View style={styles.preferencias}>
              {perfil.preferencias.map((preferencia) => (
                <View key={preferencia} style={styles.etiqueta}>
                  <Text style={styles.etiquetaTexto}>{preferencia}</Text>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar preferências e acessibilidade"
              // Leva ao questionário de interesses. Hoje é o stub da RAÍZES-02.
              onPress={() => router.push("/onboarding")}
              style={({ pressed }) => [styles.botaoEditar, pressed && styles.botaoEditarPressionado]}
            >
              <Text style={styles.botaoEditarTexto}>Editar preferências</Text>
            </Pressable>
          </BlocoDocumento>

          <BlocoDocumento titulo={`Carimbos · ${carimbadas} de ${perfil.carimbos.length}`}>
            <View style={styles.carimbos}>
              {perfil.carimbos.map((carimbo) => (
                <CarimboDiversidade key={carimbo.dimensao} {...carimbo} />
              ))}
            </View>
            <Text style={styles.legendaCarimbos}>
              Cada carimbo marca uma cultura que você conheceu de perto. Não é
              placar, e ninguém compara o seu com o de outra pessoa.
            </Text>
          </BlocoDocumento>

          <BlocoDocumento titulo="Favoritos">
            {perfil.favoritos.length > 0 ? (
              <View style={styles.favoritos}>
                {perfil.favoritos.map((grupo) => (
                  <LinhaFavoritos key={grupo.cidade} {...grupo} />
                ))}
              </View>
            ) : (
              <View style={styles.vazio}>
                <Text style={styles.vazioTitulo}>Nenhum lugar salvo ainda</Text>
                <Text style={styles.vazioTexto}>
                  Toque no coração de um lugar para guardá-lo aqui e montar sua
                  próxima saída.
                </Text>
              </View>
            )}
          </BlocoDocumento>
        </MolduraDocumento>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  conteudo: {
    paddingHorizontal: spacing.pageX,
  },
  cabecalhoDocumento: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  selo: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: colors.documentInk,
  },
  serie: {
    fontFamily: fonts.regular,
    fontSize: 10,
    letterSpacing: 1.1,
    color: colors.inkMuted,
  },
  identidade: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  disco: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.earth,
    alignItems: "center",
    justifyContent: "center",
  },
  iniciais: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    letterSpacing: 0.5,
    color: colors.surface,
  },
  camposIdentidade: {
    flex: 1,
    gap: 12,
  },
  rodapeIdentidade: {
    marginTop: 18,
  },
  preferencias: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  etiqueta: {
    borderWidth: 1,
    borderColor: colors.stampEmpty,
    borderRadius: radius.document,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  etiquetaTexto: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.documentInk,
  },
  botaoEditar: {
    marginTop: 18,
    minHeight: MIN_TOUCH,
    borderWidth: 1.5,
    borderColor: colors.documentInk,
    borderRadius: radius.document,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoEditarPressionado: {
    backgroundColor: "rgba(92, 61, 46, 0.07)",
  },
  botaoEditarTexto: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    letterSpacing: 0.3,
    color: colors.documentInk,
  },
  carimbos: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 22,
  },
  legendaCarimbos: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkMuted,
    marginTop: 20,
  },
  favoritos: {
    gap: 4,
  },
  vazio: {
    paddingVertical: 12,
    gap: 6,
  },
  vazioTitulo: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.documentInk,
  },
  vazioTexto: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
  },
});
