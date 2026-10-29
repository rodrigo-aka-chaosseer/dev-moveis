import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, type ComponentProps, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { Botao } from "../../src/components/visual/Guia";
import { usePreferencias } from "../../src/preferencias/PreferenciasProvider";
import {
  CIDADES,
  INTERESSES,
  type CidadeId,
  type InteresseId,
} from "../../src/preferencias/dados";
import {
  formularioRoteiroValido,
  OPCOES_ACESSIBILIDADE,
  OPCOES_ORCAMENTO,
  OPCOES_RITMO,
  OPCOES_TEMPO,
  type FormularioRoteiro,
} from "../../src/roteiros/formulario";
import type {
  NecessidadeAcessibilidade,
  Ritmo,
} from "../../src/roteiros/ia/gerarRoteiroIa";
import { colors, fonts, MIN_TOUCH, radius, spacing } from "../../src/theme/tokens";

type Icone = ComponentProps<typeof Ionicons>["name"];

const VAZIO: FormularioRoteiro = {
  cidadeId: null,
  interesses: [],
  tempoDisponivelMin: 240,
  orcamentoCentavos: null,
  ritmo: "moderado",
  acessibilidade: [],
};

export default function CriarRoteiro() {
  const insets = useSafeAreaInsets();
  const preferencias = usePreferencias();

  if (!preferencias.pronto) {
    return (
      <View style={[s.tela, s.carregando, { paddingTop: insets.top + 24 }]}>
        <StatusBar style="dark" />
        <Text accessibilityLiveRegion="polite" style={s.ajuda}>
          Carregando suas preferências…
        </Text>
      </View>
    );
  }

  return (
    <FormularioRoteiroTela
      cidadeInicial={preferencias.cidadeId}
      interessesIniciais={preferencias.interesses}
    />
  );
}

function FormularioRoteiroTela({
  cidadeInicial,
  interessesIniciais,
}: {
  cidadeInicial: CidadeId | null;
  interessesIniciais: InteresseId[];
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [formulario, setFormulario] = useState<FormularioRoteiro>(() => ({
    ...VAZIO,
    cidadeId: cidadeInicial,
    interesses: [...interessesIniciais],
  }));
  const [enviado, setEnviado] = useState(false);
  const valido = formularioRoteiroValido(formulario);

  function atualizar<K extends keyof FormularioRoteiro>(
    campo: K,
    valor: FormularioRoteiro[K],
  ) {
    setEnviado(false);
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function alternarInteresse(id: InteresseId) {
    const interesses = formulario.interesses.includes(id)
      ? formulario.interesses.filter((item) => item !== id)
      : [...formulario.interesses, id];
    atualizar("interesses", interesses);
  }

  function alternarAcessibilidade(id: NecessidadeAcessibilidade) {
    const acessibilidade = formulario.acessibilidade.includes(id)
      ? formulario.acessibilidade.filter((item) => item !== id)
      : [...formulario.acessibilidade, id];
    atualizar("acessibilidade", acessibilidade);
  }

  return (
    <View style={s.tela}>
      <StatusBar style="dark" />
      <View style={[s.topo, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para Roteiros"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [s.voltar, pressed && s.pressionado]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={s.topoTexto}>
          <Text style={s.legenda}>ROTEIRO PERSONALIZADO</Text>
          <Text accessibilityRole="header" style={s.titulo}>Crie seu passeio com IA</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.conteudo, { paddingBottom: insets.bottom + 32 }]}
      >
        <Text style={s.introducao}>
          Conte como você quer explorar a cidade. Suas escolhas do início já aparecem aqui e podem ser ajustadas só para este roteiro.
        </Text>

        <>
            <Secao titulo="Cidade" descricao="Escolha onde será o passeio." obrigatorio icone="location-outline">
              <View style={s.opcoesLinha}>
                {CIDADES.map((cidade) => (
                  <Opcao
                    key={cidade.id}
                    selecionada={formulario.cidadeId === cidade.id}
                    rotulo={`${cidade.nome}, ${cidade.uf}`}
                    onPress={() => atualizar("cidadeId", cidade.id as CidadeId)}
                  />
                ))}
              </View>
            </Secao>

            <Secao titulo="Interesses culturais" descricao="Selecione pelo menos um." obrigatorio icone="sparkles-outline">
              <View style={s.opcoesLinha}>
                {INTERESSES.map((interesse) => (
                  <Opcao
                    key={interesse.id}
                    selecionada={formulario.interesses.includes(interesse.id)}
                    rotulo={`${interesse.icone}  ${interesse.nome}`}
                    onPress={() => alternarInteresse(interesse.id)}
                  />
                ))}
              </View>
            </Secao>

            <Secao titulo="Tempo disponível" descricao="Quanto tempo você tem para o passeio?" icone="time-outline">
              <View style={s.opcoesLinha}>
                {OPCOES_TEMPO.map((opcao) => (
                  <Opcao
                    key={opcao.minutos}
                    selecionada={formulario.tempoDisponivelMin === opcao.minutos}
                    rotulo={opcao.rotulo}
                    onPress={() => atualizar("tempoDisponivelMin", opcao.minutos)}
                  />
                ))}
              </View>
            </Secao>

            <Secao titulo="Orçamento" descricao="Defina o teto para entradas e atividades." icone="wallet-outline">
              <View style={s.opcoesLinha}>
                {OPCOES_ORCAMENTO.map((opcao) => (
                  <Opcao
                    key={opcao.rotulo}
                    selecionada={formulario.orcamentoCentavos === opcao.centavos}
                    rotulo={opcao.rotulo}
                    onPress={() => atualizar("orcamentoCentavos", opcao.centavos)}
                  />
                ))}
              </View>
            </Secao>

            <Secao titulo="Ritmo do passeio" descricao="Escolha como prefere distribuir as paradas." icone="walk-outline">
              <View style={s.coluna}>
                {OPCOES_RITMO.map((opcao) => (
                  <OpcaoDetalhada
                    key={opcao.id}
                    selecionada={formulario.ritmo === opcao.id}
                    rotulo={opcao.rotulo}
                    descricao={opcao.descricao}
                    onPress={() => atualizar("ritmo", opcao.id as Ritmo)}
                  />
                ))}
              </View>
            </Secao>

            <Secao titulo="Acessibilidade" descricao="Opcional. Marque tudo o que precisa ser considerado." icone="accessibility-outline">
              <View style={s.opcoesLinha}>
                {OPCOES_ACESSIBILIDADE.map((opcao) => (
                  <Opcao
                    key={opcao.id}
                    selecionada={formulario.acessibilidade.includes(opcao.id)}
                    rotulo={opcao.rotulo}
                    onPress={() => alternarAcessibilidade(opcao.id)}
                  />
                ))}
              </View>
              {formulario.acessibilidade.length === 0 ? (
                <Text style={s.ajuda}>Nenhuma necessidade selecionada.</Text>
              ) : null}
            </Secao>

            {!valido ? (
              <Text accessibilityLiveRegion="polite" style={s.aviso}>
                Escolha uma cidade e pelo menos um interesse para continuar.
              </Text>
            ) : null}

            <Botao
              texto="Gerar meu roteiro"
              disabled={!valido}
              onPress={() => setEnviado(true)}
            />

            {enviado ? (
              <View accessibilityLiveRegion="polite" style={s.sucesso}>
                <Ionicons name="checkmark-circle" size={22} color={colors.accentDark} />
                <Text style={s.sucessoTexto}>
                  Pedido pronto! A geração com IA será conectada na próxima etapa.
                </Text>
              </View>
            ) : null}
        </>
      </ScrollView>
    </View>
  );
}

function Secao({
  titulo,
  descricao,
  obrigatorio = false,
  icone,
  children,
}: {
  titulo: string;
  descricao: string;
  obrigatorio?: boolean;
  icone: Icone;
  children: ReactNode;
}) {
  return (
    <View style={s.secao}>
      <View style={s.secaoTituloLinha}>
        <View accessible={false} style={s.icone}>
          <Ionicons name={icone} size={20} color={colors.accentDark} />
        </View>
        <View style={s.secaoTituloTexto}>
          <Text accessibilityRole="header" style={s.secaoTitulo}>
            {titulo}{obrigatorio ? <Text style={s.obrigatorio}> *</Text> : null}
          </Text>
          <Text style={s.ajuda}>{descricao}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function Opcao({
  selecionada,
  rotulo,
  onPress,
}: {
  selecionada: boolean;
  rotulo: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selecionada }}
      onPress={onPress}
      style={({ pressed }) => [
        s.opcao,
        selecionada && s.opcaoSelecionada,
        pressed && s.pressionado,
      ]}
    >
      <Text style={[s.opcaoTexto, selecionada && s.opcaoTextoSelecionado]}>{rotulo}</Text>
      {selecionada ? <Ionicons name="checkmark" size={16} color={colors.onDark} /> : null}
    </Pressable>
  );
}

function OpcaoDetalhada({
  selecionada,
  rotulo,
  descricao,
  onPress,
}: {
  selecionada: boolean;
  rotulo: string;
  descricao: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selecionada }}
      onPress={onPress}
      style={({ pressed }) => [
        s.opcaoDetalhada,
        selecionada && s.opcaoDetalhadaSelecionada,
        pressed && s.pressionado,
      ]}
    >
      <View style={[s.radio, selecionada && s.radioSelecionado]}>
        {selecionada ? <View style={s.radioCentro} /> : null}
      </View>
      <View style={s.opcaoDetalhadaTexto}>
        <Text style={s.opcaoDetalhadaTitulo}>{rotulo}</Text>
        <Text style={s.ajuda}>{descricao}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.surface2 },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.pageX,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface3,
  },
  voltar: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  topoTexto: { flex: 1, gap: 3 },
  legenda: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.5, color: colors.accentDark },
  titulo: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.text },
  conteudo: { padding: spacing.pageX, gap: 18 },
  introducao: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textMuted },
  carregando: { minHeight: 160, alignItems: "center", justifyContent: "center" },
  secao: { padding: 18, gap: 15, borderRadius: radius.card, backgroundColor: colors.surface },
  secaoTituloLinha: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  icone: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentTint },
  secaoTituloTexto: { flex: 1, gap: 3 },
  secaoTitulo: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23, color: colors.text },
  obrigatorio: { color: colors.accentDark },
  ajuda: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textMuted },
  opcoesLinha: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  coluna: { gap: 9 },
  opcao: {
    minHeight: MIN_TOUCH,
    maxWidth: "100%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.surface2,
  },
  opcaoSelecionada: { borderColor: colors.earth, backgroundColor: colors.earth },
  opcaoTexto: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 12, color: colors.text },
  opcaoTextoSelecionado: { color: colors.onDark },
  pressionado: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  opcaoDetalhada: {
    minHeight: 64,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: radius.input,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.surface2,
  },
  opcaoDetalhadaSelecionada: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.textMuted, alignItems: "center", justifyContent: "center" },
  radioSelecionado: { borderColor: colors.accent },
  radioCentro: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  opcaoDetalhadaTexto: { flex: 1, gap: 2 },
  opcaoDetalhadaTitulo: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  aviso: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, textAlign: "center", color: colors.error },
  sucesso: { padding: 16, borderRadius: radius.input, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.accentTint },
  sucessoTexto: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 20, color: colors.accentDark },
});
