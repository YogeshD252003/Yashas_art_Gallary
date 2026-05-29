import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search, ShoppingCart, CreditCard, Package, Truck, CheckCircle2, ChevronRight,
} from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Browse artworks',
    desc: 'Explore featured pieces on the home gallery. Check price, description, and stock.',
    link: '/',
    linkLabel: 'Shop now',
  },
  {
    icon: ShoppingCart,
    title: 'Add to cart',
    desc: 'Pick quantity, add to cart, or use Buy Now for a single item. Your cart saves automatically.',
    link: '/cart',
    linkLabel: 'View cart',
  },
  {
    icon: CreditCard,
    title: 'Checkout',
    desc: 'Enter delivery details, optional GPS location, and review your order before confirming.',
    link: '/checkout',
    linkLabel: 'Checkout',
  },
  {
    icon: Package,
    title: 'Order placed',
    desc: 'We store your order instantly. Status starts as Placed — our team reviews it next.',
    link: '/dashboard',
    linkLabel: 'Track orders',
  },
  {
    icon: Truck,
    title: 'Processing & shipping',
    desc: 'Admin confirms → processes → ships. Watch the timeline update on your dashboard.',
    link: '/dashboard',
    linkLabel: 'My orders',
  },
  {
    icon: CheckCircle2,
    title: 'Delivered',
    desc: 'When your art arrives, status becomes Delivered. Reorder anytime from order history.',
    link: '/dashboard',
    linkLabel: 'Order history',
  },
];

export const OrderProcessGuide: React.FC = () => {
  return (
    <div className="glass p-8 rounded-[2.5rem] border border-gold/15">
      <h3 className="text-2xl font-serif font-bold mb-2 dark:text-white">
        How ordering <span className="text-gradient-gold">works</span>
      </h3>
      <p className="text-sm text-charcoal/60 dark:text-white/50 mb-8 max-w-lg">
        From discovery to delivery — follow these steps like a professional gallery checkout experience.
      </p>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold-dark via-gold/40 to-transparent hidden sm:block" />
        <div className="space-y-6">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="flex gap-4 sm:gap-6 relative"
              >
                <div className="w-10 h-10 shrink-0 rounded-2xl bg-gold-dark text-white flex items-center justify-center shadow-lg shadow-gold-dark/20 z-10">
                  <Icon size={18} />
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold-dark">
                      Step {idx + 1}
                    </span>
                    <h4 className="font-bold dark:text-white">{step.title}</h4>
                  </div>
                  <p className="text-sm text-charcoal/70 dark:text-white/60 mb-2">{step.desc}</p>
                  <Link
                    to={step.link}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gold-dark hover:underline"
                  >
                    {step.linkLabel} <ChevronRight size={12} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
