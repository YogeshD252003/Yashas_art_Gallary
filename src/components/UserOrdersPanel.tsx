import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Package, Truck, CheckCircle2, Clock, XCircle, ChevronRight, ShoppingBag, Loader2,
} from 'lucide-react';
import { PlaceOrderModal, OrderItemInput } from './PlaceOrderModal';

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  items: Array<{ name: string; price: number; quantity?: number; image?: string; productId?: string }>;
  total: number;
  status: OrderStatus;
  created_at: string;
  statusHistory?: Array<{ status: OrderStatus; timestamp: string }>;
  shippingAddress?: { full_name?: string; location?: string };
}

type OrderFilter = 'all' | 'open' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_STEPS: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Order placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PLACED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  CONFIRMED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  PROCESSING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
};

const FILTERS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'All orders' },
  { id: 'open', label: 'Not yet shipped' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const matchesFilter = (status: OrderStatus, filter: OrderFilter) => {
  if (filter === 'all') return true;
  if (filter === 'open') return ['PLACED', 'CONFIRMED', 'PROCESSING'].includes(status);
  if (filter === 'shipped') return status === 'SHIPPED';
  if (filter === 'delivered') return status === 'DELIVERED';
  if (filter === 'cancelled') return status === 'CANCELLED';
  return true;
};

const OrderTimeline: React.FC<{ status: OrderStatus }> = ({ status }) => {
  if (status === 'CANCELLED') return null;
  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center min-w-[56px]">
              <div className={`w-3 h-3 rounded-full ${done ? 'bg-gold-dark' : 'bg-stone-200 dark:bg-white/20'} ${active ? 'ring-2 ring-gold-dark/40' : ''}`} />
              <span className={`text-[8px] mt-1 text-center leading-tight ${done ? 'text-charcoal dark:text-white/80 font-bold' : 'text-charcoal/40 dark:text-white/30'}`}>
                {STATUS_LABELS[step].split(' ')[0]}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 min-w-[12px] mb-4 ${idx < currentIdx ? 'bg-gold-dark' : 'bg-stone-200 dark:bg-white/10'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface UserOrdersPanelProps {
  token: string | null;
}

export const UserOrdersPanel: React.FC<UserOrdersPanelProps> = ({ token }) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [reorderItem, setReorderItem] = useState<OrderItemInput | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const filtered = useMemo(
    () => orders.filter((o) => matchesFilter(o.status, filter)),
    [orders, filter]
  );

  const openCount = orders.filter((o) => matchesFilter(o.status, 'open')).length;

  const handleBuyAgain = (item: OrderRecord['items'][0]) => {
    setReorderItem({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image || '',
      quantity: 1,
    });
    setOrderModalOpen(true);
  };

  return (
    <>
      <div className="glass p-6 sm:p-8 rounded-[2.5rem]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-serif font-bold italic dark:text-white">Your Orders</h3>
            <p className="text-sm text-charcoal/60 dark:text-white/50 mt-1">
              {orders.length === 0 ? 'No orders yet' : `${orders.length} order${orders.length !== 1 ? 's' : ''}${openCount ? ` · ${openCount} in progress` : ''}`}
            </p>
          </div>
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-gold-dark hover:underline flex items-center gap-1">
            Continue shopping <ChevronRight size={14} />
          </Link>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            {successMsg}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f.id
                  ? 'bg-charcoal dark:bg-white text-white dark:text-charcoal shadow-md'
                  : 'bg-white/50 dark:bg-white/5 text-charcoal/70 dark:text-white/60 hover:bg-gold/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center text-charcoal/50">
            <Loader2 className="animate-spin text-gold-dark mb-3" size={32} />
            <p className="text-sm italic">Loading your orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gold-dark">
              <ShoppingBag size={28} />
            </div>
            <h4 className="text-lg font-serif font-bold dark:text-white mb-2">
              {filter === 'all' ? 'No orders yet' : 'No orders in this category'}
            </h4>
            <p className="text-sm text-charcoal/60 dark:text-white/50 mb-6 max-w-sm mx-auto">
              Browse our gallery and tap <strong>Buy Now</strong> on any artwork to place your first order.
            </p>
            <Link to="/" className="btn-gold py-2.5 px-8 inline-block text-sm">Shop gallery</Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((order) => (
              <motion.div
                key={order.id}
                layout
                className="rounded-2xl border border-gold/15 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-gold/5 dark:bg-white/[0.04] border-b border-gold/10 dark:border-white/10">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="font-bold text-charcoal dark:text-white uppercase tracking-wider">
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-charcoal/60 dark:text-white/50">
                      Placed {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-charcoal/60 dark:text-white/50 font-mono">{order.orderNumber}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-charcoal/50 dark:text-white/40">Total</p>
                    <p className="font-serif font-bold text-gold-dark">₹{Number(order.total).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-100 dark:bg-white/5 flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gold-dark">
                            <Package size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-charcoal dark:text-white">{item.name}</p>
                          <p className="text-sm text-charcoal/60 dark:text-white/50 mt-0.5">
                            Qty: {item.quantity || 1} · ₹{Number(item.price).toLocaleString()} each
                          </p>
                          {order.shippingAddress?.location && (
                            <p className="text-xs text-charcoal/50 dark:text-white/40 mt-1 truncate">
                              Deliver to: {order.shippingAddress.location}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status]}`}>
                            {order.status === 'SHIPPED' && <Truck size={10} />}
                            {order.status === 'DELIVERED' && <CheckCircle2 size={10} />}
                            {order.status === 'CANCELLED' && <XCircle size={10} />}
                            {!['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status) && <Clock size={10} />}
                            {STATUS_LABELS[order.status]}
                          </span>
                          {order.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => handleBuyAgain(item)}
                              className="text-[10px] font-bold uppercase tracking-wider text-gold-dark hover:underline"
                            >
                              Buy again
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <OrderTimeline status={order.status} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <PlaceOrderModal
        open={orderModalOpen}
        onClose={() => { setOrderModalOpen(false); setReorderItem(null); }}
        item={reorderItem}
        onSuccess={(orderNumber) => {
          setSuccessMsg(`Order ${orderNumber} placed successfully!`);
          fetchOrders();
          setTimeout(() => setSuccessMsg(''), 5000);
        }}
      />
    </>
  );
};
