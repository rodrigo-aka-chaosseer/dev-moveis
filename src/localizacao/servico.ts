import * as Location from "expo-location";

const TEMPO_LIMITE_MS = 15_000;

export type CoordenadasUsuario = {
  latitude: number;
  longitude: number;
  precisaoMetros: number | null;
  obtidaEm: number;
};

export type ResultadoLocalizacao =
  | { tipo: "sucesso"; coordenadas: CoordenadasUsuario }
  | { tipo: "permissao_negada"; podePerguntarNovamente: boolean }
  | { tipo: "servico_desativado" }
  | { tipo: "erro" };

function comTempoLimite<T>(promessa: Promise<T>, tempoMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(
      () => reject(new Error("Tempo limite ao obter localização.")),
      tempoMs,
    );

    promessa.then(resolve, reject).finally(() => clearTimeout(temporizador));
  });
}

/**
 * Solicita apenas localização em primeiro plano. A tarefa não precisa de
 * rastreamento contínuo nem de permissão em segundo plano.
 */
export async function solicitarLocalizacaoAtual(): Promise<ResultadoLocalizacao> {
  try {
    const permissao = await Location.requestForegroundPermissionsAsync();

    if (permissao.status !== Location.PermissionStatus.GRANTED) {
      return {
        tipo: "permissao_negada",
        podePerguntarNovamente: permissao.canAskAgain,
      };
    }

    const servicoAtivo = await Location.hasServicesEnabledAsync();
    if (!servicoAtivo) {
      return { tipo: "servico_desativado" };
    }

    const posicao = await comTempoLimite(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      TEMPO_LIMITE_MS,
    );

    return {
      tipo: "sucesso",
      coordenadas: {
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
        precisaoMetros: posicao.coords.accuracy,
        obtidaEm: posicao.timestamp,
      },
    };
  } catch {
    return { tipo: "erro" };
  }
}
