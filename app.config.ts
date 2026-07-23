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
  };
};
