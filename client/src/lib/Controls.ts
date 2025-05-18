import { useKeyboardControls } from "@react-three/drei";

// Define game controls as enum
export enum Controls {
  forward = 'forward',
  backward = 'backward',
  leftward = 'leftward', 
  rightward = 'rightward',
  interact = 'interact',
  cardAction1 = 'cardAction1',
  cardAction2 = 'cardAction2',
  cardAction3 = 'cardAction3',
  openCollection = 'openCollection',
  openMenu = 'openMenu',
  cancelAction = 'cancelAction',
}

// Keyboard mapping for controls
export const controlsMap = [
  { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
  { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
  { name: Controls.leftward, keys: ['ArrowLeft', 'KeyA'] },
  { name: Controls.rightward, keys: ['ArrowRight', 'KeyD'] },
  { name: Controls.interact, keys: ['KeyE'] },
  { name: Controls.cardAction1, keys: ['Digit1'] },
  { name: Controls.cardAction2, keys: ['Digit2'] },
  { name: Controls.cardAction3, keys: ['Digit3'] },
  { name: Controls.openCollection, keys: ['KeyC'] },
  { name: Controls.openMenu, keys: ['Escape'] },
  { name: Controls.cancelAction, keys: ['Escape', 'KeyQ'] },
];

// Types for direction input
export type DirectionInput = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

// Hook for handling movement logic
export const useMovementControls = () => {
  const [subscribeKeys, getKeys] = useKeyboardControls<Controls>();
  
  // Calculate movement vector based on key states
  const getMovementVector = (): [number, number] => {
    const keys = getKeys();
    
    // Get current movement state
    let moveX = 0;
    let moveZ = 0;
    
    if (keys.forward) moveZ -= 1;
    if (keys.backward) moveZ += 1;
    if (keys.leftward) moveX -= 1;
    if (keys.rightward) moveX += 1;
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveZ !== 0) {
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= length;
      moveZ /= length;
    }
    
    return [moveX, moveZ];
  };
  
  // Get rotation angle for character based on movement
  const getRotationFromMovement = (moveX: number, moveZ: number): number | null => {
    if (moveX === 0 && moveZ === 0) return null;
    
    // Calculate angle in radians
    return Math.atan2(moveX, -moveZ);
  };
  
  return {
    getMovementVector,
    getRotationFromMovement,
    subscribeKeys,
    getKeys
  };
};

// Debug function for mobile touch controls
export const debugTouch = (x: number, y: number, action: string): void => {
  console.log(`Touch ${action} at x:${x}, y:${y}`);
};

// Map touch swipe directions to keyboard events
export const touchToKeyboardEvent = (
  direction: 'up' | 'down' | 'left' | 'right',
  eventType: 'keydown' | 'keyup'
): void => {
  let keyCode: string;
  
  switch (direction) {
    case 'up':
      keyCode = 'KeyW';
      break;
    case 'down':
      keyCode = 'KeyS';
      break;
    case 'left':
      keyCode = 'KeyA';
      break;
    case 'right':
      keyCode = 'KeyD';
      break;
    default:
      return;
  }
  
  // Dispatch the appropriate keyboard event
  document.dispatchEvent(new KeyboardEvent(eventType, { code: keyCode }));
};

// Helper for detecting swipe direction
export const getSwipeDirection = (
  startX: number, 
  startY: number, 
  endX: number, 
  endY: number,
  threshold = 50
): 'up' | 'down' | 'left' | 'right' | null => {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  
  // Ensure the swipe is long enough to be intentional
  if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
    return null;
  }
  
  // Determine the primary direction of the swipe
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? 'right' : 'left';
  } else {
    return deltaY > 0 ? 'down' : 'up';
  }
};
