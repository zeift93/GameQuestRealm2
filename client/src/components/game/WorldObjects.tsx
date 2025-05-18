import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// World objects to decorate the game map - trees, rocks, etc.
export const WorldObjects = () => {
  // Load textures
  const woodTexture = useTexture("/textures/wood.jpg");
  
  // Pre-calculate positions for trees, rocks, etc.
  const treePositions = useMemo(() => {
    const positions = [];
    // Generate tree positions around the edges of the map
    for (let i = 0; i < 20; i++) {
      // Create a circle of trees around the map perimeter
      const angle = (i / 20) * Math.PI * 2;
      const radius = 18;
      positions.push({
        x: Math.sin(angle) * radius,
        z: Math.cos(angle) * radius,
        scale: 0.8 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2
      });
    }
    
    // Add some random trees inside the map
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 8;
      positions.push({
        x: Math.sin(angle) * radius,
        z: Math.cos(angle) * radius,
        scale: 0.6 + Math.random() * 0.6,
        rotation: Math.random() * Math.PI * 2
      });
    }
    
    return positions;
  }, []);
  
  // Pre-calculate positions for rocks
  const rockPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 15; i++) {
      positions.push({
        x: (Math.random() - 0.5) * 35,
        z: (Math.random() - 0.5) * 35,
        scale: 0.4 + Math.random() * 0.8,
        rotation: Math.random() * Math.PI * 2
      });
    }
    return positions;
  }, []);
  
  // Pre-calculate decorative crystal clusters
  const crystalPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 8; i++) {
      positions.push({
        x: (Math.random() - 0.5) * 30,
        z: (Math.random() - 0.5) * 30,
        scale: 0.5 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2,
        color: [
          '#9333ea', // Purple
          '#3b82f6', // Blue
          '#10b981', // Green
          '#f97316', // Orange
          '#f43f5e', // Red
        ][Math.floor(Math.random() * 5)]
      });
    }
    return positions;
  }, []);
  
  return (
    <group>
      {/* Trees */}
      {treePositions.map((tree, index) => (
        <group 
          key={`tree-${index}`} 
          position={[tree.x, 0, tree.z]} 
          rotation={[0, tree.rotation, 0]}
          scale={tree.scale}
        >
          {/* Tree trunk */}
          <mesh castShadow position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.2, 0.4, 3, 8]} />
            <meshStandardMaterial map={woodTexture} roughness={0.8} metalness={0.1} />
          </mesh>
          
          {/* Tree foliage */}
          <mesh castShadow position={[0, 3, 0]}>
            <coneGeometry args={[1.5, 3, 8]} />
            <meshStandardMaterial color="#2d6a4f" roughness={0.8} metalness={0.1} />
          </mesh>
          <mesh castShadow position={[0, 4, 0]}>
            <coneGeometry args={[1, 2, 8]} />
            <meshStandardMaterial color="#40916c" roughness={0.8} metalness={0.1} />
          </mesh>
        </group>
      ))}
      
      {/* Rocks */}
      {rockPositions.map((rock, index) => (
        <group 
          key={`rock-${index}`} 
          position={[rock.x, 0, rock.z]} 
          rotation={[0, rock.rotation, 0]}
          scale={rock.scale}
        >
          <mesh castShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} metalness={0.2} />
          </mesh>
        </group>
      ))}
      
      {/* Crystal formations */}
      {crystalPositions.map((crystal, index) => (
        <group 
          key={`crystal-${index}`} 
          position={[crystal.x, 0, crystal.z]} 
          rotation={[0, crystal.rotation, 0]}
          scale={crystal.scale}
        >
          <mesh castShadow>
            <octahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial 
              color={crystal.color} 
              roughness={0.1} 
              metalness={0.9} 
              emissive={crystal.color}
              emissiveIntensity={0.5}
            />
          </mesh>
          <mesh castShadow position={[0.4, 0.2, 0.3]} rotation={[0.5, 0.3, 0.2]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial 
              color={crystal.color} 
              roughness={0.1} 
              metalness={0.9} 
              emissive={crystal.color}
              emissiveIntensity={0.5}
            />
          </mesh>
          <mesh castShadow position={[-0.3, 0.4, -0.2]} rotation={[-0.3, 0.6, 0.1]}>
            <octahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial 
              color={crystal.color} 
              roughness={0.1} 
              metalness={0.9} 
              emissive={crystal.color}
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Add a point light to make crystals glow */}
          <pointLight position={[0, 0.5, 0]} intensity={0.6} distance={3} color={crystal.color} />
        </group>
      ))}
      
      {/* Create a border around the map */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[19.8, 20, 64]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};
