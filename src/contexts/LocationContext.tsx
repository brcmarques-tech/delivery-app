import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  location: null,
  loading: false,
  error: null,
  refresh: async () => {},
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestedRef = useRef(false);

  async function getLocation() {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissao de localizacao negada');
        setLoading(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      });

      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao obter localizacao');
    } finally {
      setLoading(false);
    }
  }

  // Only request location after user is logged in
  useEffect(() => {
    if (user && !requestedRef.current) {
      requestedRef.current = true;
      getLocation();
    }
    if (!user) {
      requestedRef.current = false;
      setLocation(null);
    }
  }, [user]);

  return (
    <LocationContext.Provider value={{ location, loading, error, refresh: getLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
