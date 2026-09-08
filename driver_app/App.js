import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DEFAULT_SERVER_URL } from './src/config/constants';
import { getStoredAuth, getStoredServerUrl, clearAuth } from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';
import DriverDashboardScreen from './src/screens/DriverDashboardScreen';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);

  useEffect(() => {
    (async () => {
      try {
        const [savedAuth, savedUrl] = await Promise.all([
          getStoredAuth(),
          getStoredServerUrl(DEFAULT_SERVER_URL),
        ]);
        if (savedUrl) setServerUrl(savedUrl);
        if (savedAuth?.token && savedAuth?.user) {
          setAuth(savedAuth);
        }
      } catch (err) {
        console.warn('Failed to restore auth session:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLoginSuccess = (authData, chosenServerUrl) => {
    setAuth(authData);
    setServerUrl(chosenServerUrl);
  };

  const handleLogout = async () => {
    await clearAuth();
    setAuth(null);
  };

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#6366f1" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {auth ? (
        <DriverDashboardScreen
          user={auth.user}
          token={auth.token}
          serverUrl={serverUrl}
          onLogout={handleLogout}
        />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  splash: {
    flex: 1,
    backgroundColor: '#0a0b10',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
