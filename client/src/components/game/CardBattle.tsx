import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, useTexture, PerspectiveCamera, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useBattle } from "@/lib/stores/useBattle";
import { useCards } from "@/lib/stores/useCards";
import { Creature } from "./Creature";
import { useAudio } from "@/lib/stores/useAudio";
import { useGame } from "@/lib/stores/useGame";

// The main battle scene component
const CardBattle = () => {
  const { battleState, playerCards, enemyCards, activeCard, enemyActiveCard, playCard, endTurn } = useBattle();
  const { cards } = useCards();
  const { playHit, playSuccess } = useAudio();
  const { setView } = useGame();
  
  // Get reference to the Three.js scene
  const { scene } = useThree();
  
  // Load battle arena texture
  const arenaTexture = useTexture("/textures/sand.jpg");
  arenaTexture.wrapS = arenaTexture.wrapT = THREE.RepeatWrapping;
  arenaTexture.repeat.set(4, 4);
  
  // References for animation
  const playerCreatureRef = useRef<THREE.Group>(null);
  const enemyCreatureRef = useRef<THREE.Group>(null);
  const battleFieldRef = useRef<THREE.Mesh>(null);
  
  // Battle animations
  const [attacking, setAttacking] = useState(false);
  const [attackDirection, setAttackDirection] = useState(1); // 1 = player attack, -1 = enemy attack
  
  // Attack animation
  useFrame((_, delta) => {
    if (attacking && playerCreatureRef.current && enemyCreatureRef.current) {
      if (attackDirection === 1) {
        // Player attacking enemy
        const attackProgress = Math.sin(Date.now() * 0.01) * 0.2;
        playerCreatureRef.current.position.z = -2 + attackProgress;
        
        // Rotate slightly during attack
        playerCreatureRef.current.rotation.y = Math.sin(Date.now() * 0.01) * 0.2;
      } else {
        // Enemy attacking player
        const attackProgress = Math.sin(Date.now() * 0.01) * 0.2;
        enemyCreatureRef.current.position.z = 2 - attackProgress;
        
        // Rotate slightly during attack
        enemyCreatureRef.current.rotation.y = Math.sin(Date.now() * 0.01) * 0.2;
      }
    }
  });
  
  // Handle attack animation
  useEffect(() => {
    if (battleState.currentTurn === 'player' && activeCard) {
      // Player attacks enemy
      setAttackDirection(1);
      setAttacking(true);
      playHit();
      
      // End attack animation after delay
      const timer = setTimeout(() => {
        setAttacking(false);
        endTurn();
      }, 1500);
      return () => clearTimeout(timer);
    } else if (battleState.currentTurn === 'enemy' && enemyActiveCard) {
      // Enemy attacks player
      setAttackDirection(-1);
      setAttacking(true);
      playHit();
      
      // End attack animation after delay
      const timer = setTimeout(() => {
        setAttacking(false);
        endTurn();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [battleState.currentTurn, activeCard, enemyActiveCard]);
  
  // Battle win/lose effects
  useEffect(() => {
    if (battleState.outcome === 'win') {
      playSuccess();
      const timer = setTimeout(() => {
        setView('world');
      }, 3000);
      return () => clearTimeout(timer);
    } else if (battleState.outcome === 'lose') {
      const timer = setTimeout(() => {
        setView('world');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [battleState.outcome]);

  return (
    <>
      {/* Battle environment */}
      <Environment preset="sunset" />
      <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
      
      {/* Battlefield */}
      <mesh
        ref={battleFieldRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          map={arenaTexture}
          color="#d4b16a"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Player creature */}
      {activeCard && (
        <group ref={playerCreatureRef} position={[0, 0, -2]} rotation={[0, Math.PI, 0]}>
          <Creature 
            creatureType={activeCard.creatureType}
            position={[0, 0, 0]}
            scale={activeCard.power / 10 + 0.8}
            color={activeCard.color}
          />
          <Text
            position={[0, 2, 0]}
            color="#ffffff"
            fontSize={0.5}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {activeCard.name} - ❤️{battleState.playerHealth} ⚔️{activeCard.power}
          </Text>
        </group>
      )}
      
      {/* Enemy creature */}
      {enemyActiveCard && (
        <group ref={enemyCreatureRef} position={[0, 0, 2]}>
          <Creature 
            creatureType={enemyActiveCard.creatureType}
            position={[0, 0, 0]}
            scale={enemyActiveCard.power / 10 + 0.8}
            color={enemyActiveCard.color}
          />
          <Text
            position={[0, 2, 0]}
            color="#ffffff"
            fontSize={0.5}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            {enemyActiveCard.name} - ❤️{battleState.enemyHealth} ⚔️{enemyActiveCard.power}
          </Text>
        </group>
      )}
      
      {/* Battle outcome message */}
      {battleState.outcome && (
        <Text
          position={[0, 4, 0]}
          color={battleState.outcome === 'win' ? '#4ade80' : '#f43f5e'}
          fontSize={1.2}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {battleState.outcome === 'win' ? 'Victory!' : 'Defeat!'}
        </Text>
      )}
      
      {/* Decorative elements for battle arena */}
      <pointLight position={[5, 8, 5]} intensity={1.5} color="#ffb458" castShadow />
      <pointLight position={[-5, 8, -5]} intensity={1} color="#a175ff" castShadow />
      
      {/* Magic circle on the ground */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4, 4.2, 32]} />
        <meshStandardMaterial color="#7e57c2" emissive="#7e57c2" emissiveIntensity={0.5} />
      </mesh>
    </>
  );
};

export default CardBattle;
