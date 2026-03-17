import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, StatusBar,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { t } from '../i18n/translations';
import api from '../services/api';
import { saveUserLocally, getLocalUser } from '../db/localDb';

export default function LoginScreen() {
  const { login, language, toggleLanguage, isOnline } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // isOnline can be null on web before NetInfo fires — treat null as online
      if (isOnline !== false) {
        // Online login
        const res = await api.post('/auth/login', { username, password });
        saveUserLocally(res.data.user); // sync function, no await needed
        await login(res.data.user, res.data.token);
      } else {
        // Offline login
        const localUser = getLocalUser(username);
        if (localUser) {
          await login(localUser, 'offline_token');
          Alert.alert('✅', t('offlineLogin', language));
        } else {
          Alert.alert(t('error', language), 'No offline data available. Please connect to internet and login once first.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert(t('error', language), `${t('loginError', language)}\n\nMake sure backend is running on port 3000.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      
      {/* Offline Badge */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📴 {t('offline', language)} MODE</Text>
        </View>
      )}

      <View style={styles.card}>
        {/* Header */}
        <View style={styles.logoArea}>
          <Text style={styles.logoIcon}>🚔</Text>
          <Text style={styles.appName}>{t('appName', language)}</Text>
          <Text style={styles.subtitle}>Police Officer Portal</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>{language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username'}</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder={language === 'hi' ? 'अपना उपयोगकर्ता नाम दर्ज करें' : 'Enter your username'}
            autoCapitalize="none"
          />

          <Text style={styles.label}>{language === 'hi' ? 'पासवर्ड' : 'Password'}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={language === 'hi' ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Enter Portal</Text>
            )}
          </TouchableOpacity>

          {/* Language toggle */}
          <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
            <Text style={styles.langBtnText}>
              {language === 'en' ? '🇮🇳 हिंदी में बदलें' : '🇬🇧 Switch to English'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  offlineBanner: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  offlineText: { color: '#fff', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoArea: { alignItems: 'center', marginBottom: 28 },
  logoIcon: { fontSize: 52 },
  appName: { fontSize: 22, fontWeight: 'bold', color: '#1a237e', marginTop: 8 },
  subtitle: { fontSize: 13, color: '#757575', marginTop: 4 },
  form: { gap: 4 },
  label: { fontSize: 13, color: '#424242', fontWeight: '600', marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loginBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
  langBtn: { alignItems: 'center', marginTop: 16 },
  langBtnText: { color: '#1a237e', fontSize: 14 },
  hint: { textAlign: 'center', color: '#bdbdbd', fontSize: 12, marginTop: 20 },
});
