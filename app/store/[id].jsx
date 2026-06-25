import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function StoreScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { cart, addToCart, replaceCart, itemCount } = useCart();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(null);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    Promise.all([api.get(`/stores/${id}`), api.get(`/products?storeId=${id}`)])
      .then(([s, p]) => { setStore(s.data); setProducts(p.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = (product) => {
    if (cart.storeId && cart.storeId !== id && cart.items.length > 0) {
      Alert.alert(
        'Panier non vide',
        `Votre panier contient des articles de "${cart.storeName}". Vider le panier ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Vider et ajouter', style: 'destructive', onPress: () => addItem(product, true) },
        ]
      );
    } else {
      addItem(product, false);
    }
  };

  const addItem = (product, replace) => {
    if (replace) replaceCart(product, id, store.name);
    else addToCart(product, id, store.name);
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1500);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#16a34a" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.storeName}>{store?.name}</Text>
        <Text style={styles.address}>📍 {store?.address}</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.price}>{item.price.toFixed(2)} €</Text>
            </View>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
            {!isStaff && (
              <TouchableOpacity
                style={[styles.addButton, added === item.id && styles.addedButton]}
                onPress={() => handleAdd(item)}
              >
                <Text style={[styles.addText, added === item.id && styles.addedText]}>
                  {added === item.id ? '✓ Ajouté' : 'Ajouter au panier'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun produit disponible.</Text>}
      />

      {!isStaff && itemCount > 0 && cart.storeId === id && (
        <View style={[styles.cartBanner, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/(tabs)/cart')}>
            <Text style={styles.cartText}>🛒 Voir le panier</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 16 },
  back: { marginBottom: 8 },
  backText: { color: '#dcfce7', fontSize: 14 },
  storeName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  address: { color: '#dcfce7', fontSize: 13, marginTop: 2 },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  productName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#16a34a', marginLeft: 8 },
  description: { fontSize: 13, color: '#6b7280', marginBottom: 10 },
  addButton: { backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  addedButton: { backgroundColor: '#dcfce7' },
  addText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  addedText: { color: '#16a34a' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60 },
  cartBanner: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'transparent' },
  cartButton: {
    backgroundColor: '#16a34a', borderRadius: 30, paddingVertical: 14, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  cartText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cartBadge: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  cartBadgeText: { color: '#16a34a', fontWeight: 'bold', fontSize: 13 },
});
