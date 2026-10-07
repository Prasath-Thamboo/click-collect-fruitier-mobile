import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStripe } from '@stripe/stripe-react-native';
import api from '../../api/axios';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DISCOUNT_PERCENT = 15;
const WEEKS_PER_MONTH = 4.33;
const STEPS = ['Boutique', 'Produits', 'Planning', 'Paiement'];

function pad(n) { return n.toString().padStart(2, '0'); }
function formatTime(date) { return `${pad(date.getHours())}:${pad(date.getMinutes())}`; }

function StepDots({ step }) {
  return (
    <View style={styles.stepsRow}>
      {STEPS.map((label, i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[
            styles.stepDot,
            step > i + 1 && styles.stepDotDone,
            step === i + 1 && styles.stepDotActive,
          ]}>
            <Text style={styles.stepDotText}>{step > i + 1 ? '✓' : i + 1}</Text>
          </View>
          <Text style={[styles.stepLabel, step === i + 1 && styles.stepLabelActive]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function NewSubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [step, setStep] = useState(1);

  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);

  const [products, setProducts] = useState([]);
  const [items, setItems] = useState({});

  const [selectedDays, setSelectedDays] = useState([]);
  const [pickupTime, setPickupTime] = useState(new Date(2000, 0, 1, 10, 0));
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/stores').then(({ data }) => setStores(data.filter((s) => s.isActive)));
  }, []);

  useEffect(() => {
    if (selectedStore) {
      api.get(`/products?storeId=${selectedStore.id}`).then(({ data }) => setProducts(data));
    }
  }, [selectedStore]);

  const itemList = Object.entries(items)
    .filter(([, qty]) => qty > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  const schedules = selectedDays.map((d) => ({ dayOfWeek: d, pickupTime: formatTime(pickupTime) }));

  const orderTotal = itemList.reduce((sum, item) => {
    const p = products.find((p) => p.id === item.productId);
    return sum + (p?.price || 0) * item.quantity;
  }, 0);

  const pickupsPerMonth = Math.round(schedules.length * WEEKS_PER_MONTH);
  const monthlyBase = orderTotal * pickupsPerMonth;
  const monthlyDiscounted = monthlyBase * (1 - DISCOUNT_PERCENT / 100);

  const toggleDay = (day) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      const { data: intentData } = await api.post('/subscriptions/create-intent', {
        storeId: selectedStore.id,
        items: itemList,
        schedules,
      });

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Click & Collect',
        paymentIntentClientSecret: intentData.clientSecret,
        defaultBillingDetails: {},
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') setError(presentError.message || 'Erreur lors du paiement.');
        setLoading(false);
        return;
      }

      await api.post('/subscriptions/confirm', {
        stripeSubscriptionId: intentData.stripeSubscriptionId,
        storeId: selectedStore.id,
        items: itemList,
        schedules,
      });

      router.replace('/(tabs)/subscriptions');
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Erreur lors de la création de l'abonnement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 1 ? router.back() : setStep(step - 1))}>
          <Text style={styles.backText}>‹ {step === 1 ? 'Retour' : 'Précédent'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nouvel abonnement</Text>
      </View>

      <StepDots step={step} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 1 && (
          <View style={{ gap: 10 }}>
            <Text style={styles.hint}>Choisissez la boutique pour votre abonnement.</Text>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                onPress={() => setSelectedStore(store)}
                style={[styles.storeCard, selectedStore?.id === store.id && styles.storeCardActive]}
              >
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeAddress}>{store.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 10 }}>
            <Text style={styles.hint}>Choisissez les produits de votre panier récurrent.</Text>
            {products.filter((p) => p.isAvailable).map((product) => {
              const qty = items[product.id] || 0;
              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>{product.price.toFixed(2)} € / unité</Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setItems((prev) => ({ ...prev, [product.id]: Math.max(0, (prev[product.id] || 0) - 1) }))}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qty}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setItems((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }))}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {itemList.length > 0 && (
              <Text style={styles.totalPerPickup}>Total par passage : {orderTotal.toFixed(2)} €</Text>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: 16 }}>
            <View>
              <Text style={styles.label}>Jours de retrait dans la semaine</Text>
              <View style={styles.dayRow}>
                {DAY_LABELS.map((label, day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[styles.dayChip, selectedDays.includes(day) && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayChipText, selectedDays.includes(day) && styles.dayChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={styles.label}>Heure de retrait</Text>
              <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.timeButtonText}>{formatTime(pickupTime)}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={pickupTime}
                  mode="time"
                  is24Hour
                  onChange={(event, selected) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (selected) setPickupTime(selected);
                  }}
                />
              )}
            </View>

            {selectedDays.length > 0 && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Récapitulatif abonnement</Text>
                <Text style={styles.summaryLine}>
                  {selectedDays.map((d) => DAY_LABELS[d]).join(', ')} à {formatTime(pickupTime)} — {pickupsPerMonth} passages/mois
                </Text>
                <Text style={styles.summaryBase}>Base : {monthlyBase.toFixed(2)} €/mois</Text>
                <Text style={styles.summaryDiscounted}>
                  Après réduction {DISCOUNT_PERCENT}% : {monthlyDiscounted.toFixed(2)} €/mois
                </Text>
              </View>
            )}

            {error !== '' && <Text style={styles.errorText}>{error}</Text>}
          </View>
        )}

        {step === 4 && (
          <View style={styles.paymentBox}>
            <View style={styles.paymentSummary}>
              <Text style={styles.paymentSummaryTitle}>Abonnement mensuel — {DISCOUNT_PERCENT}% de réduction</Text>
              <Text style={styles.paymentSummaryAmount}>{monthlyDiscounted.toFixed(2)} € / mois</Text>
              <Text style={styles.paymentSummaryHint}>Renouvellement automatique — annulable à tout moment</Text>
            </View>
            {error !== '' && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={styles.payButton} onPress={handlePay} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.payButtonText}>Payer {monthlyDiscounted.toFixed(2)} €</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {step === 1 && (
          <TouchableOpacity
            style={[styles.nextButton, !selectedStore && styles.disabledButton]}
            disabled={!selectedStore}
            onPress={() => setStep(2)}
          >
            <Text style={styles.nextButtonText}>Suivant →</Text>
          </TouchableOpacity>
        )}
        {step === 2 && (
          <TouchableOpacity
            style={[styles.nextButton, itemList.length === 0 && styles.disabledButton]}
            disabled={itemList.length === 0}
            onPress={() => setStep(3)}
          >
            <Text style={styles.nextButtonText}>Suivant →</Text>
          </TouchableOpacity>
        )}
        {step === 3 && (
          <TouchableOpacity
            style={[styles.nextButton, selectedDays.length === 0 && styles.disabledButton]}
            disabled={selectedDays.length === 0 || loading}
            onPress={() => setStep(4)}
          >
            <Text style={styles.nextButtonText}>Passer au paiement →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 16 },
  backText: { color: '#dcfce7', fontSize: 14, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff' },
  stepItem: { alignItems: 'center', gap: 4, flex: 1 },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#16a34a' },
  stepDotDone: { backgroundColor: '#16a34a' },
  stepDotText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  stepLabel: { fontSize: 10, color: '#9ca3af' },
  stepLabelActive: { color: '#16a34a', fontWeight: '600' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  hint: { color: '#6b7280', marginBottom: 4 },
  storeCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb', padding: 14 },
  storeCardActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  storeName: { fontWeight: '600', color: '#111827', fontSize: 15 },
  storeAddress: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  productCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  productName: { fontWeight: '600', color: '#111827', fontSize: 15 },
  productPrice: { color: '#16a34a', fontSize: 13, fontWeight: '500', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, color: '#374151', lineHeight: 22 },
  qty: { fontWeight: '600', minWidth: 20, textAlign: 'center' },
  totalPerPickup: { color: '#16a34a', fontWeight: '600', fontSize: 13 },
  label: { color: '#374151', fontWeight: '500', marginBottom: 8 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#f3f4f6' },
  dayChipActive: { backgroundColor: '#16a34a' },
  dayChipText: { color: '#6b7280', fontWeight: '500', fontSize: 13 },
  dayChipTextActive: { color: '#fff' },
  timeButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignSelf: 'flex-start' },
  timeButtonText: { color: '#111827', fontWeight: '600' },
  summaryBox: { backgroundColor: '#f0fdf4', borderRadius: 14, borderWidth: 1, borderColor: '#bbf7d0', padding: 14 },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#166534', marginBottom: 4 },
  summaryLine: { fontSize: 13, color: '#15803d' },
  summaryBase: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  summaryDiscounted: { fontSize: 15, fontWeight: '700', color: '#15803d', marginTop: 2 },
  errorText: { color: '#ef4444', fontSize: 13 },
  paymentBox: { gap: 16 },
  paymentSummary: { backgroundColor: '#f0fdf4', borderRadius: 14, borderWidth: 1, borderColor: '#bbf7d0', padding: 16 },
  paymentSummaryTitle: { fontSize: 13, fontWeight: '600', color: '#166534' },
  paymentSummaryAmount: { fontSize: 24, fontWeight: 'bold', color: '#15803d', marginTop: 4 },
  paymentSummaryHint: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  payButton: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: '#f0fdf4' },
  nextButton: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  nextButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
