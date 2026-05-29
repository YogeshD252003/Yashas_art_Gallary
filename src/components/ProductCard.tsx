import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingCart, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useWishlist } from '../WishlistContext';
import { useCart } from '../CartContext';
import type { ArtPiece } from '../WishlistContext';

export interface GalleryProduct {
  id: string;
  title: string;
  artist: string;
  price: string;
  numericPrice: number;
  image: string;
  category: string;
  description?: string;
  productId?: string;
  stock?: number;
}

interface ProductCardProps {
  product: GalleryProduct;
  onBuyNow?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuyNow }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  const inStock = product.stock === undefined ? true : product.stock > 0;
  const maxQty = product.stock !== undefined ? Math.min(product.stock, 10) : 10;

  const wishlistItem: ArtPiece = {
    id: product.id,
    title: product.title,
    artist: product.artist,
    price: product.price,
    image: product.image,
    category: product.category,
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!inStock) return;
    addToCart(
      {
        id: product.id,
        productId: product.productId,
        name: product.title,
        price: product.numericPrice,
        image: product.image,
        category: product.category,
        description: product.description,
        maxStock: product.stock,
      },
      qty,
    );
  };

  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.01 }}
      className="glass group rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border border-gold-300/20 dark:border-white/5 hover:border-gold-500/40 dark:hover:border-gold/30 transition-all duration-300"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6">
          <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">{product.category}</span>
          <h4 className="text-lg sm:text-xl text-white font-serif italic">{product.title}</h4>
          {product.description && (
            <p className="text-[11px] text-white/75 mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() =>
            isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(wishlistItem)
          }
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
            isInWishlist(product.id) ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'
          }`}
          aria-label="Wishlist"
        >
          <Heart size={18} className={isInWishlist(product.id) ? 'fill-current' : ''} />
        </button>
        <span
          className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            inStock ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}
        >
          {inStock ? 'In stock' : 'Sold out'}
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="text-xs text-charcoal/70 dark:text-white/60 lowercase italic">Artist</p>
            <p className="font-bold text-sm dark:text-white/80">{product.artist}</p>
          </div>
          <p className="text-lg font-serif font-bold text-gold-dark">{product.price}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-charcoal/50 dark:text-white/40">Qty</span>
          <div className="flex items-center gap-1 rounded-full border border-gold/20 dark:border-white/10 p-0.5">
            <button
              type="button"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gold/10 disabled:opacity-30"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-bold">{qty}</span>
            <button
              type="button"
              disabled={qty >= maxQty}
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gold/10 disabled:opacity-30"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!inStock}
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-charcoal dark:bg-white/10 text-white text-[10px] uppercase font-bold tracking-widest hover:bg-charcoal/90 disabled:opacity-40 transition-all"
          >
            <ShoppingCart size={14} /> Add to cart
          </button>
          <button
            type="button"
            disabled={!inStock}
            onClick={onBuyNow}
            className="flex-1 py-2.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-gold-dark/10 hover:bg-gold-dark text-gold-dark hover:text-white disabled:opacity-40 transition-all"
          >
            Buy now
          </button>
        </div>
      </div>
    </motion.div>
  );
};
