import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api/axios';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const STATUS = {
  ACTIVE:    { label: 'Actif',   bg: '#dcfce7', color: '#16a34a' },
  PAUSED:    { label: 'En pause', bg: '#fef3c7', color: '#d97706' },
  CANCELLED: { label: 'Annulé',  bg: '#fee2e2', color: '#ef4444' },
};

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const fetchSubs = () => {
    setLoading(true);
    api.get('/subscriptions').then(({ data }) => setSubscriptions(data)).finally(() => setLoading(false));
  };

  useFocusEffect(useCallback(() => { fetchSubs(); }, []));

  const handleCancel = (id) => {
    Alert.alert('Annuler cet abonnement ?', 'Il ne sera plus renouvelé.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Annuler l\'abonnement',
        style: 'destructive',
        onPress: async () => {
          setCancelling(id);
          try {
            await api.delete(`/subscriptions/${id}`);
            fetchSubs();
          } catch {
            Alert.alert('Erreur', "Erreur lors de l'annulation.");
          } finally {
            setCancelling(null);
          }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes abonnements</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => router.push('/subscriptions/new')}>
          <Text style={styles.newButtonText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={subscriptions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const s = STATUS[item.status] || STATUS.ACTIVE;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeName}>{item.store?.name}</Text>
                  <Text style={styles.storeAddress}>{item.store?.address}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                </View>
              </View>

              {item.items?.map((i) => (
                <Text key={i.id} style={styles.item}>• {i.product?.name} × {i.quantity}</Text>
              ))}

              <View style={styles.schedules}>
                {item.schedules?.map((sc) => (
                  <View key={sc.id} style={styles.scheduleTag}>
                    <Text style={styles.scheduleText}>{DAY_LABELS[sc.dayOfWeek]} {sc.pickupTime}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.amount}>{Number(item.monthlyAmount).toFixed(2)} € / mois</Text>
                  <Text style={styles.discount}>-{item.discountPercent}% de réduction</Text>
                </View>
                {item.status === 'ACTIVE' && (
                  <TouchableOpacity
                    onPress={() => handleCancel(item.id)}
                    disabled={cancelling === item.id}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelText}>{cancelling === item.id ? '...' : 'Annuler'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔄</Text>
            <Text style={styles.emptyTitle}>Aucun abonnement</Text>
            <Text style={styles.emptySubtitle}>
              Abonnez-vous pour recevoir vos commandes automatiquement chaque semaine avec 15% de réduction.
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={() => router.push('/subscriptions/new')}>
              <Text style={styles.createButtonText}>Créer mon premier abonnement</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  newButton: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  newButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowOpacity: 0.06 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  storeName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  storeAddress: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  item: { fontSize: 13, color: '#374151', marginBottom: 2 },
  schedules: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 8 },
  scheduleTag: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  scheduleText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  amount: { fontSize: 17, fontWeight: 'bold', color: '#16a34a' },
  discount: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  cancelBtn: { borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  cancelText: { color: '#ef4444', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 6 },
  emptySubtitle: { textAlign: 'center', color: '#9ca3af', marginBottom: 20, lineHeight: 20 },
  createButton: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  createButtonText: { color: '#fff', fontWeight: '600' },
});
