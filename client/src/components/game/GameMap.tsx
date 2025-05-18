import { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useTexture, Text, PerspectiveCamera, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { useCharacter } from "@/lib/stores/useCharacter";
import { useGame } from "@/lib/stores/useGame";
import { Character } from "./Character";
import { WorldObjects } from "./WorldObjects";
import { CardPack } from "./CardPack";
import { Controls } from "@/lib/Controls";
import { useAudio } from "@/lib/stores/useAudio";

// The main game map component
const GameMap = () => {
  const { camera } = useThree();
  const [subscribe, getControls] = useKeyboardControls<Controls>();
  const { position, rotation, updatePosition, interact, interactableNearby } = useCharacter();
  const { view, setView, startBattle } = useGame();
  const { playSuccess } = useAudio();
  
  // Load ground texture
  const groundTexture = useTexture("/textures/grass.png");
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(10, 10);
  
  // Reference to character mesh for camera following
  const characterRef = useRef<THREE.Group>(null);
  const groundRef = useRef<THREE.Mesh>(null);
  
  // Define card pack positions on the map
  const cardPackPositions = [
    { x: 8, z: 8 },
    { x: -8, z: -8 },
    { x: -8, z: 8 },
    { x: 12, z: -2 },
    { x: -10, z: 2 }
  ];
  
  // Enemy positions (NPCs that trigger battles)
  const enemyPositions = [
    { x: 5, z: 0, level: 1 },
    { x: -5, z: 5, level: 2 },
    { x: 10, z: -5, level: 3 },
    { x: -8, z: -3, level: 2 }
  ];
  
  // Handle movement input
  useFrame((_, delta) => {
    if (view !== 'world') return;
    
    const controls = getControls();
    let moveX = 0;
    let moveZ = 0;
    const speed = 5 * delta;
    
    if (controls.forward) moveZ -= speed;
    if (controls.backward) moveZ += speed;
    if (controls.leftward) moveX -= speed;
    if (controls.rightward) moveX += speed;
    
    // Update character position if there's movement
    if (moveX !== 0 || moveZ !== 0) {
      // Calculate movement with rotation
      const angle = rotation.y;
      const newX = position.x + (moveX * Math.cos(angle) - moveZ * Math.sin(angle));
      const newZ = position.z + (moveX * Math.sin(angle) + moveZ * Math.cos(angle));
      
      // Map boundaries - prevent going out of bounds
      const mapSize = 20;
      const boundedX = Math.max(-mapSize/2, Math.min(mapSize/2, newX));
      const boundedZ = Math.max(-mapSize/2, Math.min(mapSize/2, newZ));
      
      // Update character position
      updatePosition(boundedX, boundedZ);
      
      // Rotation handling (character faces the movement direction)
      if (moveX !== 0 || moveZ !== 0) {
        const targetAngle = Math.atan2(moveX, -moveZ);
        updatePosition(boundedX, boundedZ, targetAngle);
      }
    }
    
    // Update camera to follow character
    if (characterRef.current) {
      // Smooth camera follow
      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x, 
        position.x + Math.sin(rotation.y) * 5, 
        0.1
      );
      camera.position.z = THREE.MathUtils.lerp(
        camera.position.z, 
        position.z + Math.cos(rotation.y) * 5, 
        0.1
      );
      camera.lookAt(position.x, 1, position.z);
    }
  });
  
  // Handle interaction with card packs or enemies
  useEffect(() => {
    const handleInteract = () => {
      if (interactableNearby === 'cardPack') {
        // Open card pack
        setView('pack_opening');
        playSuccess();
      } else if (interactableNearby === 'enemy') {
        // Start battle
        startBattle();
        playSuccess();
      }
    };
    
    const unsubscribe = subscribe(
      state => state.interact,
      pressed => {
        if (pressed && view === 'world') {
          handleInteract();
        }
      }
    );
    
    return unsubscribe;
  }, [interact, interactableNearby, view]);
  
  return (
    <>
      {/* Main camera */}
      <PerspectiveCamera makeDefault position={[0, 10, 10]} fov={50} />
      
      {/* Sky and ambient lighting */}
      <hemisphereLight intensity={0.5} color="#87CEEB" groundColor="#382c45" />
      <directionalLight 
        position={[10, 15, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Ground plane */}
      <mesh 
        ref={groundRef}
        position={[0, -0.5, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial 
          map={groundTexture} 
          color="#4a8c42"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Player character */}
      <group ref={characterRef} position={[position.x, 0, position.z]} rotation={[0, rotation.y, 0]}>
        <Character />
      </group>
      
      {/* World decorations - trees, rocks, etc. */}
      <WorldObjects />
      
      {/* Card packs scattered around the map */}
      {cardPackPositions.map((pos, index) => (
        <CardPack 
          key={`pack-${index}`}
          position={[pos.x, 0, pos.z]}
          characterPosition={[position.x, 0, position.z]}
        />
      ))}
      
      {/* Enemy NPCs */}
      {enemyPositions.map((enemy, index) => (
        <group key={`enemy-${index}`} position={[enemy.x, 0, enemy.z]}>
          {/* Enemy character */}
          <mesh castShadow position={[0, 1, 0]}>
            <boxGeometry args={[0.8, 2, 0.8]} />
            <meshStandardMaterial color={enemy.level === 1 ? "#ff9f43" : enemy.level === 2 ? "#ee5253" : "#8854d0"} />
          </mesh>
          
          {/* Enemy level indicator */}
          <Text
            position={[0, 2.5, 0]}
            color="white"
            fontSize={0.5}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            Level {enemy.level}
          </Text>
          
          {/* Interaction indicator when player is nearby */}
          {Math.sqrt(Math.pow(position.x - enemy.x, 2) + Math.pow(position.z - enemy.z, 2)) < 3 && (
            <group position={[0, 3.2, 0]}>
              <Text
                position={[0, 0, 0]}
                color="#fcba03"
                fontSize={0.4}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#000000"
              >
                Press E to Battle
              </Text>
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshBasicMaterial color="#fcba03" />
              </mesh>
            </group>
          )}
        </group>
      ))}
      
      {/* Floating text for pack opening view */}
      {view === 'pack_opening' && (
        <Text
          position={[0, 4, 0]}
          color="white"
          fontSize={1}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          Opening Card Pack...
        </Text>
      )}
    </>
  );
};

export default GameMap;
