import type { ReactNode } from 'react';
import { actionButtonClass } from '../adminClasses';

export function SectionToolbar({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-headline-sm font-semibold text-on-surface">{title}</h2>
        <div className="flex flex-1 flex-col gap-3 md:flex-row lg:max-w-2xl">{children}</div>
        {actionLabel && onAction && (
          <button className={actionButtonClass} onClick={onAction}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
