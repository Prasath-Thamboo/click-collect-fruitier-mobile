import { Tabs, router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, color: focused ? '#16a34a' : '#9ca3af' }}>{label}</Text>
    </View>
  );
}

function CartIcon({ focused }) {
  const { itemCount } = useCart();
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View>
        <Text style={{ fontSize: 20 }}>🛒</Text>
        {itemCount > 0 && (
          <View style={{
            position: 'absolute', top: -4, right: -6,
            backgroundColor: '#16a34a', borderRadius: 8,
            minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{itemCount}</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 10, color: focused ? '#16a34a' : '#9ca3af' }}>Panier</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace('/(auth)/login');
  }, [user, ready]);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 64, paddingBottom: 8 },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏪" label="Magasins" focused={focused} /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => <CartIcon focused={focused} />,
          href: isStaff ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Commandes" focused={focused} />,
          href: isStaff ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Compte" focused={focused} /> }}
      />
    </Tabs>
  );
}
