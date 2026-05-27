import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type MotionDirection = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right' | 'none';
type MotionPreset = 'soft' | 'hero' | 'lift' | 'sweep' | 'pop';

interface MotionFrameProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: MotionDirection;
  duration?: number;
  preset?: MotionPreset;
  viewportAmount?: number;
}

const distanceByDirection: Record<MotionDirection, { x: number; y: number }> = {
  up: { x: 0, y: 32 },
  down: { x: 0, y: -24 },
  left: { x: 32, y: 0 },
  right: { x: -32, y: 0 },
  'up-left': { x: 36, y: 30 },
  'up-right': { x: -36, y: 30 },
  'down-left': { x: 36, y: -30 },
  'down-right': { x: -36, y: -30 },
  none: { x: 0, y: 0 },
};

function getMotionState(preset: MotionPreset, offset: { x: number; y: number }) {
  switch (preset) {
    case 'hero':
      return {
        hidden: { opacity: 0, x: offset.x, y: offset.y + 18, scale: 0.96, filter: 'blur(10px)' },
        visible: { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' },
      };
    case 'lift':
      return {
        hidden: { opacity: 0, x: offset.x, y: offset.y + 12, scale: 0.97, rotateX: 7 },
        visible: { opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0 },
      };
    case 'sweep':
      return {
        hidden: { opacity: 0, x: offset.x || -42, y: offset.y, scale: 0.99, clipPath: 'inset(0 18% 0 0 round 24px)' },
        visible: { opacity: 1, x: 0, y: 0, scale: 1, clipPath: 'inset(0 0% 0 0 round 0px)' },
      };
    case 'pop':
      return {
        hidden: { opacity: 0, x: offset.x, y: offset.y, scale: 0.92 },
        visible: { opacity: 1, x: 0, y: 0, scale: 1 },
      };
    case 'soft':
    default:
      return {
        hidden: { opacity: 0, x: offset.x, y: offset.y, scale: 0.985 },
        visible: { opacity: 1, x: 0, y: 0, scale: 1 },
      };
  }
}

export function MotionFrame({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.7,
  preset = 'soft',
  viewportAmount = 0.18,
}: MotionFrameProps) {
  const prefersReducedMotion = useReducedMotion();
  const offset = distanceByDirection[direction];
  const motionState = getMotionState(preset, offset);

  const variants: Variants = {
    hidden: prefersReducedMotion
      ? { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', clipPath: 'none', rotateX: 0 }
      : motionState.hidden,
    visible: {
      ...motionState.visible,
      transition: {
        delay,
        duration,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: viewportAmount }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
