import React, { useState, useRef, useEffect } from "react";
import { MoveHorizontal, Eye, ShieldAlert } from "lucide-react";

interface SpinViewer360Props {
  images: string[];
  watermarkText?: string;
}

export const SpinViewer360: React.FC<SpinViewer360Props> = ({
  images,
  watermarkText = "Yashas Art Gallery"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startIndex = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback to a single placeholder if images list is empty
  const activeImages = images && images.length > 0 
    ? images 
    : ["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=60"];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    startIndex.current = currentIndex;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const deltaX = e.clientX - startX.current;
    const width = containerRef.current.offsetWidth;
    
    // Sensitivity: how many pixels of drag represents switching to the next image
    const sensitivity = 15;
    const shift = Math.floor(deltaX / sensitivity);
    
    // Wrap index around boundaries
    const total = activeImages.length;
    let newIndex = (startIndex.current - shift) % total;
    if (newIndex < 0) {
      newIndex += total;
    }
    
    setCurrentIndex(newIndex);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    startIndex.current = currentIndex;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const deltaX = e.touches[0].clientX - startX.current;
    const sensitivity = 12; // slightly more sensitive on touch
    const shift = Math.floor(deltaX / sensitivity);
    
    const total = activeImages.length;
    let newIndex = (startIndex.current - shift) % total;
    if (newIndex < 0) {
      newIndex += total;
    }
    
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, currentIndex]);

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      className="relative w-full aspect-square md:aspect-[4/3] min-h-[380px] bg-gradient-to-b from-[#F9F7F3] to-[#EAE0CD] dark:from-[#111] dark:to-[#1a1a1a] rounded-[2.5rem] overflow-hidden border border-gold-300/20 dark:border-white/5 shadow-2xl flex items-center justify-center cursor-ew-resize select-none"
    >
      {/* Active Image Render */}
      <img 
        src={activeImages[currentIndex]} 
        alt={`Product Spin ${currentIndex}`} 
        className="max-h-[85%] max-w-[85%] object-contain drop-shadow-2xl transition-transform duration-200 pointer-events-none select-none"
        draggable={false}
      />

      {/* Floating HUD controls for 360 Spin */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 bg-black/60 dark:bg-black/75 backdrop-blur-xl rounded-full border border-gold-400/20 dark:border-white/10 shadow-2xl z-20 pointer-events-none">
        <MoveHorizontal size={14} className="text-gold-dark animate-pulse" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">
          Drag horizontally to spin 360°
        </span>
        <span className="text-[10px] text-white/50 font-bold bg-white/10 px-2 py-0.5 rounded-full">
          {currentIndex + 1} / {activeImages.length}
        </span>
      </div>

      {/* Anti-screenshot Watermark protection overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5 dark:opacity-3">
        <div className="text-charcoal dark:text-white font-serif font-bold text-3xl uppercase tracking-widest -rotate-45 whitespace-nowrap">
          {watermarkText} • {watermarkText}
        </div>
      </div>

      {/* Watermark overlay top left */}
      <div className="absolute top-4 left-6 pointer-events-none select-none opacity-25 dark:opacity-15 font-serif text-sm tracking-wider dark:text-white text-charcoal italic font-bold">
        Yashas 360° Spin
      </div>

      {/* Download Disabled Shield Alert */}
      <div className="absolute top-4 right-6 flex items-center gap-1.5 opacity-30 text-[9px] uppercase font-bold tracking-widest pointer-events-none select-none text-charcoal dark:text-white">
        <Eye size={10} />
        <span>Protected View</span>
      </div>

      {/* Safeguard Shadow inner ring */}
      <div className="absolute inset-0 bg-transparent pointer-events-none border-[12px] border-transparent rounded-[2.5rem] shadow-[inset_0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]" />
    </div>
  );
};
