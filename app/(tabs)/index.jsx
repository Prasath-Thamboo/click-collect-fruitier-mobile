import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api/axios';

export default function StoresScreen() {
  const insets = useSafeAreaInsets();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stores').then(({ data }) => setStores(data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>🍎 FruityCollect</Text>
        <Text style={styles.subtitle}>Choisissez un magasin</Text>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/store/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRow}>
              <Text style={styles.storeIcon}>🏪</Text>
              <View style={styles.cardContent}>
                <Text style={styles.storeName}>{item.name}</Text>
                <Text style={styles.storeAddress}>📍 {item.address}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun magasin disponible pour le moment.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#16a34a' },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#dcfce7', fontSize: 13, marginTop: 2 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storeIcon: { fontSize: 28 },
  cardContent: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  storeAddress: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  arrow: { fontSize: 22, color: '#16a34a', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60 },
});
