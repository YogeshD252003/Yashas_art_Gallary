import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, MapPin, Phone, Package } from 'lucide-react';
import { useAuth } from '../AuthContext';

export interface OrderItemInput {
  productId?: string;
  name: string;
  price: number;
  quantity?: number;
  image: string;
}

interface PlaceOrderModalProps {
  open: boolean;
  onClose: () => void;
  item: OrderItemInput | null;
  onSuccess?: (orderNumber: string) => void;
}

export const parsePriceValue = (price: string | number): number => {
  if (typeof price === 'number') return price;
  return parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
};

export const PlaceOrderModal: React.FC<PlaceOrderModalProps> = ({ open, onClose, item, onSuccess }) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState({
    full_name: '',
    mobile_number: '',
    location: '',
  });

  useEffect(() => {
    if (user && open) {
      setAddress({
        full_name: user.full_name || user.fullName || '',
        mobile_number: user.mobile_number || '',
        location: user.location || '',
      });
    }
  }, [user, open]);

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setError('');
    }
  }, [open, item]);

  if (!item) return null;

  const unitPrice = parsePriceValue(item.price);
  const total = unitPrice * quantity;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Please log in to place an order.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{
            productId: item.productId,
            name: item.name,
            price: unitPrice,
            quantity,
            image: item.image,
          }],
          shippingAddress: address,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess?.(data.orderNumber);
        onClose();
      } else {
        setError(data.error || 'Failed to place order.');
      }
    } catch {
      setError('Could not reach the server. Run npm run dev.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#161616] rounded-[2rem] shadow-2xl border border-gold/20 dark:border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 dark:border-white/10">
              <h3 className="text-xl font-serif font-bold text-charcoal dark:text-white">Place Your Order</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="flex gap-4 p-4 bg-gold/5 dark:bg-white/5 rounded-2xl border border-gold/10">
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-charcoal dark:text-white truncate">{item.name}</p>
                  <p className="text-gold-dark font-serif font-bold mt-1">₹{unitPrice.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-xs text-charcoal/60 dark:text-white/50">Qty</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="text-sm rounded-lg border border-gold/20 dark:border-white/10 bg-white dark:bg-black/20 px-2 py-1"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-charcoal/50 dark:text-white/50">Delivery details</p>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Full name"
                  value={address.full_name}
                  onChange={(e) => setAddress({ ...address, full_name: e.target.value })}
                  required
                />
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dark" />
                  <input
                    type="tel"
                    className="input-field pl-10"
                    placeholder="Mobile number"
                    value={address.mobile_number}
                    onChange={(e) => setAddress({ ...address, mobile_number: e.target.value })}
                    required
                  />
                </div>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-gold-dark" />
                  <textarea
                    className="input-field pl-10 min-h-[72px] resize-none"
                    placeholder="Delivery address"
                    value={address.location}
                    onChange={(e) => setAddress({ ...address, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center py-3 border-t border-gold/10 dark:border-white/10">
                <span className="text-sm text-charcoal/70 dark:text-white/60">Order total</span>
                <span className="text-2xl font-serif font-bold text-gold-dark">₹{total.toLocaleString()}</span>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold py-3.5 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Package size={18} />}
                {loading ? 'Placing order…' : 'Place order'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
