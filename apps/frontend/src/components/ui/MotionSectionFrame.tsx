import type { ReactNode } from 'react';
import { MotionFrame } from './MotionFrame';

interface MotionSectionFrameProps {
  children: ReactNode;
  index: number;
  className?: string;
  preset?: 'soft' | 'hero' | 'lift' | 'sweep' | 'pop';
}

export function MotionSectionFrame({
  children,
  index,
  className = '',
  preset = 'lift',
}: MotionSectionFrameProps) {
  const direction = index % 2 === 0 ? 'up-right' : 'up-left';

  return (
    <MotionFrame
      className={className}
      preset={preset}
      direction={direction}
      delay={Math.min(index * 0.04, 0.16)}
      duration={0.74}
      viewportAmount={0.12}
    >
      {children}
    </MotionFrame>
  );
}
