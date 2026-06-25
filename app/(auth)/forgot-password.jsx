import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import api from '../../api/axios';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(''); setMessage('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Entrez votre email pour recevoir un lien de réinitialisation.
        </Text>

        {message ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{message}</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {error !== '' && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Envoyer le lien</Text>}
            </TouchableOpacity>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.backLink}>
                <Text style={styles.linkText}>← Retour à la connexion</Text>
              </TouchableOpacity>
            </Link>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0fdf4' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#15803d', marginBottom: 8 },
  subtitle: { color: '#6b7280', fontSize: 14, marginBottom: 28, lineHeight: 20 },
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
  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 8 },
  backLink: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#16a34a', fontSize: 14 },
  successBox: { gap: 16 },
  successText: { color: '#374151', lineHeight: 22 },
});
