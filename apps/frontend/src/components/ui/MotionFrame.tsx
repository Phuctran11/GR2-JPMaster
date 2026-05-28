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

const verticalOffsetByDirection: Record<MotionDirection, number> = {
  up: 24,
  down: -20,
  left: 0,
  right: 0,
  'up-left': 24,
  'up-right': 24,
  'down-left': -20,
  'down-right': -20,
  none: 0,
};

function getMotionState(preset: MotionPreset, y: number) {
  switch (preset) {
    case 'hero':
      return {
        hidden: { opacity: 0, y: y + 12 },
        visible: { opacity: 1, y: 0 },
      };
    case 'lift':
      return {
        hidden: { opacity: 0, y: y + 8 },
        visible: { opacity: 1, y: 0 },
      };
    case 'sweep':
      return {
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0 },
      };
    case 'pop':
      return {
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0 },
      };
    case 'soft':
    default:
      return {
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0 },
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
  const motionState = getMotionState(preset, verticalOffsetByDirection[direction]);

  const variants: Variants = {
    hidden: prefersReducedMotion
      ? { opacity: 1, y: 0 }
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
