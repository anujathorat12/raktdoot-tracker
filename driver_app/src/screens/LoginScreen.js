import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { DEFAULT_SERVER_URL, PRESET_SERVER_URLS, DEMO_CREDENTIALS } from '../config/constants';
import { loginDriver, storeAuth, storeServerUrl, getStoredServerUrl } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [loading, setLoading] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);

  useEffect(() => {
    getStoredServerUrl(DEFAULT_SERVER_URL).then(url => {
      if (url) setServerUrl(url);
    });
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await storeServerUrl(serverUrl);
      const authData = await loginDriver(serverUrl, email.trim(), password);

      if (authData.user?.role !== 'driver') {
        throw new Error('Access denied. This app is strictly for delivery drivers.');
      }

      await storeAuth(authData);
      onLoginSuccess(authData, serverUrl);
    } catch (err) {
      Alert.alert(
        'Login Failed',
        `${err.message}\n\nMake sure the backend server is running and your Server URL is reachable.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 36 }}>🚚</Text>
          </View>
          <Text style={styles.brandTitle}>Raktdoot Driver</Text>
          <Text style={styles.brandSubtitle}>Real-Time Fleet & Dispatch Portal</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver Sign In</Text>

          {/* Email */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. driver1@delivery.com"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Server Config Toggle */}
          <TouchableOpacity
            style={styles.serverToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <Text style={styles.serverToggleText}>
              ⚙️ Server URL: <Text style={{ color: '#818cf8' }}>{serverUrl}</Text>
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.serverConfigBox}>
              <Text style={styles.serverConfigTitle}>API Server Endpoint</Text>
              <TextInput
                style={styles.serverInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                placeholder="http://10.0.2.2:5000"
                placeholderTextColor="#64748b"
              />
              <View style={styles.presetRow}>
                {PRESET_SERVER_URLS.map(preset => (
                  <TouchableOpacity
                    key={preset.url}
                    style={[styles.presetBtn, serverUrl === preset.url && styles.presetBtnActive]}
                    onPress={() => setServerUrl(preset.url)}
                  >
                    <Text style={[styles.presetText, serverUrl === preset.url && styles.presetTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In & Go Online</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Fill Button */}
          <TouchableOpacity style={styles.demoBtn} onPress={handleFillDemo}>
            <Text style={styles.demoBtnText}>⚡ Autofill Demo Driver (Ravi Kumar)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Backend API status: Connects to Express + Socket.IO v4
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 2,
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#161822',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f111a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 14,
  },
  serverToggle: {
    paddingVertical: 6,
    marginBottom: 12,
  },
  serverToggleText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  serverConfigBox: {
    backgroundColor: '#0f111a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  serverConfigTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c7d2fe',
    marginBottom: 6,
  },
  serverInput: {
    backgroundColor: '#161822',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'column',
    gap: 4,
  },
  presetBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  presetText: {
    fontSize: 10.5,
    color: '#94a3b8',
  },
  presetTextActive: {
    color: '#c7d2fe',
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  demoBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 10,
  },
  demoBtnText: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '600',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#64748b',
    marginTop: 20,
  },
});
