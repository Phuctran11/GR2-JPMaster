import { Icon } from './index';

interface SocialLink {
  icon: string;
  url: string;
  label: string;
}

interface SocialLinksProps {
  links: SocialLink[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SocialLinks({ links, size = 'md', className = '' }: SocialLinksProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex gap-4 ${className}`}>
      {links.map((link) => (
        <a
          key={link.icon}
          href={link.url}
          title={link.label}
          className={`${sizeClasses[size]} rounded-full bg-surface border border-outline-variant flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all`}
        >
          <Icon name={link.icon} size={size === 'lg' ? 'md' : 'sm'} />
        </a>
      ))}
    </div>
  );
}
