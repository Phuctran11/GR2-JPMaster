import type { ReactNode } from 'react';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-label-md text-on-surface-variant">
      <span>{label}</span>
      {children}
    </label>
  );
}
