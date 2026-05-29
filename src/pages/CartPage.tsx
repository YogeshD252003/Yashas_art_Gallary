import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';

export const CartPage: React.FC = () => {
  const { items, subtotal, itemCount, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="pt-28 px-4 sm:px-6 min-h-screen pb-20 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[3rem] p-12 max-w-md text-center border border-gold/20"
        >
          <div className="w-28 h-28 mx-auto mb-6 rounded-3xl bg-gold/10 flex items-center justify-center">
            <ShoppingBag size={48} className="text-gold-dark opacity-60" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-3 dark:text-white">Your cart is empty</h1>
          <p className="text-sm text-charcoal/60 dark:text-white/50 mb-8">
            Discover handcrafted art and add pieces you love to your collection cart.
          </p>
          <Link to="/" className="btn-gold inline-block px-8 py-3">
            Continue shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-28 px-4 sm:px-6 min-h-screen pb-20 max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gold-dark font-bold mb-6 hover:underline">
        <ArrowLeft size={16} /> Continue shopping
      </Link>

      <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-2 dark:text-white">
        Your <span className="text-gradient-gold">Cart</span>
      </h1>
      <p className="text-charcoal/60 dark:text-white/50 mb-8">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              className="glass rounded-3xl p-4 sm:p-5 flex gap-4 border border-gold/10"
            >
              <img src={item.image} alt={item.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold dark:text-white truncate">{item.name}</h3>
                {item.category && (
                  <p className="text-xs text-charcoal/50 dark:text-white/40 uppercase tracking-wider">{item.category}</p>
                )}
                <p className="text-gold-dark font-serif font-bold mt-1">₹{item.price.toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 rounded-full border border-gold/20 p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gold/10"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gold/10"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="font-serif font-bold text-gold-dark self-start">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="glass rounded-[2rem] p-6 h-fit border border-gold/20 sticky top-28">
          <h2 className="text-xl font-serif font-bold mb-4 dark:text-white">Order summary</h2>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-charcoal/60 dark:text-white/50">Subtotal</span>
              <span className="font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/60 dark:text-white/50">Delivery</span>
              <span className="text-emerald-600 font-medium">Calculated at checkout</span>
            </div>
          </div>
          <div className="flex justify-between py-4 border-t border-gold/10 font-serif text-xl font-bold">
            <span>Grand total</span>
            <span className="text-gold-dark">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <button type="button" onClick={handleCheckout} className="w-full btn-gold py-3.5 mt-2">
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
};
