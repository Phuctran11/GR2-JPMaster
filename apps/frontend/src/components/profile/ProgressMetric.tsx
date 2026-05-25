export function ProgressMetric({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-surface">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-headline-sm font-bold text-on-surface">{value}</p>
          <p className="mt-1 text-label-md text-on-surface-variant">{label}</p>
        </div>
        <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
      </div>
    </div>
  );
}
