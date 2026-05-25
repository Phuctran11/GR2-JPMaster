import type { ReactNode } from 'react';
import { secondaryButtonClass } from '../adminClasses';

export function Modal({
  title,
  subtitle,
  children,
  onClose,
  size = 'md',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  size?: 'md' | 'lg' | 'xl';
}) {
  const sizeClass = size === 'xl' ? 'max-w-5xl' : size === 'lg' ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className={`max-h-[90vh] w-full ${sizeClass} overflow-y-auto rounded-lg border border-outline-variant bg-surface shadow-xl`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-outline-variant bg-surface px-5 py-4">
          <div>
            <h2 className="text-headline-sm font-semibold text-on-surface">{title}</h2>
            {subtitle && <p className="mt-1 text-label-md text-on-surface-variant">{subtitle}</p>}
          </div>
          <button className={secondaryButtonClass} onClick={onClose} type="button" aria-label="Close modal">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
