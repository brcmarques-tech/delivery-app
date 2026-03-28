import { ExpoConfig, ConfigContext } from 'expo/config';
import appJson from './app.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDGljwvMZdnnPAJNKar0ipOEpWKykD9s28';

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
