import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface ImageGalleryProps {
  images: string[]; // array of image URLs
}

/**
 * Simple responsive image gallery with modal preview.
 * Uses Framer Motion for smooth fade/scale transitions.
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {images.map((src, idx) => (
        <motion.img
          key={idx}
          src={src}
          alt={`gallery-${idx}`}
          className="w-full h-40 object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform"
          whileHover={{ scale: 1.03 }}
          onClick={() => setSelected(src)}
        />
      ))}

      {selected && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelected(null)}
        >
          <motion.img
            src={selected}
            alt="preview"
            className="max-w-full max-h-full rounded-xl"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
          <button
            className="absolute top-6 right-6 text-white hover:text-gold-300 transition-colors"
            onClick={() => setSelected(null)}
          >
            <X size={28} />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ImageGallery;
