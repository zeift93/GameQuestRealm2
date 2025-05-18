import { useState, useEffect } from "react";
import { useGame } from "@/lib/stores/useGame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FaGamepad, FaArrowRight, FaArrowLeft, FaHiking, FaChessKnight, FaQuestionCircle, FaTrophy } from "react-icons/fa";

const tutorialSteps = [
  {
    title: "Welcome to Mystic Realm: Card Masters",
    content: "Embark on a magical journey to collect cards, battle creatures, and become the ultimate Card Master!",
    icon: <FaGamepad className="h-8 w-8 text-primary" />,
  },
  {
    title: "Moving Around",
    content: "Use WASD or arrow keys to move your character around the map. Explore to find card packs and enemies to battle.",
    icon: <FaHiking className="h-8 w-8 text-primary" />,
  },
  {
    title: "Collecting Cards",
    content: "Find glowing card packs around the map. Press E when near one to open it and add new cards to your collection.",
    icon: <FaQuestionCircle className="h-8 w-8 text-primary" />,
  },
  {
    title: "Battling",
    content: "Approach an enemy and press E to start a battle. Choose your cards wisely to defeat your opponents.",
    icon: <FaChessKnight className="h-8 w-8 text-primary" />,
  },
  {
    title: "Collection & Deck",
    content: "Press C to view your card collection. Select your best cards to create a powerful deck for battles.",
    icon: <FaTrophy className="h-8 w-8 text-primary" />,
  },
  {
    title: "You're Ready!",
    content: "Now you know the basics! Collect cards, build your deck, and defeat all enemies to become the Card Master!",
    icon: <FaGamepad className="h-8 w-8 text-primary" />,
  },
];

const Tutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { phase, setPhase } = useGame();

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // End tutorial
      setPhase('ready');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    setPhase('ready');
  };

  // Key press handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      } else if (e.key === 'Escape') {
        skipTutorial();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-5 bg-background/95 backdrop-blur border-2 border-primary/50 p-6 rounded-xl">
        <div className="flex items-center justify-center mb-4">
          {tutorialSteps[currentStep].icon}
          <h2 className="text-2xl font-bold text-primary ml-3">
            {tutorialSteps[currentStep].title}
          </h2>
        </div>
        
        <div className="text-lg text-center mb-8 text-foreground">
          {tutorialSteps[currentStep].content}
        </div>
        
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4"
          >
            <FaArrowLeft className="mr-2" /> Back
          </Button>
          
          <div className="flex-1 flex justify-center">
            <div className="flex space-x-1">
              {tutorialSteps.map((_, index) => (
                <div 
                  key={index}
                  className={`h-2 w-2 rounded-full ${index === currentStep ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>
          </div>
          
          <Button 
            variant={currentStep === tutorialSteps.length - 1 ? "default" : "outline"}
            onClick={nextStep}
            className="px-4"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Start Game' : 'Next'} <FaArrowRight className="ml-2" />
          </Button>
        </div>
        
        <div className="mt-4 text-center">
          <button
            onClick={skipTutorial}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Skip Tutorial
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Tutorial;
