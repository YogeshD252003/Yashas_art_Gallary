import React, { useState } from "react";
import { Smartphone, Sparkles, X, QrCode, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ARViewerProps {
  modelUrl: string;
  productName: string;
  usdzUrl?: string;
}

export const ARViewer: React.FC<ARViewerProps> = ({
  modelUrl,
  productName,
  usdzUrl = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Generate Google Scene Viewer intent link
  const getAndroidIntent = () => {
    const fallbackUrl = window.location.href;
    const sceneViewerUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(
      modelUrl
    )}&title=${encodeURIComponent(
      productName
    )}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(
      fallbackUrl
    )};end;`;
    return sceneViewerUrl;
  };

  // Generate iOS QuickLook link (requires .usdz file)
  const getIosQuickLook = () => {
    // If we have a usdzUrl, link to it directly, otherwise fallback to modelUrl (.glb) which is not ideal but acts as a trigger
    return usdzUrl || modelUrl;
  };

  return (
    <>
      {/* Premium AR Launch Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-gold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 group transition-all duration-300 shadow-lg hover:shadow-gold-500/20 active:scale-95 text-xs font-bold uppercase tracking-wider w-full"
      >
        <Smartphone className="group-hover:rotate-12 transition-transform" size={18} />
        <span>View In Your Space (AR)</span>
      </button>

      {/* AR Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-[#111115] rounded-[2.5rem] p-8 border border-gold-300/30 dark:border-white/10 shadow-2xl flex flex-col items-center text-center overflow-hidden"
            >
              {/* Background gradient glowing blob */}
              <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-gold-400/10 dark:bg-gold-500/5 blur-[50px] pointer-events-none" />

              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-charcoal dark:text-white rounded-full transition-all border border-stone-200/50 dark:border-white/5 cursor-pointer z-10"
              >
                <X size={16} />
              </button>

              <div className="w-16 h-16 bg-gold-100 dark:bg-gold/10 rounded-2xl flex items-center justify-center text-gold-dark mb-4 shadow-inner">
                <Smartphone size={32} className="animate-bounce" />
              </div>

              <h3 className="text-2xl font-serif font-bold text-charcoal dark:text-white mb-2">
                Experience in <span className="text-gradient-gold">Augmented Reality</span>
              </h3>
              <p className="text-xs text-charcoal/70 dark:text-white/60 mb-6 leading-relaxed px-4">
                Bring "{productName}" into your real physical environment. Stand in front of your room and place this masterpiece seamlessly.
              </p>

              {/* AR Options Selection */}
              <div className="w-full space-y-4">
                {/* Mobile view directly handles links */}
                <div className="block md:hidden space-y-3">
                  <a
                    href={getAndroidIntent()}
                    className="w-full py-3.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 border border-stone-200 dark:border-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest text-charcoal dark:text-white flex items-center justify-center gap-2.5 transition-all"
                  >
                    <Smartphone size={16} />
                    Android Scene Viewer
                  </a>

                  <a
                    href={getIosQuickLook()}
                    rel="ar"
                    className="w-full py-3.5 bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-700 hover:to-amber-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-lg shadow-gold-600/20 transition-all"
                  >
                    <Sparkles size={16} />
                    Apple QuickLook (iOS)
                  </a>
                </div>

                {/* Desktop View generates simulated QR Code to scan on mobile */}
                <div className="hidden md:flex flex-col items-center p-6 bg-stone-50 dark:bg-black/30 rounded-3xl border border-stone-200/50 dark:border-white/5 relative">
                  <div className="p-3 bg-white dark:bg-white/10 rounded-2xl border border-gold-300/30 shadow-inner mb-4">
                    {/* Render standard vector mock QR Code */}
                    <QrCode size={120} className="text-charcoal dark:text-white" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gold-dark mb-1">
                    <Monitor size={12} />
                    <span>Scan QR code with mobile</span>
                  </div>
                  <p className="text-[10px] text-charcoal/60 dark:text-white/40">
                    Supports Android ARCore & iOS QuickLook devices
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-1 bg-gold/10 px-3 py-1 rounded-full border border-gold/20 select-none">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-gold-dark">
                  Requires WebXR or ARCore compatible smartphone
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
