import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCharacter } from "@/lib/stores/useCharacter";
import { useKeyboardControls } from "@react-three/drei";
import { Controls } from "@/lib/Controls";

// Main player character component (chibi style)
export const Character = () => {
  const characterRef = useRef<THREE.Group>(null);
  const { position, rotation, updatePosition, isMoving, setIsMoving } = useCharacter();
  const [, getControls] = useKeyboardControls<Controls>();
  
  // Animation state
  const animationRef = useRef({
    bobAmount: 0,
    walkCycle: 0,
    blinkTimer: 0,
    isBlinking: false
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
      animationRef.current.bobAmount = Math.sin(animationRef.current.walkCycle) * 0.15;
    } else {
      // Idle animation - gentle bobbing
      animationRef.current.walkCycle += delta * 2;
      animationRef.current.bobAmount = Math.sin(animationRef.current.walkCycle) * 0.08;
    }
    
    // Blinking animation (random)
    animationRef.current.blinkTimer -= delta;
    if (animationRef.current.blinkTimer <= 0) {
      animationRef.current.isBlinking = !animationRef.current.isBlinking;
      animationRef.current.blinkTimer = animationRef.current.isBlinking ? 0.15 : Math.random() * 5 + 2;
    }
    
    // Apply animation to character parts
    if (characterRef.current) {
      // Body bob animation
      characterRef.current.position.y = animationRef.current.bobAmount + 0.1;
      
      // Slight rotation while moving
      if (isMoving) {
        characterRef.current.rotation.z = Math.sin(animationRef.current.walkCycle * 0.5) * 0.08;
      }
    }
  });
  
  return (
    <group ref={characterRef}>
      {/* Character body - Shorter, wider for chibi proportions */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[0.8, 1.0, 0.8]} />
        <meshStandardMaterial color="#6d28d9" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Head - Larger head compared to body for chibi look */}
      <mesh castShadow position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color="#f5f3ff" metalness={0.2} roughness={0.6} />
      </mesh>
      
      {/* Eyes - Bigger, more expressive */}
      {!animationRef.current.isBlinking && (
        <>
          <mesh position={[0.2, 1.65, 0.45]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[-0.2, 1.65, 0.45]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          
          {/* Eye highlights */}
          <mesh position={[0.17, 1.68, 0.52]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.17, 1.68, 0.52]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      )}
      
      {/* Blinking eyes */}
      {animationRef.current.isBlinking && (
        <>
          <mesh position={[0.2, 1.65, 0.48]} rotation={[Math.PI/2 - 0.3, 0, 0]}>
            <planeGeometry args={[0.15, 0.05]} />
            <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.2, 1.65, 0.48]} rotation={[Math.PI/2 - 0.3, 0, 0]}>
            <planeGeometry args={[0.15, 0.05]} />
            <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      
      {/* Cute mouth */}
      <mesh position={[0, 1.5, 0.5]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.15, 0.06]} />
        <meshBasicMaterial color="#ff758f" side={THREE.DoubleSide} />
      </mesh>
      
      {/* Rosy cheeks for cute look */}
      <mesh position={[0.3, 1.55, 0.45]} rotation={[0, -Math.PI/8, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color="#f87171" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-0.3, 1.55, 0.45]} rotation={[0, Math.PI/8, 0]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color="#f87171" transparent opacity={0.6} />
      </mesh>
      
      {/* Arms - shorter, chubbier */}
      <mesh 
        castShadow 
        position={[0.5, 0.9, 0]} 
        rotation={[0, 0, isMoving ? Math.sin(animationRef.current.walkCycle) * 0.5 : 0.2]}
      >
        <capsuleGeometry args={[0.15, 0.4, 8, 8]} />
        <meshStandardMaterial color="#6d28d9" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh 
        castShadow 
        position={[-0.5, 0.9, 0]} 
        rotation={[0, 0, isMoving ? -Math.sin(animationRef.current.walkCycle) * 0.5 : -0.2]}
      >
        <capsuleGeometry args={[0.15, 0.4, 8, 8]} />
        <meshStandardMaterial color="#6d28d9" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Legs - shorter, chubbier */}
      <mesh 
        castShadow 
        position={[0.25, 0.3, 0]} 
        rotation={[isMoving ? Math.sin(animationRef.current.walkCycle) * 0.6 : 0, 0, 0]}
      >
        <capsuleGeometry args={[0.18, 0.35, 8, 8]} />
        <meshStandardMaterial color="#4c1d95" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh 
        castShadow 
        position={[-0.25, 0.3, 0]} 
        rotation={[isMoving ? -Math.sin(animationRef.current.walkCycle) * 0.6 : 0, 0, 0]}
      >
        <capsuleGeometry args={[0.18, 0.35, 8, 8]} />
        <meshStandardMaterial color="#4c1d95" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Fantasy wizard hat - larger for chibi proportion */}
      <mesh castShadow position={[0, 2, 0]} rotation={[0.1, 0, 0.2]}>
        <coneGeometry args={[0.4, 0.9, 16]} />
        <meshStandardMaterial color="#7e22ce" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Hat decoration */}
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#c4b5fd" emissive="#c4b5fd" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Mini cape/cloak for fantasy look */}
      <mesh castShadow position={[0, 1.0, -0.2]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.9, 0.8, 0.1]} />
        <meshStandardMaterial color="#9333ea" metalness={0.1} roughness={0.7} />
      </mesh>
      
      {/* Staff/wand in hand - cuter design */}
      <mesh 
        castShadow 
        position={[0.6, 0.9, 0.3]} 
        rotation={[0.2, 0, isMoving ? Math.sin(animationRef.current.walkCycle) * 0.5 + 0.2 : 0.2]}
      >
        <cylinderGeometry args={[0.04, 0.05, 0.8, 8]} />
        <meshStandardMaterial color="#854d0e" metalness={0.2} roughness={0.6} />
      </mesh>
      
      {/* Star-shaped wand tip */}
      <group
        position={[0.6, 1.3, 0.3]}
        rotation={[0.2, 0, isMoving ? Math.sin(animationRef.current.walkCycle) * 0.5 + 0.2 : 0.2]}
      >
        {/* Create a 5-pointed star shape */}
        {[...Array(5)].map((_, i) => (
          <mesh key={i} rotation={[0, 0, (i/5) * Math.PI * 2]}>
            <boxGeometry args={[0.05, 0.2, 0.05]} />
            <meshStandardMaterial 
              color="#f0abfc" 
              emissive="#f0abfc" 
              emissiveIntensity={1}
              toneMapped={false}
            />
          </mesh>
        ))}
        <pointLight intensity={0.8} distance={3} color="#f0abfc" />
      </group>
    </group>
  );
};
