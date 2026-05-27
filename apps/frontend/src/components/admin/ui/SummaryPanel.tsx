export function SummaryPanel({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
      <h2 className="mb-3 text-headline-sm font-semibold text-on-surface">{title}</h2>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded bg-surface-container-low px-3 py-2">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
