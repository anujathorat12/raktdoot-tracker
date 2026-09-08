import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Image
} from 'react-native';
import { DEFAULT_SERVER_URL, PRESET_SERVER_URLS, DEMO_CREDENTIALS } from '../config/constants';
import { loginDriver, storeAuth, storeServerUrl, getStoredServerUrl } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
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

        {/* Top Header Bar: Harbinger Logo */}
        <View style={styles.topHeader}>
          <Image
            source={require('../../assets/harbinger_logo.png')}
            style={styles.harbingerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Brand Section */}
        <View style={styles.brandContainer}>
          {/* Jankalyan Badges Row */}
          <View style={styles.badgesRow}>
            {/* Om Blood Drop Badge */}
            <View style={styles.omBadgeCircle}>
              <Text style={styles.omSymbolText}>ॐ</Text>
            </View>

            {/* NABH Accredited Badge */}
            <View style={styles.nabhBadgeCircle}>
              <Text style={styles.nabhTextTop}>NABH</text>
              <Text style={styles.nabhCheck}>✓</Text>
              <Text style={styles.nabhTextBottom}>ACCREDITED</Text>
            </View>
          </View>

          {/* Title & Tag */}
          <Text style={styles.centreTitle}>Jankalyan Blood Centre, Pune</Text>
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>❤️ Raktdoot Driver Portal</Text>
          </View>
          <Text style={styles.heroSub}>
            Real-Time Cold-Chain Tracking & Emergency Dispatch
          </Text>
        </View>

        {/* Mobile Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Enter credentials to go online & start location tracking
          </Text>

          {/* Email / Driver ID */}
          <Text style={styles.label}>EMAIL ADDRESS / DRIVER ID</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. driver1@delivery.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPass(!showPass)}
            >
              <Text style={{ fontSize: 16 }}>{showPass ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          {/* Server Config Toggle */}
          <TouchableOpacity
            style={styles.serverToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <Text style={styles.serverToggleText}>
              ⚙️ Server Endpoint: <Text style={{ color: '#fca5a5', fontWeight: '700' }}>{serverUrl}</Text>
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.serverConfigBox}>
              <Text style={styles.serverConfigTitle}>API Server URL</Text>
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
              <Text style={styles.loginBtnText}>⚡ Sign In & Go Online</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Fill Button */}
          <TouchableOpacity style={styles.demoBtn} onPress={handleFillDemo}>
            <Text style={styles.demoBtnText}>⚡ Autofill Demo Driver (Ravi Kumar)</Text>
          </TouchableOpacity>
        </View>

        {/* Global Application Footer */}
        <View style={styles.footerBar}>
          <Text style={styles.footerText}>
            © 2026 Jankalyan Blood Centre, Pune | Powered by Harbinger Systems Pvt. Ltd.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090507',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  topHeader: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  harbingerLogo: {
    height: 38,
    width: 140,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  omBadgeCircle: {
    width: 56,
    height: 64,
    borderRadius: 28,
    backgroundColor: '#ee2a35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ee2a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  omSymbolText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  nabhBadgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0b4f9c',
    borderWidth: 2,
    borderColor: '#d92626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  nabhTextTop: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  nabhCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginVertical: -2,
  },
  nabhTextBottom: {
    color: '#ffffff',
    fontSize: 5.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  centreTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  tagText: {
    color: '#f87171',
    fontSize: 11.5,
    fontWeight: '700',
  },
  heroSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#0f111a',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#dc2626',
    padding: 20,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 18,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#cbd5e1',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f1fd',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  inputIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  serverToggle: {
    paddingVertical: 4,
    marginBottom: 12,
  },
  serverToggleText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  serverConfigBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  serverConfigTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fca5a5',
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
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  presetText: {
    fontSize: 10.5,
    color: '#94a3b8',
  },
  presetTextActive: {
    color: '#fca5a5',
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  demoBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  demoBtnText: {
    color: '#fca5a5',
    fontSize: 11.5,
    fontWeight: '600',
  },
  footerBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});
