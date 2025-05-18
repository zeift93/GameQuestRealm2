import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useCards } from "@/lib/stores/useCards";
import { useGame } from "@/lib/stores/useGame";
import { Creature } from "./Creature";

// Card display component for the collection view
const CardDisplay = ({ card, position, index, selectedIndex, onClick }: any) => {
  const isSelected = index === selectedIndex;
  const meshRef = useRef<THREE.Group>(null);
  
  // Card animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      // Hover animation for selected card
      if (isSelected) {
        meshRef.current.position.y = Math.sin(Date.now() * 0.003) * 0.1 + 0.2;
        meshRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
      } else {
        // Lower non-selected cards
        meshRef.current.position.y = 0;
        meshRef.current.rotation.y = 0;
      }
    }
  });
  
  return (
    <group 
      ref={meshRef} 
      position={position} 
      rotation={[0, isSelected ? Math.PI * 0.05 : 0, 0]}
      onClick={onClick}
      scale={isSelected ? 1.1 : 1}
    >
      {/* Card background */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial color={card.color} metalness={0.3} roughness={0.2} />
      </mesh>
      
      {/* Card border */}
      <mesh position={[0, 1.5, 0.06]}>
        <boxGeometry args={[1.9, 2.9, 0.01]} />
        <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.1} />
      </mesh>
      
      {/* Card name */}
      <Text
        position={[0, 3, 0.1]}
        color="white"
        fontSize={0.2}
        maxWidth={1.8}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {card.name}
      </Text>
      
      {/* Small creature preview */}
      <group position={[0, 1.5, 0.3]} scale={0.4}>
        <Creature 
          creatureType={card.creatureType}
          position={[0, 0, 0]}
          scale={0.8}
          color={card.color}
          animated={isSelected}
        />
      </group>
      
      {/* Card stats */}
      <Text
        position={[0, 0.3, 0.1]}
        color="white"
        fontSize={0.18}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        Power: {card.power} | Type: {card.type}
      </Text>
      
      {/* Card description */}
      <Text
        position={[0, 0, 0.1]}
        color="white"
        fontSize={0.14}
        maxWidth={1.8}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {card.description}
      </Text>
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, -1.6, 0.1]}>
          <planeGeometry args={[2, 0.3]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.7} />
          <Text
            position={[0, 0, 0.1]}
            color="white"
            fontSize={0.2}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            SELECTED
          </Text>
        </mesh>
      )}
    </group>
  );
};

// Main card collection scene
const CardCollection = () => {
  const { cards, selectedCardIndex, selectCard } = useCards();
  const { setView } = useGame();
  const [cameraAngle, setCameraAngle] = useState(0);
  const { camera } = useThree();
  
  // Camera movement around the cards
  useFrame((_, delta) => {
    // Subtle camera motion around the center
    const radius = 10;
    const angle = cameraAngle + delta * 0.1;
    setCameraAngle(angle);
    
    camera.position.x = Math.sin(angle * 0.2) * radius;
    camera.position.z = Math.cos(angle * 0.2) * radius;
    camera.position.y = 6 + Math.sin(angle * 0.1) * 1;
    camera.lookAt(0, 1, 0);
  });
  
  // Calculate card positions in a circle
  const getCardPosition = (index: number, total: number) => {
    const radius = Math.min(10, total * 0.8);
    const angle = (index / total) * Math.PI * 2;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    return [x, 0, z];
  };
  
  return (
    <>
      {/* Collection scene camera */}
      <PerspectiveCamera makeDefault position={[0, 6, 10]} fov={50} />
      
      {/* Scene lighting */}
      <ambientLight intensity={0.4} />
      <spotLight position={[0, 10, 0]} intensity={0.6} castShadow angle={0.5} penumbra={0.5} />
      <pointLight position={[10, 5, 10]} intensity={0.5} color="#ff9f7f" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#7f9fff" />
      
      {/* Collection title */}
      <Text
        position={[0, 5, 0]}
        color="#ffd700"
        fontSize={1}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        Your Card Collection
      </Text>
      
      {/* Card count */}
      <Text
        position={[0, 4, 0]}
        color="white"
        fontSize={0.5}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {cards.length} Cards Collected
      </Text>
      
      {/* Display all collected cards in a circle */}
      {cards.map((card, index) => (
        <CardDisplay
          key={`card-${index}`}
          card={card}
          position={getCardPosition(index, cards.length)}
          index={index}
          selectedIndex={selectedCardIndex}
          onClick={() => selectCard(index)}
        />
      ))}
      
      {/* Return button */}
      <group 
        position={[0, 0, 0]} 
        onClick={() => setView('world')}
      >
        <mesh position={[0, -1.5, 0]}>
          <cylinderGeometry args={[1, 1, 0.2, 32]} />
          <meshStandardMaterial color="#6366f1" metalness={0.3} roughness={0.7} />
        </mesh>
        <Text
          position={[0, -1.4, 0]}
          color="white"
          fontSize={0.3}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
        >
          Return to World
        </Text>
      </group>
      
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Decorative elements */}
      <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8, 12, 64]} />
        <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.3} />
      </mesh>
    </>
  );
};

export default CardCollection;
