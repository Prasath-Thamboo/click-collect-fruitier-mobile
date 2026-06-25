import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import api from '../../api/axios';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [managerCode, setManagerCode] = useState('');
  const [showManagerCode, setShowManagerCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const payload = { email, password };
      if (showManagerCode && managerCode.trim()) payload.managerCode = managerCode.trim();
      const { data } = await api.post('/auth/register', payload);
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>📬</Text>
        <Text style={styles.successTitle}>Inscription réussie !</Text>
        <Text style={styles.successText}>{success}</Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer un compte</Text>

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

        <TouchableOpacity
          onPress={() => { setShowManagerCode(!showManagerCode); setManagerCode(''); }}
          style={styles.toggleRow}
        >
          <Text style={styles.toggleText}>
            {showManagerCode ? '▾' : '▸'} J'ai un code d'invitation manager
          </Text>
        </TouchableOpacity>

        {showManagerCode && (
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="Code d'invitation (ex: A3F9B2)"
            placeholderTextColor="#9ca3af"
            value={managerCode}
            onChangeText={(t) => setManagerCode(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={12}
          />
        )}

        {error !== '' && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.loginLink}>
            <Text style={styles.linkText}>Déjà un compte ? <Text style={styles.linkBold}>Se connecter</Text></Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0fdf4' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#15803d', marginBottom: 28 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1fae5',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, marginBottom: 12, color: '#111827',
  },
  codeInput: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 4 },
  toggleRow: { marginBottom: 8 },
  toggleText: { color: '#6b7280', fontSize: 13 },
  button: {
    backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 8 },
  loginLink: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkBold: { color: '#16a34a', fontWeight: '600' },
  successContainer: { flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#15803d', marginBottom: 12 },
  successText: { color: '#6b7280', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
});
