import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Loader2, Navigation, ChevronRight, ChevronLeft, Package, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { placeOrder } from '../services/orderService';
import type { CheckoutStep, ShippingAddress } from '../types/commerce';

const emptyAddress = (): ShippingAddress => ({
  full_name: '',
  email: '',
  mobile_number: '',
  address_line: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
  location: '',
  geo_latitude: null,
  geo_longitude: null,
  order_notes: '',
});

export const CheckoutPage: React.FC = () => {
  const { user, token } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<CheckoutStep>('details');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    setAddress((prev) => ({
      ...prev,
      full_name: user.full_name || prev.full_name,
      email: user.email || prev.email,
      mobile_number: user.mobile_number || prev.mobile_number,
      city: prev.city || user.location || '',
    }));
  }, [user, items.length, navigate]);

  const buildFullLocation = (a: ShippingAddress) =>
    [a.address_line, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(', ');

  const validateDetails = (): boolean => {
    const next: Record<string, string> = {};
    if (!address.full_name.trim()) next.full_name = 'Full name is required';
    if (!address.mobile_number.trim() || address.mobile_number.replace(/\D/g, '').length < 10) {
      next.mobile_number = 'Valid mobile number is required';
    }
    if (!address.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      next.email = 'Valid email is required';
    }
    if (!address.address_line.trim()) next.address_line = 'Address is required';
    if (!address.city.trim()) next.city = 'City is required';
    if (!address.state.trim()) next.state = 'State is required';
    if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode.trim())) {
      next.pincode = 'Valid 6-digit pincode is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const fetchGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddress((a) => ({
          ...a,
          geo_latitude: latitude,
          geo_longitude: longitude,
          location: buildFullLocation(a) || `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`,
        }));
        toast.success('Live location captured');
        setGeoLoading(false);
      },
      () => {
        toast.error('Location denied — enter address manually');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const goToReview = () => {
    const fullLoc = buildFullLocation(address);
    const withLocation = { ...address, location: fullLoc };
    setAddress(withLocation);
    if (!validateDetails()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setStep('review');
  };

  const confirmOrder = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const shippingAddress: ShippingAddress = {
        ...address,
        location: buildFullLocation(address),
      };
      const orderItems = items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      }));
      const { orderNumber, emailSent } = await placeOrder(token, orderItems, shippingAddress);
      clearCart();
      toast.success(`Order ${orderNumber} confirmed!`);
      if (emailSent) {
        toast.success('Admin notified by email');
      }
      navigate('/dashboard', { state: { orderPlaced: orderNumber } });
    } catch (e: any) {
      toast.error(e.message || 'Could not place order');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'details', label: 'Delivery' },
    { id: 'review', label: 'Review' },
  ] as const;

  return (
    <div className="pt-28 px-4 sm:px-6 min-h-screen pb-20 max-w-4xl mx-auto">
      <h1 className="text-4xl font-serif font-bold mb-2 dark:text-white">
        Secure <span className="text-gradient-gold">Checkout</span>
      </h1>

      <div className="flex gap-2 mb-8 mt-4">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                step === s.id ? 'bg-gold-dark text-white' : 'bg-gold/10 text-charcoal/50 dark:text-white/40'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                {idx + 1}
              </span>
              {s.label}
            </div>
            {idx < steps.length - 1 && <ChevronRight className="self-center text-gold-dark/40" size={18} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="glass rounded-[2rem] p-6 sm:p-8 space-y-6 border border-gold/15"
          >
            <section>
              <h2 className="text-lg font-serif font-bold mb-4 dark:text-white">Customer information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <input
                    className="input-field"
                    placeholder="Full name *"
                    value={address.full_name}
                    onChange={(e) => setAddress({ ...address, full_name: e.target.value })}
                  />
                  {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
                </div>
                <div>
                  <input
                    className="input-field"
                    placeholder="Mobile number *"
                    value={address.mobile_number}
                    onChange={(e) => setAddress({ ...address, mobile_number: e.target.value })}
                  />
                  {errors.mobile_number && <p className="text-xs text-red-500 mt-1">{errors.mobile_number}</p>}
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Email *"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-serif font-bold mb-4 dark:text-white">Delivery details</h2>
              <div className="space-y-4">
                <textarea
                  className="input-field min-h-[72px] resize-none"
                  placeholder="Full address *"
                  value={address.address_line}
                  onChange={(e) => setAddress({ ...address, address_line: e.target.value })}
                />
                {errors.address_line && <p className="text-xs text-red-500">{errors.address_line}</p>}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      className="input-field"
                      placeholder="City / Place *"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <input
                      className="input-field"
                      placeholder="State *"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    />
                    {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                  </div>
                  <div>
                    <input
                      className="input-field"
                      placeholder="Pincode *"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    />
                    {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
                  </div>
                  <input
                    className="input-field"
                    placeholder="Landmark (optional)"
                    value={address.landmark}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-serif font-bold mb-3 dark:text-white">Location</h2>
              <button
                type="button"
                onClick={fetchGeolocation}
                disabled={geoLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 text-gold-dark font-bold text-sm hover:bg-gold/20 transition-all"
              >
                {geoLoading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                Use my live location
              </button>
              {address.geo_latitude != null && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                  <MapPin size={12} /> GPS: {address.geo_latitude.toFixed(5)}, {address.geo_longitude?.toFixed(5)}
                </p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-serif font-bold mb-3 dark:text-white">Order notes</h2>
              <textarea
                className="input-field min-h-[64px] resize-none"
                placeholder="Optional message for the artist / delivery"
                value={address.order_notes}
                onChange={(e) => setAddress({ ...address, order_notes: e.target.value })}
              />
            </section>

            <div className="flex gap-3 pt-2">
              <Link to="/cart" className="flex-1 py-3 text-center rounded-2xl border border-gold/20 font-bold text-sm">
                Back to cart
              </Link>
              <button type="button" onClick={goToReview} className="flex-1 btn-gold py-3 flex items-center justify-center gap-2">
                Review order <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-6"
          >
            <div className="glass rounded-[2rem] p-6 border border-gold/15">
              <h2 className="text-xl font-serif font-bold mb-4 dark:text-white">Order summary</h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1">
                      <p className="font-bold text-sm dark:text-white">{item.name}</p>
                      <p className="text-xs text-charcoal/50">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gold-dark">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gold/10 pt-4 space-y-2 text-sm">
                <p><span className="text-charcoal/50">Customer:</span> <strong>{address.full_name}</strong></p>
                <p><span className="text-charcoal/50">Phone:</span> {address.mobile_number}</p>
                <p><span className="text-charcoal/50">Email:</span> {address.email}</p>
                <p><span className="text-charcoal/50">Deliver to:</span> {buildFullLocation(address)}</p>
              </div>
              <p className="text-2xl font-serif font-bold text-gold-dark mt-4 pt-4 border-t border-gold/10">
                Total: ₹{subtotal.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="flex-1 py-3 rounded-2xl border border-gold/20 font-bold flex items-center justify-center gap-2"
              >
                <ChevronLeft size={18} /> Edit details
              </button>
              <Link to="/cart" className="flex-1 py-3 text-center rounded-2xl border border-red-200 text-red-500 font-bold">
                Cancel
              </Link>
              <button
                type="button"
                disabled={loading}
                onClick={confirmOrder}
                className="flex-1 btn-gold py-3 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Confirm order
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
