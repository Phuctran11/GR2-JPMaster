interface LevelBadgeProps {
  level: string;
  variant?: 'glass' | 'solid' | 'outline';
  className?: string;
}

export function LevelBadge({
  level,
  variant = 'solid',
  className = ''
}: LevelBadgeProps) {
  const baseStyles = 'px-3 py-1 rounded text-[12px] font-bold tracking-wider uppercase';

  const variants = {
    glass: 'bg-white/20 backdrop-blur-md text-white',
    solid: 'bg-primary text-on-primary',
    outline: 'border border-primary text-primary'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {level}
    </span>
  );
}
