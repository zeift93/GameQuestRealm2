import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Preload } from "@react-three/drei";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { controlsMap } from "./lib/Controls";
import { GameUI } from "./components/ui/game-ui";
import GameMap from "./components/game/GameMap";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Toaster } from "sonner";
import Tutorial from "./components/game/Tutorial";
import { useGame } from "./lib/stores/useGame";
import CardBattle from "./components/game/CardBattle";
import CardCollection from "./components/game/CardCollection";
import { TooltipProvider } from "@/components/ui/tooltip";

// Main loading component
const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-2xl font-bold text-primary">Loading Game Assets...</h2>
    </div>
  );
};

function App() {
  const [appReady, setAppReady] = useState(false);
  const { setBackgroundMusic, toggleMute } = useAudio();
  const { phase, view } = useGame();
  
  // Load background music
  useEffect(() => {
    // Remove initial loading screen when app component mounts
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
    
    // Load and setup background music
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.4;
    setBackgroundMusic(bgMusic);
    
    // Load sound effects
    const hitSound = new Audio("/sounds/hit.mp3");
    hitSound.volume = 0.5;
    
    const successSound = new Audio("/sounds/success.mp3");
    successSound.volume = 0.6;
    
    // Start with app ready
    setAppReady(true);
    
    // Auto-play background music on user interaction (required by browsers)
    const handleUserInteraction = () => {
      bgMusic.play().catch(e => console.log("Music play prevented:", e));
      toggleMute(); // Unmute sounds on first interaction
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
    
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);
    
    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
      bgMusic.pause();
    };
  }, []);

  if (!appReady) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <KeyboardControls map={controlsMap}>
          {/* Game world */}
          <Canvas
            shadows
            camera={{
              position: [0, 10, 12],
              fov: 45,
              near: 0.1,
              far: 1000
            }}
            gl={{
              antialias: true,
              powerPreference: "default"
            }}
          >
            <color attach="background" args={["#0a0a18"]} />
            
            {/* Post-processing effects */}
            <EffectComposer>
              <Bloom intensity={0.5} luminanceThreshold={0.9} luminanceSmoothing={0.9} />
              <Vignette darkness={0.5} offset={0.1} />
            </EffectComposer>
            
            <Suspense fallback={null}>
              <Preload all />
              {/* Show game map when in world view mode */}
              {(view === 'world' || view === 'pack_opening') && <GameMap />}
              
              {/* Show battle scene when in battle mode */}
              {view === 'battle' && <CardBattle />}
              
              {/* Show collection view when in collection mode */}
              {view === 'collection' && <CardCollection />}
            </Suspense>
            
          </Canvas>
          
          {/* User Interface */}
          <GameUI />
          
          {/* Tutorial overlay - shown during tutorial phase */}
          {phase === 'tutorial' && <Tutorial />}
          
          {/* Toast notifications */}
          <Toaster position="top-center" richColors closeButton />
        </KeyboardControls>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
