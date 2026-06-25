import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const handleLogin = async () => {
    setError(''); setErrorCode(''); setResendMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await login(data.token, data.user);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion.');
      setErrorCode(err.response?.data?.code || '');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setResendMsg('Email de vérification renvoyé !');
    } catch {
      setResendMsg('Erreur lors du renvoi.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🍎</Text>
        <Text style={styles.title}>FruityCollect</Text>
        <Text style={styles.subtitle}>Connexion</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error !== '' && (
          <View>
            <Text style={styles.errorText}>{error}</Text>
            {errorCode === 'EMAIL_NOT_VERIFIED' && (
              <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                <Text style={styles.linkSmall}>
                  {resendLoading ? 'Envoi...' : "Renvoyer l'email de vérification"}
                </Text>
              </TouchableOpacity>
            )}
            {resendMsg !== '' && <Text style={styles.successSmall}>{resendMsg}</Text>}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity>
            <Text style={styles.linkSmall}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.registerLink}>
            <Text style={styles.linkText}>Pas de compte ? <Text style={styles.linkBold}>S'inscrire</Text></Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0fdf4' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#15803d', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1fae5',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, marginBottom: 12, color: '#111827',
  },
  button: {
    backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 4 },
  successSmall: { color: '#16a34a', fontSize: 13, marginBottom: 4 },
  linkSmall: { color: '#16a34a', fontSize: 13, marginBottom: 8 },
  registerLink: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkBold: { color: '#16a34a', fontWeight: '600' },
});
