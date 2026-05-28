interface StatusBadgeProps {
  status: 'In Progress' | 'Completed' | 'Not Started';
  variant?: 'filled' | 'outline';
  className?: string;
}

export function StatusBadge({
  status,
  variant = 'filled',
  className = ''
}: StatusBadgeProps) {
  const baseStyles = 'px-3 py-1 rounded text-[12px] font-bold inline-block';

  const statusStyles = {
    'In Progress': {
      filled: 'bg-secondary text-on-secondary',
      outline: 'border border-secondary text-secondary'
    },
    'Completed': {
      filled: 'bg-success-container text-on-success-container',
      outline: 'border border-success text-success'
    },
    'Not Started': {
      filled: 'bg-surface-container-high text-on-surface-variant',
      outline: 'border border-outline text-on-surface-variant'
    }
  };

  return (
    <span className={`${baseStyles} ${statusStyles[status][variant]} ${className}`}>
      {status}
    </span>
  );
}
