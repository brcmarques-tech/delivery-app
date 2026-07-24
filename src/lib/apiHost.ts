import { Platform } from 'react-native';

// KAN-255: fonte unica do host da API.
//
// Antes a montagem da URL estava duplicada em tres lugares (apollo.ts,
// useDeliveryTracking.ts e (tabs)/deliveries.tsx) e dois deles ignoravam a env
// `EXPO_PUBLIC_API_HOST`, com o IP de LAN `192.168.0.143` hardcoded — que ja
// nem existia mais na rede (o .env aponta outro). Resultado: em dev o
// rastreamento de entrega conectava no IP errado e falhava em silencio, so no
// fluxo do entregador. Tambem violava a regra "nunca commitar overrides de
// URL" do CLAUDE.md.
//
// Fallback e `localhost` (e nao um IP especifico de maquina) de proposito:
// quem roda no emulador/web funciona, e quem usa device fisico define a env.

const LAN_HOST = process.env.EXPO_PUBLIC_API_HOST || 'localhost';

export const API_HOST = Platform.OS === 'web' ? 'localhost' : LAN_HOST;

const PROD_HTTP = 'https://api.bcmtech.com.br';
const PROD_WS = 'wss://api.bcmtech.com.br';

/** Base HTTP da API (GraphQL, REST). */
export const httpBaseUrl = (): string =>
  __DEV__ ? `http://${API_HOST}:3000` : PROD_HTTP;

/** Base WebSocket para o Apollo (graphql-ws). */
export const wsBaseUrl = (): string =>
  __DEV__ ? `ws://${API_HOST}:3000` : PROD_WS;

/**
 * Base para socket.io. Atencao: socket.io usa esquema http/https (ele mesmo
 * faz o upgrade para WebSocket), NAO ws://.
 */
export const socketBaseUrl = (): string =>
  __DEV__ ? `http://${API_HOST}:3000` : PROD_HTTP;
