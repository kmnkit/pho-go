import { useCallback, useState, useRef, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';

/**
 * Gesture recognition configuration
 */
export interface GestureConfig {
  readonly swipeThreshold?: number;
  readonly velocityThreshold?: number;
  readonly cardRotationMax?: number;
  readonly snapBackDuration?: number;
  readonly enableHapticFeedback?: boolean;
  readonly dragBounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
}

/**
 * Gesture direction enum
 */
export enum GestureDirection {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down',
}

/**
 * Gesture event data
 */
export interface GestureEvent {
  readonly direction: GestureDirection;
  readonly velocity: number;
  readonly distance: number;
  readonly duration: number;
  readonly confidence: number; // 0-1 scale based on velocity and distance
}

/**
 * Gesture state
 */
export interface GestureState {
  readonly isDragging: boolean;
  readonly lastGesture: GestureEvent | null;
  readonly gestureAccuracy: number; // Running average of gesture accuracy
  readonly totalGestures: number;
  readonly accurateGestures: number;
}

/**
 * Animation state using CSS transforms
 */
export interface AnimationState {
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly scale: number;
  readonly opacity: number;
}

/**
 * Gesture controls
 */
export interface GestureControls {
  readonly resetPosition: () => void;
  readonly triggerHapticFeedback: (pattern?: 'light' | 'medium' | 'heavy') => void;
  readonly setGestureAccuracy: (accurate: boolean) => void;
  readonly getGestureStats: () => GestureStats;
  readonly animateElement: (element: HTMLElement) => void;
}

/**
 * Gesture statistics for performance monitoring
 */
export interface GestureStats {
  readonly accuracy: number;
  readonly averageVelocity: number;
  readonly preferredDirection: GestureDirection | null;
  readonly responseTime: number; // Average time to complete gesture
}

/**
 * Drag handler function type from @use-gesture/react
 * This represents the props spread returned by useDrag()
 */
export type DragHandlerProps = ReturnType<typeof useDrag>;

/**
 * Return type of useGestureRecognition hook
 */
export interface UseGestureRecognitionReturn extends GestureState, GestureControls {
  readonly animation: AnimationState;
  /** Drag event handler props to spread on target element */
  readonly bindDrag: DragHandlerProps;
  readonly cssTransform: string;
}

/**
 * Default gesture configuration optimized for Japanese commuter use
 */
const DEFAULT_CONFIG: Required<GestureConfig> = {
  swipeThreshold: 100, // Reduced for thumb-friendly operation
  velocityThreshold: 0.3,
  cardRotationMax: 15, // Subtle rotation for better UX
  snapBackDuration: 300,
  enableHapticFeedback: true,
  dragBounds: {
    left: -300,
    right: 300,
    top: -200,
    bottom: 200,
  },
};

/**
 * Custom hook for gesture recognition optimized for mobile flashcard interactions
 * Uses Web Animations API and CSS transforms instead of Java-based libraries
 * @param config - Gesture configuration options
 * @param onGesture - Callback fired when a gesture is recognized
 * @returns Gesture state, controls, and animation values
 */
export const useGestureRecognition = (
  config: GestureConfig = {},
  onGesture?: (gesture: GestureEvent) => void
): UseGestureRecognitionReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [isDragging, setIsDragging] = useState(false);
  const [lastGesture, setLastGesture] = useState<GestureEvent | null>(null);
  const [totalGestures, setTotalGestures] = useState(0);
  const [accurateGestures, setAccurateGestures] = useState(0);
  const [gestureStartTime, setGestureStartTime] = useState<number>(0);
  const [animation, setAnimation] = useState<AnimationState>({
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    opacity: 1,
  });
  
  const velocityHistory = useRef<number[]>([]);
  const responseTimeHistory = useRef<number[]>([]);
  const animationElementRef = useRef<HTMLElement | null>(null);

  // Calculate gesture accuracy percentage
  const gestureAccuracy = totalGestures > 0 ? (accurateGestures / totalGestures) * 100 : 0;

  // Generate CSS transform string
  const cssTransform = `translate3d(${animation.x}px, ${animation.y}px, 0) 
    rotate(${animation.rotation}deg) 
    scale(${animation.scale})`;

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!finalConfig.enableHapticFeedback || !('vibrate' in navigator)) {
      return;
    }

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };

    navigator.vibrate(patterns[pattern]);
  }, [finalConfig.enableHapticFeedback]);

  // Animate element using Web Animations API
  const animateElement = useCallback((element: HTMLElement) => {
    if (!element) return;
    
    animationElementRef.current = element;
    
    // Apply CSS transform immediately for performance
    element.style.transform = cssTransform;
    element.style.opacity = animation.opacity.toString();
    element.style.willChange = 'transform, opacity';
  }, [cssTransform, animation.opacity]);

  // Reset card position with smooth animation
  const resetPosition = useCallback(() => {
    const newAnimation: AnimationState = {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
    };
    
    setAnimation(newAnimation);
    
    // Animate back to center using Web Animations API
    if (animationElementRef.current) {
      const element = animationElementRef.current;
      
      element.animate([
        {
          transform: element.style.transform,
          opacity: element.style.opacity,
        },
        {
          transform: 'translate3d(0px, 0px, 0) rotate(0deg) scale(1)',
          opacity: '1',
        }
      ], {
        duration: finalConfig.snapBackDuration,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards',
      }).addEventListener('finish', () => {
        element.style.willChange = 'auto';
      });
    }
  }, [finalConfig.snapBackDuration]);

  // Determine gesture direction and confidence
  const analyzeGesture = useCallback((
    deltaX: number,
    deltaY: number,
    velocity: number,
    duration: number
  ): GestureEvent | null => {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < finalConfig.swipeThreshold || velocity < finalConfig.velocityThreshold) {
      return null;
    }

    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    let direction: GestureDirection;

    // Determine primary direction based on angle
    if (angle >= -45 && angle <= 45) {
      direction = GestureDirection.RIGHT;
    } else if (angle >= 45 && angle <= 135) {
      direction = GestureDirection.DOWN;
    } else if (angle >= -135 && angle <= -45) {
      direction = GestureDirection.UP;
    } else {
      direction = GestureDirection.LEFT;
    }

    // Calculate confidence based on velocity and distance
    const velocityScore = Math.min(velocity / 2, 1); // Normalize velocity
    const distanceScore = Math.min(distance / (finalConfig.swipeThreshold * 2), 1);
    const confidence = (velocityScore + distanceScore) / 2;

    return {
      direction,
      velocity,
      distance,
      duration,
      confidence,
    };
  }, [finalConfig.swipeThreshold, finalConfig.velocityThreshold]);

  // Drag gesture handler using pure JavaScript
  const bindDrag = useDrag(
    ({ 
      offset: [x, y], 
      velocity: [vx, vy], 
      active
    }) => {
      const velocity = Math.sqrt(vx * vx + vy * vy);
      
      if (active) {
        if (!isDragging) {
          setIsDragging(true);
          setGestureStartTime(Date.now());
          triggerHapticFeedback('light');
        }

        // Apply drag bounds
        const boundedX = Math.max(
          finalConfig.dragBounds.left || -Infinity,
          Math.min(finalConfig.dragBounds.right || Infinity, x)
        );
        const boundedY = Math.max(
          finalConfig.dragBounds.top || -Infinity,
          Math.min(finalConfig.dragBounds.bottom || Infinity, y)
        );

        // Calculate rotation based on horizontal movement
        const rotation = (boundedX / 300) * finalConfig.cardRotationMax;

        // Update animation state
        const newAnimation: AnimationState = {
          x: boundedX,
          y: boundedY,
          rotation,
          scale: 1 + Math.abs(boundedX) * 0.0005, // Subtle scale effect
          opacity: 1 - Math.abs(boundedX) * 0.002, // Fade on extreme swipe
        };
        
        setAnimation(newAnimation);
      } else {
        setIsDragging(false);
        
        const duration = Date.now() - gestureStartTime;
        const gesture = analyzeGesture(x, y, velocity, duration);
        
        if (gesture && gesture.confidence > 0.6) {
          // Valid gesture recognized
          setLastGesture(gesture);
          setTotalGestures(prev => prev + 1);
          
          // Store velocity and response time for statistics (limit history size)
          velocityHistory.current = [...velocityHistory.current.slice(-19), velocity];
          responseTimeHistory.current = [...responseTimeHistory.current.slice(-19), duration];
          
          triggerHapticFeedback('medium');
          onGesture?.(gesture);
        } else {
          // Invalid gesture - snap back
          triggerHapticFeedback('heavy');
        }
        
        // Reset position
        resetPosition();
      }
    },
    {
      axis: undefined, // Allow movement in all directions
      threshold: 10, // Minimum distance to start gesture
      rubberband: true,
    }
  );

  // Update gesture accuracy
  const setGestureAccuracy = useCallback((accurate: boolean) => {
    if (accurate) {
      setAccurateGestures(prev => prev + 1);
    }
  }, []);

  // Get gesture statistics
  const getGestureStats = useCallback((): GestureStats => {
    const velocities = velocityHistory.current;
    const responseTimes = responseTimeHistory.current;
    
    const averageVelocity = velocities.length > 0 
      ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length 
      : 0;
      
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0;

    // TODO: Track preferred direction based on gesture history
    const preferredDirection = null;

    return {
      accuracy: gestureAccuracy,
      averageVelocity,
      preferredDirection,
      responseTime: averageResponseTime,
    };
  }, [gestureAccuracy]);

  // Update CSS transform when animation state changes
  useEffect(() => {
    if (animationElementRef.current) {
      animateElement(animationElementRef.current);
    }
  }, [animation, animateElement]);

  return {
    // State
    isDragging,
    lastGesture,
    gestureAccuracy,
    totalGestures,
    accurateGestures,
    // Animation
    animation,
    cssTransform,
    bindDrag,
    // Controls
    resetPosition,
    triggerHapticFeedback,
    setGestureAccuracy,
    getGestureStats,
    animateElement,
  } as const;
};