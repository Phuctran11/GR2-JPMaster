interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  variant?: 'default' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIndicator?: boolean;
}

export function ProgressBar({
  value,
  showLabel = true,
  variant = 'default',
  size = 'md',
  className = '',
  showIndicator = true
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: 'bg-primary',
    secondary: 'bg-secondary'
  };

  const clampedValue = Math.min(Math.max(value, 0), 100);
  const displayValue = Number.isInteger(clampedValue) ? clampedValue : clampedValue.toFixed(2);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-label-md text-outline">{displayValue}% Complete</span>
        </div>
      )}
      <div className={`w-full ${sizeClasses[size]} bg-surface-container-high rounded-full overflow-hidden`}>
        <div
          className={`relative ${sizeClasses[size]} ${variantClasses[variant]} rounded-full transition-all duration-300`}
          style={{ width: `${clampedValue}%` }}
        >
          {showIndicator && size !== 'sm' && (
            <div className="absolute -right-1 -top-1 w-3 h-3 bg-secondary-fixed-dim rounded-full shadow-sm"></div>
          )}
        </div>
      </div>
    </div>
  );
}
