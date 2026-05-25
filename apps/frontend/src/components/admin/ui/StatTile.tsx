import type { ReactNode } from 'react';

export function StatTile({ label, value, icon }: { label: string; value: ReactNode; icon: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <p className="mt-3 text-headline-lg font-bold text-on-surface">{value}</p>
    </div>
  );
}
