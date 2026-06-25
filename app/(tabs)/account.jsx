import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', error: false });
  const [pwLoading, setPwLoading] = useState(false);

  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [emailMsg, setEmailMsg] = useState({ text: '', error: false });
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    api.get('/account').then(({ data }) => setAccount(data)).finally(() => setLoading(false));
  }, []);

  const flash = (setter, text, error = false) => {
    setter({ text, error });
    setTimeout(() => setter({ text: '', error: false }), 5000);
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) {
      return flash(setPwMsg, 'Les mots de passe ne correspondent pas.', true);
    }
    setPwLoading(true);
    try {
      const { data } = await api.put('/account/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      flash(setPwMsg, data.message);
    } catch (err) {
      flash(setPwMsg, err.response?.data?.error || 'Erreur.', true);
    } finally {
      setPwLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailLoading(true);
    try {
      const { data } = await api.put('/account/email', emailForm);
      setEmailForm({ newEmail: '', password: '' });
      flash(setEmailMsg, data.message);
      setTimeout(() => { logout(); router.replace('/(auth)/login'); }, 3000);
    } catch (err) {
      flash(setEmailMsg, err.response?.data?.error || 'Erreur.', true);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleExport = async () => {
    Alert.alert(
      'Export de données',
      'Vos données seront exportées au format JSON (RGPD art. 20). Cette fonctionnalité nécessite une connexion à un PC pour récupérer le fichier.',
      [{ text: 'OK' }]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données seront effacées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirmation',
              'Saisissez votre mot de passe pour confirmer :',
              async (password) => {
                if (!password) return;
                try {
                  await api.delete('/account', { data: { password } });
                  await logout();
                  router.replace('/(auth)/login');
                } catch (err) {
                  Alert.alert('Erreur', err.response?.data?.error || 'Mot de passe incorrect.');
                }
              },
              'secure-text'
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon compte</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <Section title="Mes informations">
          <InfoRow label="Email" value={account?.email} />
          <InfoRow label="Rôle" value={account?.role} />
          <InfoRow label="Email vérifié" value={account?.isEmailVerified ? 'Oui' : 'Non'} />
          <InfoRow
            label="Membre depuis"
            value={new Date(account?.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          />
          <InfoRow label="Commandes" value={account?.orders?.length ?? 0} />
        </Section>

        <Section title="Changer le mot de passe">
          <TextInput style={styles.input} placeholder="Mot de passe actuel" placeholderTextColor="#9ca3af"
            value={pwForm.currentPassword} onChangeText={(t) => setPwForm({ ...pwForm, currentPassword: t })} secureTextEntry />
          <TextInput style={styles.input} placeholder="Nouveau mot de passe" placeholderTextColor="#9ca3af"
            value={pwForm.newPassword} onChangeText={(t) => setPwForm({ ...pwForm, newPassword: t })} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirmer le nouveau mot de passe" placeholderTextColor="#9ca3af"
            value={pwForm.confirm} onChangeText={(t) => setPwForm({ ...pwForm, confirm: t })} secureTextEntry />
          {pwMsg.text !== '' && <Text style={[styles.msg, pwMsg.error && styles.msgError]}>{pwMsg.text}</Text>}
          <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={pwLoading}>
            {pwLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Modifier le mot de passe</Text>}
          </TouchableOpacity>
        </Section>

        <Section title="Changer l'email">
          <Text style={styles.hint}>Un email de vérification sera envoyé. Vous serez déconnecté.</Text>
          <TextInput style={styles.input} placeholder="Nouvelle adresse email" placeholderTextColor="#9ca3af"
            value={emailForm.newEmail} onChangeText={(t) => setEmailForm({ ...emailForm, newEmail: t })}
            keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Mot de passe actuel" placeholderTextColor="#9ca3af"
            value={emailForm.password} onChangeText={(t) => setEmailForm({ ...emailForm, password: t })} secureTextEntry />
          {emailMsg.text !== '' && <Text style={[styles.msg, emailMsg.error && styles.msgError]}>{emailMsg.text}</Text>}
          <TouchableOpacity style={styles.button} onPress={handleChangeEmail} disabled={emailLoading}>
            {emailLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Modifier l'email</Text>}
          </TouchableOpacity>
        </Section>

        <Section title="Mes données (RGPD)">
          <Text style={styles.rgpdText}>
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité sur vos données.
          </Text>
          <TouchableOpacity style={styles.outlineButton} onPress={handleExport}>
            <Text style={styles.outlineButtonText}>Exporter mes données (art. 20)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDelete}>
            <Text style={styles.dangerButtonText}>Supprimer mon compte (art. 17)</Text>
          </TouchableOpacity>
        </Section>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  logoutText: { color: '#dcfce7', fontSize: 14 },
  scroll: { padding: 16, gap: 16 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowOpacity: 0.06, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8 },
  infoLabel: { fontSize: 13, color: '#6b7280' },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#111827', flex: 1, textAlign: 'right' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827' },
  button: { backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  outlineButton: { borderWidth: 1, borderColor: '#16a34a', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  outlineButtonText: { color: '#16a34a', fontWeight: '600', fontSize: 14 },
  dangerButton: { borderWidth: 1, borderColor: '#fca5a5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  dangerButtonText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  msg: { fontSize: 13, color: '#16a34a' },
  msgError: { color: '#ef4444' },
  hint: { fontSize: 12, color: '#9ca3af' },
  rgpdText: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
});
