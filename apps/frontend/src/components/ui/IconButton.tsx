import React from 'react';
import { Icon } from './index';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  badge?: number;
  className?: string;
}

export function IconButton({
  icon,
  size = 'md',
  variant = 'default',
  badge,
  className = '',
  ...props
}: IconButtonProps) {
  const baseClasses = 'p-2 rounded-full transition-colors relative';

  const variantClasses = {
    default: 'hover:bg-surface-container',
    filled: 'bg-primary text-on-primary hover:shadow-lg',
    outline: 'border border-outline-variant hover:border-primary'
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      <Icon name={icon} size={size} />
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1 bg-error text-on-error text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
