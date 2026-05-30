import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Container } from './index';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const navigate = useNavigate();
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const header = document.querySelector('[data-app-header]');
    if (!(header instanceof HTMLElement)) return;

    const updateHeaderHeight = () => {
      setHeaderHeight(header.offsetHeight);
    };

    updateHeaderHeight();

    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(header);
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('orientationchange', updateHeaderHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('orientationchange', updateHeaderHeight);
    };
  }, []);

  return (
    <nav
      className="sticky z-40 bg-surface/95 py-3 border-b border-outline-variant backdrop-blur-md"
      style={{ top: `${headerHeight}px` }}
      aria-label="Breadcrumb"
    >
      <Container>
        <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="material-symbols-outlined text-[16px] text-outline-variant">
                  chevron_right
                </span>
              )}
              {item.path ? (
                <button
                  onClick={() => navigate(item.path!)}
                  className="text-primary hover:underline transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-on-surface">{item.label}</span>
              )}
            </div>
          ))}
        </div>
      </Container>
    </nav>
  );
}
