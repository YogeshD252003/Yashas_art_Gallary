import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { CartItem } from './types/commerce';

const CART_STORAGE_KEY = 'yashas_cart';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const max = item.maxStock ?? 99;
    const qty = Math.min(Math.max(1, quantity), max);

    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + qty, max);
        toast.success(`Updated ${item.name} in cart`);
        return prev.map((p) => (p.id === item.id ? { ...p, quantity: nextQty } : p));
      }
      toast.success(`${item.name} added to cart`);
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast('Removed from cart', { icon: '🗑️' });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((p) => {
          if (p.id !== id) return p;
          const max = p.maxStock ?? 99;
          return { ...p, quantity: Math.min(Math.max(1, quantity), max) };
        })
        .filter((p) => p.quantity > 0),
    );
  };

  const clearCart = () => setItems([]);

  const isInCart = (id: string) => items.some((p) => p.id === id);

  return (
    <CartContext.Provider
      value={{ items, itemCount, subtotal, addToCart, removeFromCart, updateQuantity, clearCart, isInCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
