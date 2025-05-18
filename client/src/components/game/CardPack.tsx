import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useCharacter } from "@/lib/stores/useCharacter";
import { useCards } from "@/lib/stores/useCards";
import { useGame } from "@/lib/stores/useGame";
import { useAudio } from "@/lib/stores/useAudio";

interface CardPackProps {
  position: [number, number, number];
  characterPosition: [number, number, number];
}

// Card pack 3D component
export const CardPack = ({ position, characterPosition }: CardPackProps) => {
  const packRef = useRef<THREE.Group>(null);
  const { setInteractableNearby } = useCharacter();
  const { addCardFromPack } = useCards();
  const { view, setView } = useGame();
  const { playSuccess } = useAudio();
  
  // Animation states
  const [hover, setHover] = useState(false);
  const [opened, setOpened] = useState(false);
  const [showingCard, setShowingCard] = useState(false);
  const [newCard, setNewCard] = useState<any>(null);
  
  // Check if character is near this card pack
  useEffect(() => {
    const distanceToCharacter = Math.sqrt(
      Math.pow(characterPosition[0] - position[0], 2) +
      Math.pow(characterPosition[2] - position[2], 2)
    );
    
    // If character is within interaction range
    if (distanceToCharacter < 2 && !opened) {
      setHover(true);
      setInteractableNearby('cardPack');
    } else {
      setHover(false);
      // Only reset the interactable if this specific pack was the interactable
      // This prevents clearing another pack's interactable status
      const isThisPackInteractable = distanceToCharacter < 3;
      if (view === 'world' && isThisPackInteractable) {
        setInteractableNearby(null);
      }
    }
  }, [characterPosition, position, opened]);
  
  // Handle pack opening animation and card generation
  useEffect(() => {
    if (view === 'pack_opening' && !opened) {
      // Open the pack and generate cards
      setOpened(true);
      
      // Generate a new card from pack after a delay
      setTimeout(() => {
        const card = addCardFromPack();
        setNewCard(card);
        setShowingCard(true);
        
        // Return to world view after showing card
        setTimeout(() => {
          playSuccess();
          setView('world');
          
          // Reset after some time so packs can respawn
          setTimeout(() => {
            setOpened(false);
            setShowingCard(false);
            setNewCard(null);
          }, 30000); // Respawn after 30 seconds
        }, 4000);
      }, 2000);
    }
  }, [view, opened]);
  
  // Animation for the card pack
  useFrame((_, delta) => {
    if (packRef.current && !opened) {
      // Floating animation
      packRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.1 + 0.5;
      
      // Rotation animation
      packRef.current.rotation.y += delta * 0.5;
    }
    
    // Opened animation - explode upward
    if (packRef.current && opened && !showingCard) {
      packRef.current.position.y += delta * 2;
      packRef.current.rotation.z += delta * 3;
      packRef.current.scale.multiplyScalar(0.98);
    }
  });
  
  if (opened && showingCard && newCard) {
    return (
      <group position={[position[0], 1, position[2]]}>
        {/* New card reveal animation */}
        <mesh castShadow position={[0, Math.sin(Date.now() * 0.003) * 0.1 + 2, 0]}>
          <boxGeometry args={[2, 3, 0.1]} />
          <meshStandardMaterial color={newCard.color} metalness={0.3} roughness={0.2} />
        </mesh>
        
        {/* Card border */}
        <mesh position={[0, Math.sin(Date.now() * 0.003) * 0.1 + 2, 0.06]}>
          <boxGeometry args={[1.9, 2.9, 0.01]} />
          <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.1} />
        </mesh>
        
        {/* Card content */}
        <Text
          position={[0, Math.sin(Date.now() * 0.003) * 0.1 + 3, 0.1]}
          color="white"
          fontSize={0.2}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {newCard.name}
        </Text>
        
        <Text
          position={[0, Math.sin(Date.now() * 0.003) * 0.1 + 1.3, 0.1]}
          color="white"
          fontSize={0.15}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          Power: {newCard.power} | Type: {newCard.type}
        </Text>
        
        {/* Card acquisition message */}
        <Text
          position={[0, Math.sin(Date.now() * 0.003) * 0.1 + 0.5, 0.1]}
          color="#4ade80"
          fontSize={0.2}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          New Card Acquired!
        </Text>
      </group>
    );
  }
  
  if (opened) {
    // Empty or disappearing state
    return null;
  }
  
  return (
    <group ref={packRef} position={[position[0], 0.5, position[2]]}>
      {/* Card pack mesh */}
      <mesh castShadow>
        <boxGeometry args={[1, 1.5, 0.5]} />
        <meshStandardMaterial 
          color="#1e40af" 
          emissive="#3b82f6"
          emissiveIntensity={hover ? 0.5 : 0.2}
          metalness={0.7} 
          roughness={0.2} 
        />
      </mesh>
      
      {/* Card pack decorative elements */}
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[0.8, 1.3, 0.01]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.1} />
      </mesh>
      
      {/* Mystery symbol */}
      <Text
        position={[0, 0, 0.3]}
        color="white"
        fontSize={0.6}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        ?
      </Text>
      
      {/* Interaction prompt */}
      {hover && (
        <Text
          position={[0, 1.5, 0]}
          color="#fcba03"
          fontSize={0.2}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          Press E to Open
        </Text>
      )}
      
      {/* Light effect for card pack */}
      <pointLight position={[0, 0, 0]} intensity={0.4} color="#3b82f6" distance={2} />
    </group>
  );
};
