import { ExpoConfig, ConfigContext } from 'expo/config';
import appJson from './app.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  // KAN-222: sem fallback hardcoded — a chave nao pode ficar versionada no git.
  // Vem do .env em dev e de EAS secret nos builds de producao.
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return {
    ...appJson.expo,
    ...config,
    android: {
      ...appJson.expo.android,
      config: {
        ...appJson.expo.android.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins: [
      ...(appJson.expo.plugins || []),
      ['@sentry/react-native/expo', {
        organization: 'bcm-tech',
        project: 'shopping-app',
      }],
    ],
    // KAN-255: o app.json e importado como JSON, entao o TS infere tipos
    // literais estreitos (principalmente no array `plugins`, que vira uma uniao
    // de objetos especificos em vez da tupla `[string, any]` do ExpoConfig).
    // O conteudo ja esta no formato correto do Expo — e so a inferencia que nao
    // fecha — por isso o cast no objeto inteiro em vez de remendar campo a campo.
  } as unknown as ExpoConfig;
};
