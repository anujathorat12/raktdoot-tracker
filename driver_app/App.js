import React, { useState, useEffect, Component } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DEFAULT_SERVER_URL } from './src/config/constants';
import { getStoredAuth, getStoredServerUrl, clearAuth } from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';
import DriverDashboardScreen from './src/screens/DriverDashboardScreen';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = async () => {
    await clearAuth();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={this.handleReset}>
            <Text style={styles.retryText}>Reload & Return to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

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
        <ActivityIndicator size="large" color="#b91c1c" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0b10',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#b91c1c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});
