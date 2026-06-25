import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api/axios';

const STATUS = {
  PENDING:   { label: 'En attente',  color: '#f59e0b', bg: '#fef3c7' },
  ACCEPTED:  { label: 'Acceptée',    color: '#3b82f6', bg: '#dbeafe' },
  READY:     { label: 'Prête',       color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Annulée',     color: '#ef4444', bg: '#fee2e2' },
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    api.get('/orders').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await api.patch(`/orders/${id}/cancel`);
      fetchOrders();
    } catch {}
    finally { setCancelling(null); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes commandes</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const s = STATUS[item.status] || STATUS.PENDING;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.storeName}>{item.store?.name}</Text>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                </View>
              </View>
              <Text style={styles.date}>
                Retrait : {new Date(item.pickupDate).toLocaleDateString('fr-FR', {
                  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
              {item.items?.map((i) => (
                <Text key={i.id} style={styles.item}>• {i.product?.name} × {i.quantity}</Text>
              ))}
              <View style={styles.cardBottom}>
                <Text style={styles.total}>{item.totalAmount?.toFixed(2)} €</Text>
                {item.status === 'PENDING' && (
                  <TouchableOpacity
                    onPress={() => handleCancel(item.id)}
                    disabled={cancelling === item.id}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelText}>
                      {cancelling === item.id ? '...' : 'Annuler'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune commande pour le moment.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowOpacity: 0.06 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  storeName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  item: { fontSize: 13, color: '#374151', marginBottom: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  total: { fontSize: 17, fontWeight: 'bold', color: '#16a34a' },
  cancelBtn: { borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  cancelText: { color: '#ef4444', fontSize: 13 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60 },
});
