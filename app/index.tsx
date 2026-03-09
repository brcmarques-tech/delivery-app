import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useQuery } from '@apollo/client';
import { View, ActivityIndicator } from 'react-native';
import { GET_MY_ADDRESSES } from '../src/lib/graphql/queries';
import { colors } from '../src/theme';

export default function Index() {
  const { user, loading } = useAuth();
  const { data: addrData, loading: addrLoading } = useQuery(GET_MY_ADDRESSES, {
    skip: !user,
    fetchPolicy: 'network-only',
  });

  if (loading || (user && addrLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  const addresses = addrData?.myAddresses || [];
  if (addresses.length === 0) {
    return <Redirect href="/onboarding-address" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
