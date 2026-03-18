import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useQuery } from '@apollo/client';
import { GET_MY_ADDRESSES } from '../src/lib/graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import { SplashLoading } from '../src/components/SplashLoading';

export default function Index() {
  const { user, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [splashHidden, setSplashHidden] = useState(false);

  const { data: addrData, loading: addrLoading, error: addrError } = useQuery(GET_MY_ADDRESSES, {
    skip: !user,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    AsyncStorage.getItem('onboardingDone').then((val) => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  // Hide native splash as soon as our custom splash renders
  const onSplashReady = useCallback(() => {
    if (!splashHidden) {
      setSplashHidden(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [splashHidden]);

  if (loading || onboardingDone === null) {
    return <SplashLoading onReady={onSplashReady} />;
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  // Termos de uso obrigatorios
  if (!user.acceptedTermsAt) {
    return <Redirect href="/accept-terms" />;
  }

  // If query errored (e.g. token not ready yet) or still loading, go to home
  if (addrError || addrLoading) {
    return <Redirect href="/(tabs)/home" />;
  }

  const addresses = addrData?.myAddresses || [];
  if (addresses.length === 0 && !onboardingDone) {
    return <Redirect href="/onboarding-address" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
