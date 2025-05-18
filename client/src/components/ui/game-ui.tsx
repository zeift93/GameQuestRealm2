import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGame } from "@/lib/stores/useGame";
import { useAudio } from "@/lib/stores/useAudio";
import { useCharacter } from "@/lib/stores/useCharacter";
import { useCards } from "@/lib/stores/useCards";
import { useBattle } from "@/lib/stores/useBattle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useKeyboardControls } from "@react-three/drei";
import { Controls } from "@/lib/Controls";
import { toast } from "sonner";
import {
  FaVolumeUp,
  FaVolumeMute,
  FaQuestion,
  FaSlidersH,
  FaArrowLeft,
  FaList,
  FaGamepad,
  FaFistRaised,
  FaTimes,
  FaUser,
  FaBookOpen,
} from "react-icons/fa";

// Shortcut Button component
const ShortcutButton = ({ 
  icon, 
  label, 
  onClick,
  keyShortcut,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  keyShortcut?: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-lg bg-background/80 backdrop-blur border-primary/20"
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label} {keyShortcut && <span className="text-xs opacity-70">({keyShortcut})</span>}</p>
      </TooltipContent>
    </Tooltip>
  );
};

// Card display for battle UI
const BattleCardItem = ({ card, active = false, onClick }: any) => {
  return (
    <div
      className={`relative w-24 h-36 rounded-md overflow-hidden cursor-pointer transition-all duration-200 transform ${
        active ? 'scale-110 ring-2 ring-primary' : 'hover:scale-105'
      }`}
      onClick={onClick}
    >
      <div 
        className="absolute inset-0" 
        style={{ backgroundColor: card.color }}
      />
      <div className="absolute inset-0 flex flex-col p-1 text-white">
        <div className="text-xs font-semibold truncate">{card.name}</div>
        <div className="flex-grow flex items-center justify-center">
          <div className="text-2xl font-bold">⚔️{card.power}</div>
        </div>
        <div className="text-xs truncate">{card.type}</div>
      </div>
    </div>
  );
};

export const GameUI = () => {
  const { phase, view, setView, startTutorial } = useGame();
  const { isMuted, toggleMute } = useAudio();
  const { position, level, experience, nextLevelExperience } = useCharacter();
  const { cards, selectedCardIndex, selectCard } = useCards();
  const { battleState, playerCards, enemyCards, activeCard, playCard, startNewBattle } = useBattle();
  const [, getControls] = useKeyboardControls<Controls>();
  
  // UI States
  const [showMenu, setShowMenu] = useState(false);
  
  // Mobile controls state
  const [touchStartPos, setTouchStartPos] = useState<{ x: number, y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view === 'world') {
        // World view shortcuts
        if (e.key === 'c' || e.key === 'C') {
          setView('collection');
        } else if (e.key === 'm' || e.key === 'M') {
          toggleMute();
        } else if (e.key === 'h' || e.key === 'H') {
          startTutorial();
        }
      } else if (view === 'collection') {
        // Collection view shortcuts
        if (e.key === 'Escape') {
          setView('world');
        }
      } else if (view === 'battle') {
        // Battle view shortcuts
        if (e.key === '1' || e.key === '2' || e.key === '3') {
          const cardIndex = parseInt(e.key) - 1;
          if (cardIndex >= 0 && cardIndex < playerCards.length) {
            playCard(cardIndex);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, playerCards]);
  
  // Mobile touch controls for movement
  const handleTouchStart = (e: React.TouchEvent) => {
    if (view !== 'world') return;
    setTouchStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos || view !== 'world') return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const deltaX = touchX - touchStartPos.x;
    const deltaY = touchY - touchStartPos.y;
    
    // Determine swipe direction if movement is significant
    const threshold = 20;
    
    // Check if the swipe is more horizontal or vertical
    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      e.preventDefault(); // Prevent scrolling when swiping
      
      // Update the controls state based on swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > threshold) {
          // Swipe right
          document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
        } else if (deltaX < -threshold) {
          // Swipe left
          document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));
        }
      } else {
        // Vertical swipe
        if (deltaY > threshold) {
          // Swipe down
          document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
        } else if (deltaY < -threshold) {
          // Swipe up
          document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
        }
      }
    }
  };
  
  const handleTouchEnd = () => {
    setTouchStartPos(null);
    
    // Reset all movement keys
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA' }));
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }));
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
  };
  
  // World View HUD
  if (view === 'world' || view === 'pack_opening') {
    return (
      <>
        {/* Touch area for mobile controls */}
        {isMobile && (
          <div 
            className="fixed inset-0 z-10 touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}
        
        {/* Top HUD - Player info */}
        <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
          <Card className="p-3 bg-background/80 backdrop-blur border-primary/20">
            <div className="flex items-center space-x-2">
              <div className="bg-primary/20 p-2 rounded-full">
                <FaUser className="text-primary h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Level {level}</div>
                <div className="text-xs text-muted-foreground">
                  XP: {experience}/{nextLevelExperience}
                </div>
                <Progress value={(experience / nextLevelExperience) * 100} className="h-1 mt-1" />
              </div>
            </div>
          </Card>
          
          <div className="flex space-x-2">
            <ShortcutButton
              icon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              label={isMuted ? "Unmute" : "Mute"}
              onClick={toggleMute}
              keyShortcut="M"
            />
            <ShortcutButton
              icon={<FaQuestion />}
              label="Help"
              onClick={startTutorial}
              keyShortcut="H"
            />
            <ShortcutButton
              icon={<FaSlidersH />}
              label="Menu"
              onClick={() => setShowMenu(!showMenu)}
              keyShortcut="Esc"
            />
          </div>
        </div>
        
        {/* Bottom HUD - Cards & Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-end z-20">
          <div className="flex space-x-2">
            <ShortcutButton
              icon={<FaList />}
              label="View Collection"
              onClick={() => setView('collection')}
              keyShortcut="C"
            />
          </div>
          
          {/* Selected card preview */}
          {selectedCardIndex !== null && cards[selectedCardIndex] && (
            <Card className="p-2 bg-background/80 backdrop-blur border-primary/20 flex items-center">
              <div 
                className="w-12 h-16 rounded-md mr-2"
                style={{ backgroundColor: cards[selectedCardIndex].color }}
              />
              <div>
                <div className="font-semibold text-sm">{cards[selectedCardIndex].name}</div>
                <div className="text-xs">Power: {cards[selectedCardIndex].power}</div>
              </div>
            </Card>
          )}
          
          {/* Mobile interaction button */}
          {isMobile && (
            <Button 
              variant="default" 
              size="lg" 
              className="rounded-full h-16 w-16 shadow-lg"
              onClick={() => {
                // Trigger interaction key (E)
                document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
                
                // Release it after a short delay
                setTimeout(() => {
                  document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' }));
                }, 100);
              }}
            >
              <FaGamepad className="h-6 w-6" />
            </Button>
          )}
        </div>
        
        {/* Game menu */}
        {showMenu && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <Card className="w-full max-w-sm mx-5 p-5">
              <h2 className="text-2xl font-bold mb-4 text-center">Game Menu</h2>
              <div className="space-y-2">
                <Button variant="default" className="w-full" onClick={() => setView('collection')}>
                  <FaBookOpen className="mr-2" /> View Collection
                </Button>
                <Button variant="default" className="w-full" onClick={startTutorial}>
                  <FaQuestion className="mr-2" /> Tutorial
                </Button>
                <Button variant="default" className="w-full" onClick={toggleMute}>
                  {isMuted ? <FaVolumeMute className="mr-2" /> : <FaVolumeUp className="mr-2" />}
                  {isMuted ? "Unmute" : "Mute"} Sound
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={() => {
                    // Reset game state here if needed
                    toast.error("Feature not implemented", {
                      description: "Resetting the game would be implemented here"
                    });
                    setShowMenu(false);
                  }}
                >
                  <FaTimes className="mr-2" /> Reset Game
                </Button>
                <Button variant="outline" className="w-full mt-4" onClick={() => setShowMenu(false)}>
                  Close Menu
                </Button>
              </div>
            </Card>
          </div>
        )}
      </>
    );
  }
  
  // Collection View UI
  if (view === 'collection') {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 z-20">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            className="bg-background/80 backdrop-blur"
            onClick={() => setView('world')}
          >
            <FaArrowLeft className="mr-2" /> Back to Game
          </Button>
          
          <div className="bg-background/80 backdrop-blur px-4 py-2 rounded-md">
            <span className="font-semibold">{cards.length} Cards</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Battle View UI
  if (view === 'battle') {
    return (
      <>
        {/* Battle status */}
        <div className="fixed top-0 left-0 right-0 p-4 flex justify-between z-20">
          <Card className="p-3 bg-background/80 backdrop-blur border-primary/20">
            <div className="flex items-center space-x-4">
              <div>
                <div className="font-semibold">Your Health</div>
                <div className="flex items-center space-x-1">
                  <div className="text-red-500 text-xl">❤️</div>
                  <Progress 
                    value={(battleState.playerHealth / battleState.playerMaxHealth) * 100} 
                    className="h-2 w-24"
                  />
                  <div className="text-xs">{battleState.playerHealth}/{battleState.playerMaxHealth}</div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 bg-background/80 backdrop-blur border-primary/20">
            <div className="flex items-center space-x-4">
              <div>
                <div className="font-semibold">Enemy Health</div>
                <div className="flex items-center space-x-1">
                  <div className="text-red-500 text-xl">❤️</div>
                  <Progress 
                    value={(battleState.enemyHealth / battleState.enemyMaxHealth) * 100} 
                    className="h-2 w-24"
                  />
                  <div className="text-xs">{battleState.enemyHealth}/{battleState.enemyMaxHealth}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Battle turn indicator */}
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          {battleState.currentTurn === 'player' && !activeCard && (
            <div className="bg-background/80 backdrop-blur px-4 py-2 rounded-md">
              <span className="font-semibold text-primary">Your Turn</span>
            </div>
          )}
          {battleState.currentTurn === 'enemy' && (
            <div className="bg-background/80 backdrop-blur px-4 py-2 rounded-md">
              <span className="font-semibold text-destructive">Enemy Turn</span>
            </div>
          )}
        </div>
        
        {/* Player cards */}
        <div className="fixed bottom-0 left-0 right-0 p-4 z-20">
          <Card className="p-3 bg-background/80 backdrop-blur border-primary/20">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Your Cards</div>
              
              {battleState.outcome && (
                <Button 
                  variant="default" 
                  className="ml-auto"
                  onClick={() => {
                    setView('world');
                    startNewBattle(); // Reset battle state
                  }}
                >
                  Return to Map
                </Button>
              )}
            </div>
            
            <div className="flex justify-center space-x-3 overflow-x-auto py-2">
              {playerCards.map((card, index) => (
                <BattleCardItem 
                  key={`player-card-${index}`}
                  card={card}
                  active={activeCard === card}
                  onClick={() => {
                    if (battleState.currentTurn === 'player' && !activeCard && !battleState.outcome) {
                      playCard(index);
                    }
                  }}
                />
              ))}
              
              {playerCards.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No cards available
                </div>
              )}
            </div>
          </Card>
        </div>
      </>
    );
  }
  
  return null;
};
