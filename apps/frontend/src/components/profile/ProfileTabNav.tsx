export type ProfileTabItem<T extends string> = {
  id: T;
  label: string;
  icon: string;
};

export function ProfileTabNav<T extends string>({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Array<ProfileTabItem<T>>;
  activeTab: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-2 rounded-xl border border-outline-variant bg-surface p-2 sm:grid-cols-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-md px-3 text-title-sm font-bold transition-colors ${
            activeTab === tab.id
              ? 'bg-primary text-on-primary shadow-sm'
              : "text-on-surface hover:bg-surface-container [html[data-theme='dark']_&]:text-white/90 [html[data-theme='dark']_&]:hover:bg-surface-container-high [html[data-theme='dark']_&]:hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined shrink-0 text-[18px]">{tab.icon}</span>
          <span className="truncate">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
