import React, { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  OrbitControls, 
  Stage, 
  Environment, 
  useGLTF, 
  useProgress,
  Html,
  PerspectiveCamera
} from "@react-three/drei";
import { Loader2, RefreshCw, Compass, Sun, Eye, Award } from "lucide-react";

// --- Loading Component ---
const ModelLoader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-black/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-gold-500/20 text-white min-w-[180px] shadow-2xl z-50">
        <Loader2 className="animate-spin text-gold-dark mb-3" size={32} />
        <p className="text-xs font-bold tracking-widest uppercase">Syncing Mesh</p>
        <p className="text-xl font-extrabold text-gold-dark mt-1">{Math.round(progress)}%</p>
        <div className="w-full bg-white/10 h-1 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-gold-600 to-amber-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  );
};

// --- Lighting & Environment Preset ---
interface LightingProps {
  preset: "studio" | "sunset" | "neon" | "hdr";
}

const LightingAndEnv: React.FC<LightingProps> = ({ preset }) => {
  return (
    <>
      {preset === "studio" && (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={1.2} 
            castShadow 
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        </>
      )}

      {preset === "sunset" && (
        <>
          <ambientLight intensity={0.3} color="#2b1b54" />
          {/* Main Sunset Key Light */}
          <directionalLight 
            position={[8, 4, 5]} 
            intensity={2.0} 
            color="#ff7b00" 
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          {/* Soft twilight fill light */}
          <directionalLight position={[-8, 2, -5]} intensity={0.6} color="#9000ff" />
        </>
      )}

      {preset === "neon" && (
        <>
          <ambientLight intensity={0.2} />
          {/* Cyberpunk Neon Pink Light */}
          <directionalLight 
            position={[6, 3, 4]} 
            intensity={2.5} 
            color="#ff007f" 
            castShadow 
          />
          {/* Cyberpunk Neon Cyan Light */}
          <directionalLight 
            position={[-6, 2, -4]} 
            intensity={2.5} 
            color="#00f2fe" 
          />
          <pointLight position={[0, 4, 0]} intensity={1.5} color="#bd00ff" />
        </>
      )}

      {preset === "hdr" && (
        <>
          <ambientLight intensity={0.4} />
          <Environment preset="city" />
        </>
      )}
    </>
  );
};

// --- 3D Model Handler ---
interface ModelProps {
  url: string;
  variant: any; // selected color/material variant
  autoRotate: boolean;
  onMeshLoaded?: () => void;
}

const Model: React.FC<ModelProps> = ({ url, variant, autoRotate, onMeshLoaded }) => {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  // Auto Rotation loop
  useFrame((state) => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    }
  });

  useEffect(() => {
    if (onMeshLoaded) {
      onMeshLoaded();
    }
  }, [url, onMeshLoaded]);

  // Handle color & PBR variant changes dynamically on traversal
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          // Clone material to avoid mutating other cached instances
          child.material = child.material.clone();
          
          if (variant) {
            if (variant.color) {
              child.material.color.set(variant.color);
            }
            if (variant.metalness !== undefined) {
              child.material.metalness = variant.metalness;
            }
            if (variant.roughness !== undefined) {
              child.material.roughness = variant.roughness;
            }
          }
        }
      }
    });
  }, [scene, variant]);

  return <primitive ref={modelRef} object={scene} scale={1.2} position={[0, -0.5, 0]} />;
};

// --- Main Immersive 3D Viewer ---
interface Product3DViewerProps {
  modelUrl: string;
  selectedVariant?: any;
  autoRotateDefault?: boolean;
  environmentPresetDefault?: "studio" | "sunset" | "neon" | "hdr";
}

export const Product3DViewer: React.FC<Product3DViewerProps> = ({
  modelUrl,
  selectedVariant = null,
  autoRotateDefault = false,
  environmentPresetDefault = "studio"
}) => {
  const [autoRotate, setAutoRotate] = useState(autoRotateDefault);
  const [lightPreset, setLightPreset] = useState<"studio" | "sunset" | "neon" | "hdr">(environmentPresetDefault);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [backgroundScene, setBackgroundScene] = useState<"transparent" | "cyber" | "luxe">("transparent");
  const viewerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);

  // Reset Camera View
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Toggle Fullscreen Mode
  const toggleFullscreen = () => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Fullscreen error", err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  // Set Background styles
  const getBackgroundClass = () => {
    if (backgroundScene === "cyber") {
      return "bg-[#050508] bg-[radial-gradient(circle_at_center,rgba(189,0,255,0.06)_0%,rgba(0,0,0,1)_80%)]";
    }
    if (backgroundScene === "luxe") {
      return "bg-gradient-to-br from-[#FAF8F5] via-[#EBE2D0] to-[#C49A28]/10 dark:from-[#111] dark:via-[#1a1a1a] dark:to-[#C49A28]/5";
    }
    return "bg-transparent";
  };

  return (
    <div 
      ref={viewerRef}
      className={`relative w-full h-full rounded-[2.5rem] overflow-hidden border border-gold-300/20 dark:border-white/5 shadow-2xl transition-all duration-500 ${getBackgroundClass()} ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "aspect-square md:aspect-[4/3] min-h-[380px]"
      }`}
    >
      {/* 3D Canvas */}
      <Canvas shadows eventSource={document.getElementById("root") || undefined} eventPrefix="client">
        <PerspectiveCamera makeDefault position={[0, 1.5, 4.5]} fov={45} />
        
        <LightingAndEnv preset={lightPreset} />

        <Suspense fallback={<ModelLoader />}>
          <Stage 
            environment={lightPreset === "hdr" ? undefined : "city"} 
            intensity={0.5} 
            contactShadow={{ blur: 2, opacity: 0.6, pitch: 0.8 }}
            adjustCamera={false}
          >
            <Model 
              url={modelUrl} 
              variant={selectedVariant} 
              autoRotate={autoRotate} 
            />
          </Stage>
        </Suspense>

        <OrbitControls 
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={12}
          makeDefault
        />
      </Canvas>

      {/* Futuristic Floating Controls HUD */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center items-center gap-2 px-6 py-3.5 bg-black/60 dark:bg-black/75 backdrop-blur-xl rounded-[2rem] border border-gold-400/20 dark:border-white/10 shadow-2xl max-w-[90%] z-20">
        
        {/* Auto Rotate Toggle */}
        <button 
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
            autoRotate 
              ? "bg-gradient-to-r from-gold-600 to-amber-500 text-white shadow-lg shadow-gold-600/30" 
              : "bg-white/10 text-white/80 hover:bg-white/20"
          }`}
          title="Auto Rotate"
        >
          <RefreshCw size={12} className={autoRotate ? "animate-spin" : ""} />
          <span>Spin</span>
        </button>

        {/* Reset Camera */}
        <button 
          onClick={handleResetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 hover:bg-white/20 transition-all"
          title="Reset Camera"
        >
          <Compass size={12} />
          <span>Reset</span>
        </button>

        {/* Lighting Selector */}
        <div className="h-4 w-[1px] bg-white/20 mx-1" />
        
        <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          {(["studio", "sunset", "neon", "hdr"] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setLightPreset(preset)}
              className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest transition-all ${
                lightPreset === preset 
                  ? "bg-gold-500/20 text-gold shadow-inner border border-gold/30" 
                  : "text-white/60 hover:text-white"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Scene Background Selector */}
        <div className="h-4 w-[1px] bg-white/20 mx-1" />

        <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          {(["transparent", "cyber", "luxe"] as const).map((bg) => (
            <button
              key={bg}
              onClick={() => setBackgroundScene(bg)}
              className={`w-4 h-4 rounded-full border transition-all ${
                bg === "transparent" ? "bg-white/10 border-white/25" :
                bg === "cyber" ? "bg-[#090911] border-cyan-400/50" :
                "bg-[#d4a92c] border-gold-200/50"
              } ${backgroundScene === bg ? "scale-115 ring-2 ring-gold" : "opacity-60 hover:opacity-100"}`}
              title={`Style: ${bg}`}
            />
          ))}
        </div>

        {/* Fullscreen Button */}
        <button 
          onClick={toggleFullscreen}
          className="ml-1 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          title="Fullscreen"
        >
          <Eye size={12} />
        </button>
      </div>

      {/* Watermark Protection Overlay */}
      <div className="absolute top-4 left-6 pointer-events-none opacity-20 dark:opacity-15 select-none font-serif text-sm tracking-wider dark:text-white text-charcoal italic font-bold">
        Yashas Art Gallery
      </div>

      {/* Touch Swipe helper gesture indicator */}
      <div className="absolute top-4 right-6 flex items-center gap-1.5 opacity-40 text-[9px] uppercase font-bold tracking-widest pointer-events-none select-none text-charcoal dark:text-white">
        <Sun size={10} className="animate-pulse" />
        <span>3D Drag To Orbit</span>
      </div>

      {/* Premium Download-Disabled Safeguard Shield */}
      <div className="absolute inset-0 bg-transparent pointer-events-none border-[12px] border-transparent rounded-[2.5rem] shadow-[inset_0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_80px_rgba(255,255,255,0.02)]" />
    </div>
  );
};
