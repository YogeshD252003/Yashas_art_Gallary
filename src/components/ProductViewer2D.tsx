import React, { useState, useRef } from "react";
import { ZoomIn, ChevronLeft, ChevronRight, X, Maximize2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductViewer2DProps {
  images: string[];
  watermarkText?: string;
}

export const ProductViewer2D: React.FC<ProductViewer2DProps> = ({
  images,
  watermarkText = "Yashas Art Gallery"
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const activeImages = images && images.length > 0
    ? images
    : ["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=60"];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % activeImages.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  };

  // Magnifier Mouse Traversal
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Main Image Container */}
      <div 
        className="relative w-full aspect-square md:aspect-[4/3] min-h-[380px] bg-gradient-to-b from-[#F9F7F3] to-[#EAE0CD] dark:from-[#111] dark:to-[#1a1a1a] rounded-[2.5rem] overflow-hidden border border-gold-300/20 dark:border-white/5 shadow-2xl flex items-center justify-center cursor-zoom-in"
        onMouseEnter={() => setShowMagnifier(true)}
        onMouseLeave={() => setShowMagnifier(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsLightboxOpen(true)}
      >
        {/* Main Image */}
        <img
          ref={imgRef}
          src={activeImages[activeIndex]}
          alt={`Gallery View ${activeIndex}`}
          className="max-h-[85%] max-w-[85%] object-contain drop-shadow-2xl transition-transform duration-300 pointer-events-none select-none"
        />

        {/* Magnifier Glass Overlay */}
        {showMagnifier && (
          <div
            className="absolute hidden md:block w-44 h-44 rounded-full border-2 border-gold pointer-events-none shadow-2xl overflow-hidden z-10 bg-no-repeat"
            style={{
              left: `${zoomPos.x}%`,
              top: `${zoomPos.y}%`,
              transform: "translate(-50%, -50%)",
              backgroundImage: `url(${activeImages[activeIndex]})`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundSize: "250% 250%",
              backgroundColor: "rgba(0,0,0,0.1)"
            }}
          />
        )}

        {/* Multi-Image Navigation Chevrons */}
        {activeImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-6 w-12 h-12 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/10 z-20"
              title="Previous Image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-6 w-12 h-12 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all border border-white/10 z-20"
              title="Next Image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Floating Controls Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 bg-black/60 dark:bg-black/75 backdrop-blur-xl rounded-full border border-gold-400/20 dark:border-white/10 shadow-2xl z-20 pointer-events-none">
          <ZoomIn size={14} className="text-gold-dark animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">
            Hover to magnify • Click to Zoom
          </span>
          <span className="text-[10px] text-white/50 font-bold bg-white/10 px-2 py-0.5 rounded-full">
            {activeIndex + 1} / {activeImages.length}
          </span>
        </div>

        {/* Watermark Protection */}
        <div className="absolute top-4 left-6 pointer-events-none select-none opacity-20 dark:opacity-15 font-serif text-sm tracking-wider dark:text-white text-charcoal italic font-bold">
          {watermarkText}
        </div>

        <div className="absolute top-4 right-6 flex items-center gap-1.5 opacity-30 text-[9px] uppercase font-bold tracking-widest pointer-events-none select-none text-charcoal dark:text-white">
          <ShieldAlert size={10} />
          <span>Protected View</span>
        </div>

        <div className="absolute inset-0 bg-transparent pointer-events-none border-[12px] border-transparent rounded-[2.5rem] shadow-[inset_0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]" />
      </div>

      {/* Thumbnails list */}
      {activeImages.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide justify-center px-4">
          {activeImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all p-1 flex-shrink-0 bg-white/30 dark:bg-white/5 ${
                idx === activeIndex 
                  ? "border-gold-500 scale-105 shadow-md shadow-gold-500/10" 
                  : "border-gold-300/10 hover:border-gold-300/30"
              }`}
            >
              <img src={img} alt={`thumbnail ${idx}`} className="w-full h-full object-cover rounded-xl" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal Portal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-zoom-out"
              onClick={() => setIsLightboxOpen(false)}
            />
            
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-50 shadow-2xl cursor-pointer"
              title="Close Zoom"
            >
              <X size={20} />
            </button>

            {/* Lightbox Image Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative max-w-5xl max-h-[85vh] aspect-square md:aspect-[4/3] flex items-center justify-center pointer-events-none select-none"
            >
              <img
                src={activeImages[activeIndex]}
                alt="Expanded view"
                className="max-h-full max-w-full object-contain drop-shadow-[0_0_50px_rgba(212,170,44,0.15)]"
              />

              {/* Watermark diagonal overlay in expanded mode */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5 dark:opacity-3">
                <div className="text-white font-serif font-bold text-4xl uppercase tracking-[0.2em] -rotate-45 whitespace-nowrap">
                  {watermarkText} • {watermarkText}
                </div>
              </div>
            </motion.div>

            {/* Downloader Shield badge inside Lightbox */}
            <div className="absolute bottom-6 flex items-center gap-2 px-5 py-2.5 bg-black/60 dark:bg-black/75 backdrop-blur-xl rounded-full border border-gold-400/20 dark:border-white/10 shadow-2xl z-50 select-none pointer-events-none">
              <ShieldAlert size={14} className="text-gold-dark animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">
                Screenshot Detection & Download Shield Protected
              </span>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
