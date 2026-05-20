import React, { useState, useEffect } from "react";
import { Sparkles, Image, Video, Wand2, RefreshCw, Layers, CheckCircle2, Play, Eye, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MeshyAiService, LumaAiService, GalleryAiEnhancer, AiTaskResult } from "../services/aiServices";
import { Product3DViewer } from "../3d/Product3DViewer";

export const AIPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"image-to-3d" | "splat" | "remove-bg" | "auto-light">("image-to-3d");
  const [inputImage, setInputImage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [taskResult, setTaskResult] = useState<AiTaskResult | null>(null);
  const [previewModelUrl, setPreviewModelUrl] = useState<string | null>(null);

  // Auto-fill some preset images for demo convenience
  const presets = [
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&auto=format&fit=crop&q=80"
  ];

  useEffect(() => {
    // Reset state on tab change
    setInputImage(presets[0]);
    setIsProcessing(false);
    setProgress(0);
    setStatusLogs([]);
    setTaskResult(null);
    setPreviewModelUrl(null);
  }, [activeTab]);

  // Simulate Image-to-3D pipeline with polling
  const handleImageTo3d = async () => {
    if (!inputImage) return;
    setIsProcessing(true);
    setProgress(0);
    setStatusLogs(["Connecting to Meshy AI API server...", "Sending payload metadata..."]);
    setTaskResult(null);
    setPreviewModelUrl(null);

    try {
      const { taskId } = await MeshyAiService.generate3dFromImage(inputImage);
      
      let step = 0;
      const interval = setInterval(async () => {
        const result = await MeshyAiService.checkTaskStatus(taskId, step);
        setProgress(result.progress);
        
        if (result.logs) {
          setStatusLogs((prev) => [...prev, ...result.logs!]);
        }

        if (result.status === "completed") {
          clearInterval(interval);
          setTaskResult(result);
          setIsProcessing(false);
          setPreviewModelUrl(result.resultUrl || null);
          setStatusLogs((prev) => [...prev, "Sync completed successfully! Model cached in memory."]);
        } else {
          step += 1;
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  // Simulate NeRF Luma Volumetric Splatting
  const handleVolumetricSplat = async () => {
    setIsProcessing(true);
    setProgress(0);
    setStatusLogs(["Contacting Luma AI engine...", "Creating keyframe geometry..."]);
    setTaskResult(null);
    setPreviewModelUrl(null);

    try {
      const { taskId } = await LumaAiService.createInteractiveSplat([inputImage]);
      
      let step = 0;
      const interval = setInterval(async () => {
        const result = await LumaAiService.checkTaskStatus(taskId, step);
        setProgress(result.progress);
        
        if (result.logs) {
          setStatusLogs((prev) => [...prev, ...result.logs!]);
        }

        if (result.status === "completed") {
          clearInterval(interval);
          setTaskResult(result);
          setIsProcessing(false);
          setPreviewModelUrl(result.resultUrl || null);
          setStatusLogs((prev) => [...prev, "Luma AI synthesis completed! PBR textures baked."]);
        } else {
          step += 1;
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  // Simulate Background Removal
  const handleRemoveBackground = async () => {
    setIsProcessing(true);
    setProgress(30);
    setStatusLogs(["Extracting alpha channels...", "Masking boundary pixels..."]);

    try {
      const res = await GalleryAiEnhancer.removeBackground(inputImage);
      setProgress(100);
      setStatusLogs((prev) => [...prev, "Alpha mask processed successfully!", `Operation took ${res.durationMs}ms.`]);
      setTaskResult({
        taskId: "bg-remove",
        status: "completed",
        progress: 100,
        resultUrl: inputImage // visual mock reference
      });
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
    }
  };

  // Simulate Portfolio Lighting Enhancer
  const handleOptimizeLighting = async () => {
    setIsProcessing(true);
    setProgress(40);
    setStatusLogs(["Parsing image luminosity...", "Regulating high dynamic range ranges..."]);

    try {
      const res = await GalleryAiEnhancer.optimizeLighting(inputImage);
      setProgress(100);
      setStatusLogs((prev) => [...prev, "Specular highlights corrected!", `Illumination updated in ${res.durationMs}ms.`]);
      setTaskResult({
        taskId: "light-opt",
        status: "completed",
        progress: 100,
        resultUrl: inputImage
      });
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
    }
  };

  const handleAction = () => {
    if (activeTab === "image-to-3d") handleImageTo3d();
    if (activeTab === "splat") handleVolumetricSplat();
    if (activeTab === "remove-bg") handleRemoveBackground();
    if (activeTab === "auto-light") handleOptimizeLighting();
  };

  return (
    <div className="glass rounded-[2.5rem] border border-gold-300/20 dark:border-white/5 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
      
      {/* Sidebar navigation tabs */}
      <div className="w-full md:w-1/3 bg-black/5 dark:bg-black/25 border-b md:border-b-0 md:border-r border-gold-300/10 dark:border-white/5 p-6 flex flex-col gap-4">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-gold-dark mb-1 block">
            Intelligence Suite
          </span>
          <h3 className="text-xl font-serif font-bold text-charcoal dark:text-white">
            AI <span className="text-gradient-gold">Creative Lab</span>
          </h3>
        </div>

        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
          {(
            [
              { id: "image-to-3d", label: "2D to 3D GLB", desc: "Meshy AI Mesh Generator", icon: <Wand2 size={16} /> },
              { id: "splat", label: "Volumetric Splat", desc: "Luma AI Splatting NeRF", icon: <Layers size={16} /> },
              { id: "remove-bg", label: "Remove Background", desc: "AI Silhouette Mask", icon: <Image size={16} /> },
              { id: "auto-light", label: "Luxe Lighting", desc: "Luminance Portfolio Polish", icon: <Sparkles size={16} /> }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl text-left border transition-all flex-shrink-0 md:flex-shrink-1 min-w-[200px] md:min-w-0 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-gold-600/10 to-amber-500/15 border-gold-500/30 text-gold shadow-inner"
                  : "border-transparent text-charcoal/80 dark:text-white/60 hover:bg-white/5 hover:text-charcoal dark:hover:text-white"
              }`}
            >
              <div className={`p-2 rounded-xl ${activeTab === tab.id ? "bg-gold/20 text-gold-dark" : "bg-stone-100 dark:bg-white/5 text-charcoal/50 dark:text-white/40"}`}>
                {tab.icon}
              </div>
              <div>
                <p className="text-xs font-bold">{tab.label}</p>
                <p className="text-[9px] text-charcoal/50 dark:text-white/40 font-semibold uppercase tracking-wider mt-0.5">{tab.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Details / Playground work area */}
      <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 bg-gradient-to-b from-white/40 to-gold-100/5 dark:from-transparent dark:to-transparent">
        
        {/* Upper work area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Source Image Selector */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-charcoal/50 dark:text-white/40">
              Input Asset Reference
            </span>
            <div className="border border-gold-300/20 dark:border-white/5 rounded-3xl overflow-hidden aspect-square md:aspect-[4/3] bg-stone-100 dark:bg-black/30 flex items-center justify-center relative group p-3">
              <img src={inputImage} alt="Input source" className="max-h-full max-w-full object-contain rounded-2xl drop-shadow-xl" />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                  <RefreshCw className="animate-spin text-gold mb-3" size={32} />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Synthesizing Asset...</span>
                  <span className="text-2xl font-black text-gold-dark mt-1">{progress}%</span>
                </div>
              )}
            </div>
            
            {/* Presets Toggle */}
            <div className="flex gap-2.5 justify-center mt-1">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputImage(preset)}
                  disabled={isProcessing}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                    inputImage === preset ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          </div>

          {/* Operation Status Log */}
          <div className="flex flex-col gap-3 self-stretch">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-charcoal/50 dark:text-white/40">
              AI Console & Logs
            </span>
            <div className="flex-1 bg-stone-900 text-stone-300 p-5 rounded-3xl border border-stone-800 font-mono text-[10px] overflow-y-auto space-y-2 select-none h-[220px] shadow-inner">
              {statusLogs.length === 0 ? (
                <p className="text-stone-500 italic">// Setup asset and click run to ignite AI worker pipeline.</p>
              ) : (
                statusLogs.map((log, idx) => (
                  <p key={idx} className="leading-relaxed">
                    <span className="text-gold-dark select-none">&gt;&gt;</span> {log}
                  </p>
                ))
              )}
            </div>

            <button
              onClick={handleAction}
              disabled={isProcessing || !inputImage}
              className={`w-full py-4 rounded-2xl text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all duration-300 ${
                isProcessing
                  ? "bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/5 text-stone-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-700 hover:to-amber-600 border-transparent text-white shadow-lg shadow-gold-600/20 active:scale-95 cursor-pointer"
              }`}
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
              <span>Execute {activeTab.replace("-", " ")}</span>
            </button>
          </div>
        </div>

        {/* Lower Preview Area */}
        <AnimatePresence>
          {taskResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 text-emerald-800 dark:text-emerald-300 shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <CheckCircle2 className="text-emerald-500 flex-shrink-0 animate-pulse" size={24} />
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider">Synthesis Completed!</p>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 font-medium">
                    TaskId: {taskResult.taskId} 
                    {taskResult.metrics && ` • Time: ${taskResult.metrics.processingTimeMs}ms • Polys: ${taskResult.metrics.polygonsCount}`}
                  </p>
                </div>
              </div>

              {previewModelUrl && (
                <button
                  onClick={() => setPreviewModelUrl(previewModelUrl)}
                  className="px-5 py-2.5 bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-700 hover:to-amber-600 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-gold-600/20 transition-all cursor-pointer active:scale-95 z-20"
                >
                  <Eye size={12} />
                  <span>Inspect Live 3D Model</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating 3D preview within Lab if clicked */}
        <AnimatePresence>
          {previewModelUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mt-4 border border-gold-400/20 dark:border-white/5 rounded-[2.5rem] overflow-hidden bg-black aspect-video relative min-h-[350px]"
            >
              <Product3DViewer modelUrl={previewModelUrl} autoRotateDefault={true} />
              
              <div className="absolute top-4 left-6 pointer-events-none select-none opacity-40 font-serif text-sm tracking-wider text-white italic font-bold">
                Live AI Mesh Preview
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
