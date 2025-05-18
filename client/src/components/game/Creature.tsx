import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CreatureProps {
  creatureType: string;
  position: [number, number, number];
  scale?: number;
  color?: string;
  animated?: boolean;
}

// Creature component for battles and card displays
export const Creature = ({ 
  creatureType = 'elemental', 
  position = [0, 0, 0], 
  scale = 1, 
  color = '#ffffff',
  animated = true
}: CreatureProps) => {
  const creatureRef = useRef<THREE.Group>(null);
  
  // Animation logic
  useFrame((_, delta) => {
    if (creatureRef.current && animated) {
      // Different creatures have different idle animations
      switch (creatureType) {
        case 'dragon':
          // Dragon floats and breathes
          creatureRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.2;
          creatureRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.2;
          
          // Wings flap subtly
          const wingParts = creatureRef.current.children.filter(
            (child, index) => index >= 3 && index <= 4
          );
          wingParts.forEach(wing => {
            wing.rotation.z = Math.sin(Date.now() * 0.003) * 0.2;
          });
          break;
          
        case 'elemental':
          // Elemental pulses and rotates
          creatureRef.current.scale.x = scale * (1 + Math.sin(Date.now() * 0.003) * 0.05);
          creatureRef.current.scale.y = scale * (1 + Math.sin(Date.now() * 0.003) * 0.05);
          creatureRef.current.scale.z = scale * (1 + Math.sin(Date.now() * 0.003) * 0.05);
          creatureRef.current.rotation.y += delta * 0.5;
          break;
          
        case 'beast':
          // Beast breathes and occasionally growls
          creatureRef.current.scale.x = scale * (1 + Math.sin(Date.now() * 0.002) * 0.03);
          creatureRef.current.scale.z = scale * (1 + Math.sin(Date.now() * 0.002) * 0.03);
          creatureRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.05;
          break;
          
        case 'undead':
          // Undead creature floats eerily
          creatureRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.2;
          creatureRef.current.rotation.z = Math.sin(Date.now() * 0.0008) * 0.1;
          break;
          
        case 'golem':
          // Golem moves robotically with mechanical twitches
          creatureRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
          if (Math.sin(Date.now() * 0.001) > 0.8) {
            creatureRef.current.rotation.z = Math.sin(Date.now() * 0.01) * 0.05;
          }
          break;
          
        default:
          // Default idle animation
          creatureRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
          creatureRef.current.rotation.y += delta * 0.2;
      }
    }
  });
  
  // Get creature mesh based on type
  const renderCreature = () => {
    switch (creatureType) {
      case 'dragon':
        return (
          <>
            {/* Dragon body */}
            <mesh castShadow position={[0, 0.5, 0]}>
              <capsuleGeometry args={[0.5, 1.3, 16, 16]} />
              <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} />
            </mesh>
            
            {/* Dragon head */}
            <mesh castShadow position={[0, 1.3, 0.5]}>
              <coneGeometry args={[0.3, 0.8, 16]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} />
            </mesh>
            
            {/* Dragon tail */}
            <mesh castShadow position={[0, 0.4, -0.8]} rotation={[Math.PI/4, 0, 0]}>
              <coneGeometry args={[0.2, 1.2, 16]} />
              <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} />
            </mesh>
            
            {/* Dragon wings */}
            <mesh castShadow position={[0.6, 0.7, 0]} rotation={[0, 0, Math.PI/4]}>
              <boxGeometry args={[1, 0.1, 0.7]} />
              <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} transparent opacity={0.8} />
            </mesh>
            <mesh castShadow position={[-0.6, 0.7, 0]} rotation={[0, 0, -Math.PI/4]}>
              <boxGeometry args={[1, 0.1, 0.7]} />
              <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} transparent opacity={0.8} />
            </mesh>
            
            {/* Dragon eyes */}
            <mesh position={[0.1, 1.3, 0.8]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color="red" />
            </mesh>
            <mesh position={[-0.1, 1.3, 0.8]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color="red" />
            </mesh>
            
            {/* Fire breath effect */}
            <pointLight position={[0, 1.3, 1]} intensity={0.5} distance={2} color="orange" />
          </>
        );
        
      case 'elemental':
        return (
          <>
            {/* Elemental core */}
            <mesh castShadow>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={0.5} 
                transparent 
                opacity={0.8} 
              />
            </mesh>
            
            {/* Elemental outer layers */}
            <mesh castShadow>
              <sphereGeometry args={[0.7, 8, 8]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={0.3} 
                wireframe
                transparent 
                opacity={0.5} 
              />
            </mesh>
            
            {/* Elemental particles */}
            {[...Array(8)].map((_, i) => (
              <mesh 
                key={i} 
                position={[
                  Math.sin(i/8 * Math.PI * 2) * (0.8 + Math.sin(Date.now() * 0.001 + i) * 0.2),
                  Math.cos(i/8 * Math.PI * 2) * (0.8 + Math.sin(Date.now() * 0.001 + i) * 0.2),
                  Math.sin(i/8 * Math.PI + Date.now() * 0.001) * 0.5
                ]}
              >
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial 
                  color={color} 
                  emissive={color} 
                  emissiveIntensity={1}
                  transparent 
                  opacity={0.7} 
                />
              </mesh>
            ))}
            
            {/* Elemental light */}
            <pointLight intensity={0.6} distance={3} color={color} />
          </>
        );
        
      case 'beast':
        return (
          <>
            {/* Beast body */}
            <mesh castShadow position={[0, 0.3, 0]}>
              <boxGeometry args={[0.8, 0.6, 1.3]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            
            {/* Beast head */}
            <mesh castShadow position={[0, 0.6, 0.7]}>
              <boxGeometry args={[0.7, 0.5, 0.5]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            
            {/* Beast snout */}
            <mesh castShadow position={[0, 0.5, 1]}>
              <boxGeometry args={[0.4, 0.3, 0.3]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            
            {/* Beast eyes */}
            <mesh position={[0.2, 0.7, 0.9]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#ffcc00" />
            </mesh>
            <mesh position={[-0.2, 0.7, 0.9]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#ffcc00" />
            </mesh>
            
            {/* Beast legs */}
            <mesh castShadow position={[0.4, 0, 0.4]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            <mesh castShadow position={[-0.4, 0, 0.4]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            <mesh castShadow position={[0.4, 0, -0.4]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            <mesh castShadow position={[-0.4, 0, -0.4]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            
            {/* Beast tail */}
            <mesh castShadow position={[0, 0.3, -0.8]} rotation={[Math.PI/4, 0, 0]}>
              <capsuleGeometry args={[0.1, 0.8, 8, 8]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
          </>
        );
        
      case 'undead':
        return (
          <>
            {/* Undead body */}
            <mesh castShadow position={[0, 0.5, 0]}>
              <capsuleGeometry args={[0.4, 1, 16, 16]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            
            {/* Undead head */}
            <mesh castShadow position={[0, 1.2, 0]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            
            {/* Undead eyes */}
            <mesh position={[0.1, 1.2, 0.2]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#80ffff" emissive="#80ffff" emissiveIntensity={1} />
            </mesh>
            <mesh position={[-0.1, 1.2, 0.2]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#80ffff" emissive="#80ffff" emissiveIntensity={1} />
            </mesh>
            
            {/* Undead arms */}
            <mesh castShadow position={[0.4, 0.6, 0]} rotation={[0, 0, -Math.PI/6]}>
              <capsuleGeometry args={[0.1, 0.8, 8, 8]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            <mesh castShadow position={[-0.4, 0.6, 0]} rotation={[0, 0, Math.PI/6]}>
              <capsuleGeometry args={[0.1, 0.8, 8, 8]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            
            {/* Undead legs */}
            <mesh castShadow position={[0.2, 0, 0]} rotation={[0, 0, Math.PI/20]}>
              <capsuleGeometry args={[0.1, 0.6, 8, 8]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            <mesh castShadow position={[-0.2, 0, 0]} rotation={[0, 0, -Math.PI/20]}>
              <capsuleGeometry args={[0.1, 0.6, 8, 8]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
            </mesh>
            
            {/* Undead glow */}
            <pointLight intensity={0.4} distance={2} color="#80ffff" />
          </>
        );
        
      case 'golem':
        return (
          <>
            {/* Golem body */}
            <mesh castShadow position={[0, 0.4, 0]}>
              <boxGeometry args={[0.8, 0.8, 0.6]} />
              <meshStandardMaterial color={color} roughness={0.6} metalness={0.7} />
            </mesh>
            
            {/* Golem head */}
            <mesh castShadow position={[0, 1, 0]}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color={color} roughness={0.6} metalness={0.7} />
            </mesh>
            
            {/* Golem eye */}
            <mesh position={[0, 1, 0.26]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial color="red" emissive="red" emissiveIntensity={1} />
            </mesh>
            
            {/* Golem arms */}
            <mesh castShadow position={[0.6, 0.4, 0]}>
              <boxGeometry args={[0.4, 0.15, 0.15]} />
              <meshStandardMaterial color={color} roughness={0.6} metalness={0.7} />
            </mesh>
            <mesh castShadow position={[-0.6, 0.4, 0]}>
              <boxGeometry args={[0.4, 0.15, 0.15]} />
              <meshStandardMaterial color={color} roughness={0.6} metalness={0.7} />
            </mesh>
            
            {/* Golem hands */}
            <mesh castShadow position={[0.9, 0.4, 0]}>
              <boxGeometry args={[0.2, 0.25, 0.25]} />
              <meshStandardMaterial color={color} roughness={0.6} metalness={0.7} />
            </mesh>
            <mesh castShadow position={[-0.9, 0.4, 0]}>
              <boxGeometry args={[0.2, 0.25, 0.25]} />
              <meshStandardMaterial color={color} roughness={0.6} metalness={0.7} />
            </mesh>
            
            {/* Golem legs */}
            <mesh castShadow position={[0.3, 0, 0]}>
              <boxGeometry args={[0.3, 0.8, 0.3]} />
              <meshStandardMaterial color={color} roughness={0.6} metalness={0.7} />
            </mesh>
            <mesh castShadow position={[-0.3, 0, 0]}>
              <boxGeometry args={[0.3, 0.8, 0.3]} />
              <meshStandardMaterial color={color} roughness={0.6} metalness={0.7} />
            </mesh>
            
            {/* Glowing core */}
            <mesh position={[0, 0.4, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial color="orange" emissive="orange" emissiveIntensity={1} />
            </mesh>
            <pointLight intensity={0.5} distance={2} color="orange" />
          </>
        );
        
      default:
        return (
          <>
            {/* Default creature - magical sprite */}
            <mesh castShadow>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={0.5}
                transparent 
                opacity={0.9}
              />
            </mesh>
            
            {/* Magical particle effects */}
            {[...Array(12)].map((_, i) => (
              <mesh 
                key={i} 
                position={[
                  Math.sin(i/12 * Math.PI * 2 + Date.now() * 0.001) * 0.8,
                  Math.cos(i/12 * Math.PI * 2 + Date.now() * 0.001) * 0.8,
                  Math.sin(i/6 * Math.PI + Date.now() * 0.001) * 0.5
                ]}
              >
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.7} />
              </mesh>
            ))}
            
            <pointLight intensity={0.6} distance={3} color={color} />
          </>
        );
    }
  };
  
  return (
    <group 
      ref={creatureRef} 
      position={position} 
      scale={scale}
    >
      {renderCreature()}
    </group>
  );
};
