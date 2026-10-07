import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStripe } from '@stripe/stripe-react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

function minDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  return d;
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { cart, updateQuantity, clearCart, total } = useCart();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [pickupDate, setPickupDate] = useState(minDate());
  const [showPicker, setShowPicker] = useState(false); // iOS: shows combined datetime picker
  const [androidPickerMode, setAndroidPickerMode] = useState(null); // Android: 'date' then 'time'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openPicker = () => {
    if (Platform.OS === 'android') setAndroidPickerMode('date');
    else setShowPicker(true);
  };

  const handlePickerChange = (event, selected) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed' || !selected) { setAndroidPickerMode(null); return; }
      if (androidPickerMode === 'date') {
        const next = new Date(pickupDate);
        next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        setPickupDate(next);
        setAndroidPickerMode('time');
      } else {
        const next = new Date(pickupDate);
        next.setHours(selected.getHours(), selected.getMinutes());
        setPickupDate(next);
        setAndroidPickerMode(null);
      }
      return;
    }
    setShowPicker(false);
    if (selected) setPickupDate(selected);
  };

  if (cart.items.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Panier vide</Text>
        <Text style={styles.emptySubtitle}>Ajoutez des produits depuis un magasin.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.buttonText}>Voir les magasins</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCheckout = async () => {
    if (!user) return router.push('/(auth)/login');
    setError(''); setLoading(true);
    try {
      const orderItems = cart.items.map((i) => ({ productId: i.id, quantity: i.quantity }));

      const { data: intentData } = await api.post('/payments/create-intent', {
        storeId: cart.storeId,
        pickupDate: pickupDate.toISOString(),
        items: orderItems,
      });

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Click & Collect',
        paymentIntentClientSecret: intentData.clientSecret,
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') setError(presentError.message || 'Erreur lors du paiement.');
        setLoading(false);
        return;
      }

      await api.post('/orders', {
        storeId: cart.storeId,
        pickupDate: pickupDate.toISOString(),
        items: orderItems,
        paymentIntentId: intentData.paymentIntentId,
      });
      clearCart();
      router.push('/(tabs)/orders');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors de la commande. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon panier</Text>
        {cart.storeName && <Text style={styles.storeName}>📍 {cart.storeName}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {cart.items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.price.toFixed(2)} € / unité</Text>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.lineTotal}>{(item.price * item.quantity).toFixed(2)} €</Text>
          </View>
        ))}

        <View style={styles.summary}>
          <Text style={styles.pickupLabel}>Date et heure de retrait</Text>
          <TouchableOpacity style={styles.pickupButton} onPress={openPicker}>
            <Text style={styles.pickupButtonText}>
              {pickupDate.toLocaleString('fr-FR', {
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && showPicker && (
            <DateTimePicker
              value={pickupDate}
              mode="datetime"
              minimumDate={minDate()}
              is24Hour
              onChange={handlePickerChange}
            />
          )}
          {Platform.OS === 'android' && androidPickerMode && (
            <DateTimePicker
              value={pickupDate}
              mode={androidPickerMode}
              minimumDate={minDate()}
              is24Hour
              onChange={handlePickerChange}
            />
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{total.toFixed(2)} €</Text>
          </View>

          {error !== '' && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.checkoutText}>Valider la commande</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Vider le panier</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  center: { flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  storeName: { color: '#dcfce7', fontSize: 13, marginTop: 2 },
  scroll: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowOpacity: 0.06 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemPrice: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, color: '#374151', lineHeight: 22 },
  qty: { fontSize: 16, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  lineTotal: { textAlign: 'right', fontWeight: 'bold', color: '#111827', fontSize: 15 },
  summary: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 8, gap: 12, elevation: 2 },
  pickupLabel: { fontSize: 13, color: '#374151', fontWeight: '500' },
  pickupButton: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  pickupButtonText: { color: '#111827', fontWeight: '600', fontSize: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, color: '#374151', fontWeight: '500' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#16a34a' },
  checkoutButton: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  clearText: { textAlign: 'center', color: '#9ca3af', fontSize: 13 },
  errorText: { color: '#ef4444', fontSize: 13 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginBottom: 6 },
  emptySubtitle: { color: '#9ca3af', marginBottom: 24 },
  button: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
