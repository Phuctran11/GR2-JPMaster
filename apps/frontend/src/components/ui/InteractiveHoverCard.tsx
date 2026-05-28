import {
  forwardRef,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from 'react';

type SpotlightTone = 'primary' | 'secondary' | 'success' | 'warning';

interface InteractiveHoverCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: SpotlightTone;
  maxTilt?: number;
  spotlightVariant?: number;
}

const spotlightColorMap: Record<SpotlightTone, string> = {
  primary: 'rgb(var(--color-primary) / 0.30)',
  secondary: 'rgb(var(--color-secondary) / 0.28)',
  success: 'rgb(var(--color-success) / 0.26)',
  warning: 'rgb(var(--color-warning) / 0.30)',
};

const spotlightBorderMap: Record<SpotlightTone, string> = {
  primary: 'rgb(var(--color-primary) / 0.48)',
  secondary: 'rgb(var(--color-secondary) / 0.44)',
  success: 'rgb(var(--color-success) / 0.44)',
  warning: 'rgb(var(--color-warning) / 0.48)',
};

const spotlightVariants = [
  { color: 'rgb(var(--color-primary) / 0.30)', border: 'rgb(var(--color-primary) / 0.48)' },
  { color: 'rgb(var(--color-secondary) / 0.30)', border: 'rgb(var(--color-secondary) / 0.48)' },
  { color: 'rgb(var(--color-tertiary) / 0.30)', border: 'rgb(var(--color-tertiary) / 0.48)' },
  { color: 'rgb(var(--color-success) / 0.28)', border: 'rgb(var(--color-success) / 0.46)' },
  { color: 'rgb(var(--color-warning) / 0.30)', border: 'rgb(var(--color-warning) / 0.48)' },
  { color: 'rgb(var(--color-error) / 0.24)', border: 'rgb(var(--color-error) / 0.42)' },
];

function getVariantFromId(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % spotlightVariants.length;
  }
  return hash;
}

function getSpotlightTheme(tone: SpotlightTone, variant?: number) {
  if (typeof variant === 'number') {
    const normalizedVariant = Math.abs(variant) % spotlightVariants.length;
    return spotlightVariants[normalizedVariant];
  }

  return {
    color: spotlightColorMap[tone],
    border: spotlightBorderMap[tone],
  };
}

export const InteractiveHoverCard = forwardRef<HTMLDivElement, InteractiveHoverCardProps>(
  ({ children, className = '', tone = 'primary', maxTilt = 15, spotlightVariant, onPointerMove, onPointerLeave, ...props }, forwardedRef) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const generatedId = useId();
    const spotlightTheme = getSpotlightTheme(tone, spotlightVariant ?? getVariantFromId(generatedId));
    const [isSpotlightActive, setIsSpotlightActive] = useState(false);

    useImperativeHandle(forwardedRef, () => cardRef.current as HTMLDivElement);

    const syncSpotlight = (event: PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return null;

      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      card.style.setProperty('--spotlight-x', `${x}px`);
      card.style.setProperty('--spotlight-y', `${y}px`);

      return { rect, x, y };
    };

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);
      if (event.pointerType === 'touch') return;

      const card = cardRef.current;
      if (!card) return;

      setIsSpotlightActive(true);
      const pointer = syncSpotlight(event);
      if (!pointer) return;

      const { rect, x, y } = pointer;
      const rotateX = ((y - rect.height / 2) / rect.height) * -maxTilt;
      const rotateY = ((x - rect.width / 2) / rect.width) * maxTilt;

      card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale(1.01)`;
    };

    const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event);
      setIsSpotlightActive(false);

      const card = cardRef.current;
      if (!card) return;

      card.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
      card.style.removeProperty('--spotlight-x');
      card.style.removeProperty('--spotlight-y');
    };

    return (
      <div className={`relative [perspective:1000px] ${className}`} {...props}>
        <div
          ref={cardRef}
          onPointerEnter={(event) => {
            if (event.pointerType === 'touch') return;
            setIsSpotlightActive(true);
            syncSpotlight(event);
          }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="relative h-full rounded-[inherit] transition-transform duration-300 ease-out motion-reduce:transform-none"
          style={{
            '--spotlight-color': spotlightTheme.color,
            '--spotlight-border-color': spotlightTheme.border,
            transformStyle: 'preserve-3d',
          } as CSSProperties}
        >
          {children}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 z-20 rounded-[inherit] transition-opacity duration-200 ${
              isSpotlightActive ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background:
                'radial-gradient(320px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), var(--spotlight-color), transparent 58%)',
            }}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 z-20 rounded-[inherit] transition-all duration-200 ${isSpotlightActive ? 'shadow-2xl' : ''}`}
            style={{
              boxShadow: isSpotlightActive
                ? `inset 0 0 0 1px var(--spotlight-border-color), 0 24px 60px -34px var(--spotlight-border-color)`
                : undefined,
            }}
          />
        </div>
      </div>
    );
  },
);

InteractiveHoverCard.displayName = 'InteractiveHoverCard';
