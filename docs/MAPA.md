# Aba Mapa — RAÍZES-21

A aba usa react-native-maps na versão selecionada por `expo install`. No Android o provedor é Google Maps; no iOS, Apple Maps. No navegador há uma lista navegável, sem importar o módulo nativo.

Os lugares seguem a cidade das preferências e a mesma consulta do Explorar, incluindo mocks quando o Supabase não está configurado. A posição autorizada vem de useLocalizacao(); não há nova solicitação automática de permissão. A lista e o resumo usam as distâncias em linha reta da RAÍZES-20.

## Configuração Android

1. Ative Maps SDK for Android no projeto Google Cloud.
2. Configure `GOOGLE_MAPS_ANDROID_API_KEY` em `.env.local` (ignorado pelo Git) ou no ambiente de build. Nunca coloque o valor em app.json ou em arquivos versionados.
3. Restrinja a chave ao pacote `br.edu.ulbra.raizes`, ao certificado SHA-1 do build e à API Maps SDK for Android.
4. Gere novamente o aplicativo nativo após configurar a chave: `npx expo run:android`. É necessário Android SDK, JDK compatível e aparelho/emulador.

`app.config.ts` injeta a chave no manifest pelo plugin de mapas. A tela consulta um booleano indicando a configuração. Sem chave, builds próprios Android mostram um aviso e preservam a lista. Expo Go usa sua configuração nativa. A chave estará no binário Android por exigência do SDK, por isso deve ter restrições no Google Cloud.

Referência: https://docs.expo.dev/versions/latest/sdk/map-view/

## Validação

Verificações automatizadas: `npm test`, `npm run typecheck`, `npm run lint` e `npx expo export --platform android`.

**Pendente:** executar o aplicativo em Android ou development build. A exportação JavaScript não compila o APK e não valida renderização, credenciais, mapas ou permissões no dispositivo. Não havia Android SDK, aparelho/emulador ou chave configurados no ambiente de implementação.

Roteiro para validar em dispositivo:

- Selecionar Salvador e Recife: marcadores e lista acompanham a cidade, sem manter o resumo anterior.
- Tocar em um marcador: resumo com nome, categoria, distância e apresentação. Abrir detalhes e voltar.
- Autorizar localização: posição azul e botão Minha posição. Negar autorização: lugares continuam acessíveis. Negação permanente oferece configurações.
- Desligar GPS e atualizar posição: aviso, sem bloquear o catálogo.
- Verificar carregamento e falta de conectividade. Se os tiles não carregarem em 15 segundos, a lista continua disponível e há nova tentativa.
- Simular erro da consulta: mensagem e botão Tentar novamente. Simular catálogo vazio: cidade e mensagem de ausência de lugares.
- Conferir leitura e acesso ao resumo/detalhe pela lista com TalkBack.

A issue não deve ser considerada totalmente validada antes dessa etapa.
