import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCharacter } from "@/lib/stores/useCharacter";
import { useKeyboardControls } from "@react-three/drei";
import { Controls } from "@/lib/Controls";

// Main player character component
export const Character = () => {
  const characterRef = useRef<THREE.Group>(null);
  const { position, rotation, updatePosition, isMoving, setIsMoving } = useCharacter();
  const [, getControls] = useKeyboardControls<Controls>();
  
  // Animation state
  const animationRef = useRef({
    bobAmount: 0,
    walkCycle: 0,
  });
  
  // Check if character is moving based on keyboard input
  useFrame((_, delta) => {
    const controls = getControls();
    const isCurrentlyMoving = 
      controls.forward || 
      controls.backward || 
      controls.leftward || 
      controls.rightward;
    
    if (isCurrentlyMoving !== isMoving) {
      setIsMoving(isCurrentlyMoving);
    }
    
    // Update walk cycle and bob animation
    if (isMoving) {
      animationRef.current.walkCycle += delta * 8;
      animationRef.current.bobAmount = Math.sin(animationRef.current.walkCycle) * 0.1;
    } else {
      // Idle animation - gentle bobbing
      animationRef.current.walkCycle += delta * 2;
      animationRef.current.bobAmount = Math.sin(animationRef.current.walkCycle) * 0.05;
    }
    
    // Apply animation to character parts
    if (characterRef.current) {
      // Body bob animation
      characterRef.current.position.y = animationRef.current.bobAmount + 0.1;
      
      // Slight rotation while moving
      if (isMoving) {
        characterRef.current.rotation.z = Math.sin(animationRef.current.walkCycle * 0.5) * 0.05;
      }
    }
  });
  
  return (
    <group ref={characterRef}>
      {/* Character body */}
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[0.6, 1.6, 0.6]} />
        <meshStandardMaterial color="#4c1d95" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Head */}
      <mesh castShadow position={[0, 2, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#f3e8ff" metalness={0.2} roughness={0.6} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.15, 2.05, 0.3]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.15, 2.05, 0.3]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Arms - they swing with the walk cycle */}
      <mesh 
        castShadow 
        position={[0.4, 1.2, 0]} 
        rotation={[0, 0, isMoving ? Math.sin(animationRef.current.walkCycle) * 0.4 : 0.2]}
      >
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#4c1d95" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh 
        castShadow 
        position={[-0.4, 1.2, 0]} 
        rotation={[0, 0, isMoving ? -Math.sin(animationRef.current.walkCycle) * 0.4 : -0.2]}
      >
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#4c1d95" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Legs - they move with the walk cycle */}
      <mesh 
        castShadow 
        position={[0.2, 0.4, 0]} 
        rotation={[isMoving ? Math.sin(animationRef.current.walkCycle) * 0.5 : 0, 0, 0]}
      >
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#312e81" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh 
        castShadow 
        position={[-0.2, 0.4, 0]} 
        rotation={[isMoving ? -Math.sin(animationRef.current.walkCycle) * 0.5 : 0, 0, 0]}
      >
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#312e81" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Wizard/mage hat */}
      <mesh castShadow position={[0, 2.4, 0]} rotation={[0.1, 0, 0.2]}>
        <coneGeometry args={[0.3, 0.7, 16]} />
        <meshStandardMaterial color="#581c87" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Staff/wand in hand */}
      <mesh 
        castShadow 
        position={[0.5, 1.2, 0.2]} 
        rotation={[0.2, 0, isMoving ? Math.sin(animationRef.current.walkCycle) * 0.4 + 0.2 : 0.2]}
      >
        <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
        <meshStandardMaterial color="#713f12" metalness={0.2} roughness={0.6} />
      </mesh>
      
      {/* Glowing orb on staff */}
      <mesh 
        position={[0.5, 1.7, 0.2]} 
        rotation={[0.2, 0, isMoving ? Math.sin(animationRef.current.walkCycle) * 0.4 + 0.2 : 0.2]}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color="#a855f7" 
          emissive="#a855f7" 
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
      
      {/* Add a small point light to make the staff glow */}
      <pointLight 
        position={[0.5, 1.7, 0.2]} 
        intensity={0.6} 
        distance={2} 
        color="#a855f7" 
      />
    </group>
  );
};
