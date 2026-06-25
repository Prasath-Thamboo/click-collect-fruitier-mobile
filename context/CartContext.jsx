import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);
const EMPTY = { storeId: null, storeName: null, items: [] };

export function CartProvider({ children }) {
  const [cart, setCart] = useState(EMPTY);

  useEffect(() => {
    AsyncStorage.getItem('cart').then((stored) => {
      if (stored) try { setCart(JSON.parse(stored)); } catch {}
    });
  }, []);

  const persist = (next) => {
    setCart(next);
    AsyncStorage.setItem('cart', JSON.stringify(next));
  };

  const addToCart = (product, storeId, storeName) => {
    setCart((prev) => {
      const existing = prev.items.find((i) => i.id === product.id);
      const next = existing
        ? { ...prev, items: prev.items.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) }
        : { storeId, storeName, items: [...prev.items, { ...product, quantity: 1 }] };
      AsyncStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  };

  const replaceCart = (product, storeId, storeName) => {
    const next = { storeId, storeName, items: [{ ...product, quantity: 1 }] };
    persist(next);
  };

  const updateQuantity = (productId, quantity) => {
    setCart((prev) => {
      const items = quantity < 1
        ? prev.items.filter((i) => i.id !== productId)
        : prev.items.map((i) => i.id === productId ? { ...i, quantity } : i);
      const next = items.length === 0 ? EMPTY : { ...prev, items };
      AsyncStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  };

  const clearCart = () => persist(EMPTY);

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, replaceCart, updateQuantity, clearCart, itemCount, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
