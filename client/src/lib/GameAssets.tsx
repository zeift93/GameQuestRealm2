import { useState, useEffect } from 'react';
import { toast } from "sonner";

// Preload manager to ensure assets are ready before gameplay
export const useAssetPreloader = () => {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let loadedCount = 0;
    let totalAssets = 0;
    
    const updateProgress = () => {
      loadedCount++;
      const progress = Math.min(100, Math.floor((loadedCount / totalAssets) * 100));
      setLoadingProgress(progress);
      
      if (loadedCount >= totalAssets) {
        setAssetsLoaded(true);
      }
    };
    
    const preloadAudio = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.addEventListener('canplaythrough', () => {
          updateProgress();
          resolve();
        }, { once: true });
        audio.addEventListener('error', (err) => {
          console.error(`Failed to load audio: ${src}`, err);
          updateProgress(); // Still count it to avoid hanging
          reject(err);
        });
        audio.src = src;
        audio.load();
      });
    };
    
    const preloadTexture = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          updateProgress();
          resolve();
        };
        img.onerror = (err) => {
          console.error(`Failed to load texture: ${src}`, err);
          updateProgress(); // Still count it to avoid hanging
          reject(err);
        };
        img.src = src;
      });
    };
    
    const loadAssets = async () => {
      // Define assets to preload
      const audioAssets = [
        '/sounds/background.mp3',
        '/sounds/hit.mp3',
        '/sounds/success.mp3'
      ];
      
      const textureAssets = [
        '/textures/asphalt.png',
        '/textures/grass.png', 
        '/textures/sand.jpg',
        '/textures/sky.png',
        '/textures/wood.jpg'
      ];
      
      totalAssets = audioAssets.length + textureAssets.length;
      
      try {
        // Create promises for all assets
        const audioPromises = audioAssets.map(src => preloadAudio(src));
        const texturePromises = textureAssets.map(src => preloadTexture(src));
        
        // Load all assets in parallel
        await Promise.all([...audioPromises, ...texturePromises]);
        
        console.log('All assets loaded successfully');
      } catch (error) {
        console.error('Error loading assets:', error);
        toast.error('Some game assets failed to load');
      }
    };
    
    loadAssets();
  }, []);
  
  return { assetsLoaded, loadingProgress };
};

// Card back designs - SVG patterns for card backs
export const cardBackPatterns = {
  standard: (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 150">
      <rect width="100%" height="100%" fill="#1a1a2e" />
      <circle cx="50" cy="75" r="30" fill="#4a3f85" />
      <path d="M50 45 L70 75 L50 105 L30 75 Z" fill="#7e57c2" />
      <circle cx="50" cy="75" r="15" fill="#1a1a2e" />
      <circle cx="50" cy="75" r="7" fill="#8b5cf6" />
      
      {/* Small decorative elements */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const x = 50 + Math.cos(angle) * 40;
        const y = 75 + Math.sin(angle) * 40;
        return <circle key={i} cx={x} cy={y} r="3" fill="#8b5cf6" opacity="0.6" />;
      })}
    </svg>
  ),

  elemental: (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 150">
      <rect width="100%" height="100%" fill="#1e293b" />
      {/* Flame pattern */}
      <path d="M30 130 Q40 100 30 80 Q40 90 50 70 Q60 90 70 80 Q60 100 70 130 Z" fill="#f97316" opacity="0.7" />
      {/* Water pattern */}
      <path d="M20 20 Q30 30 50 20 Q70 30 80 20 Q70 40 80 60 Q50 50 20 60 Q30 40 20 20 Z" fill="#3b82f6" opacity="0.7" />
      {/* Wind swirls */}
      <path d="M10 80 Q30 75 40 90 Q50 95 60 90 Q70 75 90 80" stroke="#a1a1aa" strokeWidth="2" fill="transparent" />
      <path d="M10 70 Q30 65 40 80 Q50 85 60 80 Q70 65 90 70" stroke="#a1a1aa" strokeWidth="2" fill="transparent" />
    </svg>
  ),

  royal: (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 150">
      <rect width="100%" height="100%" fill="#581c87" />
      {/* Crown symbol */}
      <path d="M30 60 L40 40 L50 60 L60 40 L70 60 L75 50 L75 70 L25 70 L25 50 L30 60 Z" fill="#ffd700" />
      
      {/* Decorative borders */}
      <rect x="10" y="10" width="80" height="130" stroke="#ffd700" strokeWidth="2" fill="none" />
      <rect x="15" y="15" width="70" height="120" stroke="#ffd700" strokeWidth="1" fill="none" />
      
      {/* Corner flourishes */}
      <path d="M10 10 Q20 20 30 10" stroke="#ffd700" strokeWidth="2" fill="none" />
      <path d="M90 10 Q80 20 70 10" stroke="#ffd700" strokeWidth="2" fill="none" />
      <path d="M10 140 Q20 130 30 140" stroke="#ffd700" strokeWidth="2" fill="none" />
      <path d="M90 140 Q80 130 70 140" stroke="#ffd700" strokeWidth="2" fill="none" />
    </svg>
  )
};

// Game title logo (SVG)
export const GameLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80">
    <defs>
      <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7e57c2" />
        <stop offset="100%" stopColor="#4a3f85" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Background shape */}
    <rect width="300" height="80" rx="10" fill="#1a1a2e" />
    
    {/* Main title */}
    <text x="150" y="35" fontSize="28" fontWeight="bold" fill="url(#titleGradient)" 
          textAnchor="middle" filter="url(#glow)">
      MYSTIC REALM
    </text>
    
    {/* Subtitle */}
    <text x="150" y="60" fontSize="18" fontWeight="500" fill="#a78bfa" 
          textAnchor="middle">
      CARD MASTERS
    </text>
    
    {/* Decorative elements */}
    <path d="M30 40 L50 25 L70 40 L50 55 Z" fill="#8b5cf6" opacity="0.7" />
    <path d="M230 40 L250 25 L270 40 L250 55 Z" fill="#8b5cf6" opacity="0.7" />
  </svg>
);

// UI Icons as SVG for consistent styling
export const Icons = {
  Health: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#ef4444" />
    </svg>
  ),
  
  Mana: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="#3b82f6" />
    </svg>
  ),
  
  Power: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" fill="#f97316" />
      <path d="M6 3a3 3 0 0 1 3 3v12a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" fill="#f97316" />
      <path d="M13 21h-2a9 9 0 0 1-9-9V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v7a9 9 0 0 1-9 9z" fill="#f97316" opacity="0.3" />
    </svg>
  ),
  
  Deck: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="16" height="16" rx="2" ry="2" fill="#8b5cf6" opacity="0.3" />
      <rect x="6" y="3" width="16" height="16" rx="2" ry="2" fill="#8b5cf6" opacity="0.6" />
    </svg>
  )
};

// Helper functions for color manipulation
export const colorUtils = {
  // Lighten a hex color
  lighten: (color: string, percent: number): string => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return `#${(
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    ).toString(16).slice(1)}`;
  },
  
  // Darken a hex color
  darken: (color: string, percent: number): string => {
    return colorUtils.lighten(color, -percent);
  },
  
  // Get a contrasting text color (black or white) based on background
  getContrastText: (hexcolor: string): string => {
    // Remove the # if present
    hexcolor = hexcolor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    
    // Calculate luminance (perceived brightness)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white for dark colors, black for light ones
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
};
