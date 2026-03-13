import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useQuery } from '@apollo/client';
import { View, ActivityIndicator } from 'react-native';
import { GET_MY_ADDRESSES } from '../src/lib/graphql/queries';
import { colors } from '../src/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  const { data: addrData, loading: addrLoading, error: addrError } = useQuery(GET_MY_ADDRESSES, {
    skip: !user,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    AsyncStorage.getItem('onboardingDone').then((val) => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  if (loading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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
