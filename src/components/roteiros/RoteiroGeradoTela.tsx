import { useState, type ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";

import type { LocalDetalhe } from "../../locais/listarLocais";
import { rotuloCategoria } from "../../locais/listarLocais";
import { nomeCidade } from "../../preferencias/dados";
import { rotuloDuracao } from "../../roteiros/calculos";
import { OPCOES_ACESSIBILIDADE } from "../../roteiros/formulario";
import type { NecessidadeAcessibilidade } from "../../roteiros/ia/gerarRoteiroIa";
import type { PreferenciasRecomendacao } from "../../roteiros/ia/prepararCandidatos";
import { opcoesDeTroca, type ParadaGerada, type RoteiroGerado } from "../../roteiros/ia/roteiroGerado";
import type { MotivoGeracao } from "../../roteiros/ia/useGeracaoRoteiro";
import { colors, fonts, MIN_TOUCH } from "../../theme/tokens";
import { Botao, Estado, v } from "../visual/Guia";
import { FotoParada } from "./FotoParada";
import { NumerosRoteiro } from "./NumerosRoteiro";

const TITULO_GERANDO: Record<MotivoGeracao, string> = {
  primeira: "Montando seu roteiro…",
  outra: "Buscando outra sugestão…",
  mais_curto: "Encurtando o roteiro…",
  mais_economico: "Procurando um roteiro mais barato…",
  acessibilidade: "Priorizando acessibilidade…",
};

export function GerandoRoteiro({
  motivo,
  cidadeId,
  demonstracao,
}: {
  motivo: MotivoGeracao;
  cidadeId: PreferenciasRecomendacao["cidadeId"] | null;
  demonstracao: boolean;
}) {
  const cidade = nomeCidade(cidadeId)?.split(",")[0];
  return (
    <View style={{ gap: 12 }}>
      <Estado
        carregando
        titulo={TITULO_GERANDO[motivo]}
        descricao={demonstracao
          ? `O modo de demonstração escolhe entre os lugares curados${cidade ? ` de ${cidade}` : ""} sem chamar um modelo de IA.`
          : `A IA escolhe entre os lugares curados${cidade ? ` de ${cidade}` : ""} e explica cada parada. Pode levar até meio minuto.`}
      />
      <View style={s.selo} accessibilityElementsHidden>
        <Ionicons name={demonstracao ? "flask-outline" : "sparkles-outline"} size={14} color={colors.accentDark} />
        <Text style={s.seloTexto}>{demonstracao ? "Modo demonstração local" : "Sugestão gerada por IA"}</Text>
      </View>
    </View>
  );
}

export function ErroGeracao({
  mensagem,
  onTentarDeNovo,
  onEditar,
}: {
  mensagem: string;
  onTentarDeNovo: () => void;
  onEditar: () => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Estado titulo="Não conseguimos gerar o roteiro" descricao={mensagem} icone="cloud-offline-outline" />
      <Botao texto="Tentar novamente" onPress={onTentarDeNovo} />
      <Botao texto="Editar preferências" onPress={onEditar} secundario />
    </View>
  );
}

export function ResultadoRoteiro({
  roteiro,
  preferencias,
  candidatos,
  aviso,
  podeEncurtar,
  podeEconomizar,
  onRemover,
  onTrocar,
  onMaisCurto,
  onMaisEconomico,
  onAcessibilidade,
  onOutraSugestao,
  onEditar,
}: {
  roteiro: RoteiroGerado;
  preferencias: PreferenciasRecomendacao;
  candidatos: LocalDetalhe[];
  aviso: string | null;
  podeEncurtar: boolean;
  podeEconomizar: boolean;
  onRemover: (localId: string) => void;
  onTrocar: (localId: string, novo: LocalDetalhe) => void;
  onMaisCurto: () => void;
  onMaisEconomico: () => void;
  onAcessibilidade: (necessidade: NecessidadeAcessibilidade) => void;
  onOutraSugestao: () => void;
  onEditar: () => void;
}) {
  const router = useRouter();
  const [trocando, setTrocando] = useState<string | null>(null);
  const [escolhendoAcessibilidade, setEscolhendoAcessibilidade] = useState(false);
  const ultima = roteiro.paradas.length === 1;
  const pedidas = preferencias.acessibilidade ?? [];

  return (
    <View style={{ gap: 18 }}>
      <View style={s.selos}>
        <View style={s.selo}>
          <Ionicons name={roteiro.origem === "ia" ? "sparkles-outline" : "flask-outline"} size={14} color={colors.accentDark} />
          <Text style={s.seloTexto}>
            {roteiro.origem === "ia" ? "Sugestão gerada por IA" : "Modo demonstração local"}
          </Text>
        </View>
        {roteiro.ajustado ? (
          <View style={[s.selo, { backgroundColor: colors.paper }]}>
            <Ionicons name="create-outline" size={14} color={colors.earth} />
            <Text style={[s.seloTexto, { color: colors.earth }]}>Ajustado por você</Text>
          </View>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={v.legenda}>{nomeCidade(preferencias.cidadeId)}</Text>
        <Text accessibilityRole="header" style={s.titulo}>{roteiro.titulo}</Text>
        <Text style={v.descricao}>{roteiro.descricao}</Text>
      </View>

      <NumerosRoteiro roteiro={roteiro} paradas={roteiro.paradas.length} fundo={colors.surface} />
      <Text style={[v.descricao, { fontSize: 11, marginTop: -8 }]}>
        Valores estimados: distância em linha reta e caminhada a pé entre as paradas.
      </Text>

      {roteiro.avisos.length ? (
        <View style={s.avisos} accessibilityRole="summary">
          {roteiro.avisos.map((texto) => (
            <View key={texto} style={s.avisoLinha}>
              <Ionicons name="information-circle-outline" size={18} color={colors.accentDark} />
              <Text style={[v.descricao, { flex: 1, color: colors.earth }]}>{texto}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {aviso ? <Text accessibilityLiveRegion="assertive" style={v.erro}>{aviso}</Text> : null}

      <View>
        {roteiro.paradas.map((parada, indice) => (
          <CartaoParada
            key={parada.local.id}
            parada={parada}
            numero={indice + 1}
            final={indice === roteiro.paradas.length - 1}
            ultimaRestante={ultima}
            trocando={trocando === parada.local.id}
            opcoesTroca={trocando === parada.local.id ? opcoesDeTroca(roteiro, parada.local.id, candidatos) : []}
            onAbrir={() => router.push(`/local/${parada.local.id}` as Href)}
            onRemover={() => onRemover(parada.local.id)}
            onAlternarTroca={() => setTrocando((atual) => (atual === parada.local.id ? null : parada.local.id))}
            onEscolherTroca={(novo) => {
              setTrocando(null);
              onTrocar(parada.local.id, novo);
            }}
          />
        ))}
      </View>

      <View style={v.bloco}>
        <Text style={v.secaoTitulo}>Ajustar o roteiro</Text>
        <Text style={v.descricao}>
          Cidade, interesses e as outras escolhas continuam as mesmas. Cada ajuste monta uma nova sugestão {roteiro.origem === "ia" ? "com a IA" : "localmente"}.
        </Text>
        <Ajuste icone="time-outline" texto="Mais curto" ajuda={podeEncurtar ? undefined : "Já está no tempo mínimo de 1 hora."} onPress={onMaisCurto} disabled={!podeEncurtar} />
        <Ajuste icone="wallet-outline" texto="Mais econômico" ajuda={podeEconomizar ? undefined : "Este roteiro já é gratuito."} onPress={onMaisEconomico} disabled={!podeEconomizar} />
        <Ajuste
          icone="accessibility-outline"
          texto="Priorizar acessibilidade"
          onPress={() => setEscolhendoAcessibilidade((aberto) => !aberto)}
          aberto={escolhendoAcessibilidade}
        />
        {escolhendoAcessibilidade ? (
          <View style={s.subopcoes}>
            {OPCOES_ACESSIBILIDADE.map((opcao) => {
              const jaPedida = pedidas.includes(opcao.id);
              return (
                <Pressable
                  key={opcao.id}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: jaPedida, selected: jaPedida }}
                  disabled={jaPedida}
                  onPress={() => onAcessibilidade(opcao.id)}
                  style={({ pressed }) => [s.subopcao, jaPedida && s.subopcaoAtiva, pressed && { opacity: 0.7 }]}
                >
                  {jaPedida ? <Ionicons name="checkmark" size={14} color={colors.onDark} /> : null}
                  <Text style={[v.etiquetaTexto, jaPedida && { color: colors.onDark }]}>{opcao.rotulo}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Ajuste icone="refresh-outline" texto="Gerar outra sugestão" onPress={onOutraSugestao} />
      </View>

      <Botao texto="Editar preferências" onPress={onEditar} secundario />
      <Text style={[v.descricao, { fontSize: 11, textAlign: "center" }]}>
        Este roteiro ainda não é salvo: ao sair desta tela, ele se perde.
      </Text>
    </View>
  );
}

function CartaoParada({
  parada,
  numero,
  final,
  ultimaRestante,
  trocando,
  opcoesTroca,
  onAbrir,
  onRemover,
  onAlternarTroca,
  onEscolherTroca,
}: {
  parada: ParadaGerada;
  numero: number;
  final: boolean;
  ultimaRestante: boolean;
  trocando: boolean;
  opcoesTroca: LocalDetalhe[];
  onAbrir: () => void;
  onRemover: () => void;
  onAlternarTroca: () => void;
  onEscolherTroca: (novo: LocalDetalhe) => void;
}) {
  const { local } = parada;
  return (
    <View style={s.parada}>
      <View style={s.trilho}>
        <View style={s.ponto}><Text style={s.numero}>{numero}</Text></View>
        {!final ? <View style={s.linha} /> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 8, paddingBottom: final ? 0 : 18 }}>
        <Text style={s.hora}>{parada.horaSugerida} · {rotuloDuracao(parada.duracaoMin)}</Text>
        <View style={s.cartao}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Parada ${numero}: ${local.nome}. Abrir o lugar`}
            onPress={onAbrir}
            style={({ pressed }) => [s.cabecaCartao, pressed && { opacity: 0.8 }]}
          >
            <FotoParada local={local} />
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={s.nome} numberOfLines={2}>{local.nome}</Text>
              <Text style={s.categoria}>{rotuloCategoria(local.categoria)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.accentDark} />
          </Pressable>

          <View style={{ gap: 4 }}>
            <Text style={s.rotuloMotivo}>
              {parada.origem === "ia"
                ? "Por que a IA sugeriu"
                : parada.origem === "demonstracao"
                  ? "Por que foi sugerido"
                  : "Por que conhecer"}
            </Text>
            <Text style={[v.descricao, { color: colors.earth }]}>{parada.motivo}</Text>
          </View>

          {parada.acessibilidadeNaoConfirmada ? (
            <View style={s.alerta}>
              <Ionicons name="accessibility-outline" size={15} color={colors.accentDark} />
              <Text style={s.alertaTexto}>Acessibilidade não confirmada neste lugar.</Text>
            </View>
          ) : null}
          {local.avisoVisitacao ? (
            <View style={s.alerta}>
              <Ionicons name="hand-left-outline" size={15} color={colors.accentDark} />
              <Text style={s.alertaTexto}>{local.avisoVisitacao}</Text>
            </View>
          ) : null}

          <View style={s.acoes}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: trocando }} onPress={onAlternarTroca} style={s.acao}>
              <Ionicons name="swap-horizontal-outline" size={16} color={colors.accentDark} />
              <Text style={v.link}>{trocando ? "Cancelar troca" : "Trocar"}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: ultimaRestante }}
              accessibilityHint={ultimaRestante ? "O roteiro precisa de pelo menos uma parada." : undefined}
              disabled={ultimaRestante}
              onPress={onRemover}
              style={[s.acao, ultimaRestante && { opacity: 0.4 }]}
            >
              <Ionicons name="trash-outline" size={16} color={colors.accentDark} />
              <Text style={v.link}>Remover</Text>
            </Pressable>
          </View>

          {trocando ? (
            <View style={{ gap: 8 }}>
              {opcoesTroca.length === 0 ? (
                <Text style={v.descricao}>Não há outros lugares do catálogo que combinem com o seu pedido.</Text>
              ) : (
                opcoesTroca.map((opcao) => (
                  <Pressable
                    key={opcao.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Trocar por ${opcao.nome}`}
                    onPress={() => onEscolherTroca(opcao)}
                    style={({ pressed }) => [s.opcaoTroca, pressed && { opacity: 0.75 }]}
                  >
                    <FotoParada local={opcao} tamanho={40} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.nomeTroca} numberOfLines={1}>{opcao.nome}</Text>
                      <Text style={[v.descricao, { fontSize: 11 }]}>{rotuloCategoria(opcao.categoria)} · ~{opcao.tempoMedioMin} min</Text>
                    </View>
                    <Text style={v.link}>Usar</Text>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}

          {ultimaRestante ? <Text style={[v.descricao, { fontSize: 11 }]}>Esta é a última parada: troque em vez de remover.</Text> : null}
        </View>
      </View>
    </View>
  );
}

function Ajuste({
  icone,
  texto,
  ajuda,
  onPress,
  disabled = false,
  aberto,
}: {
  icone: ComponentProps<typeof Ionicons>["name"];
  texto: string;
  ajuda?: string;
  onPress: () => void;
  disabled?: boolean;
  aberto?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, expanded: aberto }}
      accessibilityHint={ajuda}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.ajuste, disabled && { opacity: 0.45 }, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icone} size={20} color={colors.accentDark} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.ajusteTexto}>{texto}</Text>
        {ajuda ? <Text style={[v.descricao, { fontSize: 11 }]}>{ajuda}</Text> : null}
      </View>
      <Ionicons name={aberto ? "chevron-up" : "chevron-forward"} size={18} color={colors.accentDark} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  selos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selo: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.accentTint },
  seloTexto: { fontFamily: fonts.semibold, fontSize: 11, color: colors.accentDark },
  titulo: { fontFamily: fonts.extrabold, color: colors.text, fontSize: 28, letterSpacing: -1, lineHeight: 34 },
  avisos: { gap: 8, padding: 16, borderRadius: 20, backgroundColor: colors.paper },
  avisoLinha: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  parada: { flexDirection: "row", gap: 12 },
  trilho: { width: 26, alignItems: "center" },
  ponto: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  numero: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.onDark },
  linha: { flex: 1, width: 2, marginVertical: 3, backgroundColor: colors.accentTint },
  hora: { fontFamily: fonts.semibold, fontSize: 12, color: colors.accentDark, fontVariant: ["tabular-nums"], marginTop: 4 },
  cartao: { gap: 12, padding: 14, borderRadius: 20, backgroundColor: colors.surface },
  cabecaCartao: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: MIN_TOUCH },
  nome: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  categoria: { fontFamily: fonts.semibold, fontSize: 11, color: colors.accentDark },
  rotuloMotivo: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: colors.textMuted },
  alerta: { flexDirection: "row", gap: 6, alignItems: "flex-start", padding: 10, borderRadius: 12, backgroundColor: colors.accentSoft },
  alertaTexto: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.earth },
  acoes: { flexDirection: "row", gap: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surface3, paddingTop: 4 },
  acao: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: MIN_TOUCH },
  opcaoTroca: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, minHeight: MIN_TOUCH, borderRadius: 14, backgroundColor: colors.surface2 },
  nomeTroca: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  ajuste: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.surface2 },
  ajusteTexto: { fontFamily: fonts.semibold, fontSize: 14, color: colors.earth },
  subopcoes: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingLeft: 4 },
  subopcao: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: MIN_TOUCH, paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.surface3 },
  subopcaoAtiva: { backgroundColor: colors.earth, borderColor: colors.earth },
});
