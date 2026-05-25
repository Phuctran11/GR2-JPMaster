import type { AdminTab } from '../adminTypes';

export function AdminSidebar({
  tabs,
  activeTab,
  isOpen,
  onToggle,
  onSelect,
}: {
  tabs: Array<{ id: AdminTab; label: string; icon: string }>;
  activeTab: AdminTab;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (tab: AdminTab) => void;
}) {
  return (
    <aside
      className={`fixed left-0 top-[73px] z-40 flex h-[calc(100vh-73px)] flex-shrink-0 flex-col overflow-y-auto border-r border-outline-variant bg-surface-container-low transition-all duration-300 md:sticky ${
        isOpen ? 'w-72' : 'w-16'
      }`}
    >
      <div className={`flex min-h-14 flex-shrink-0 items-center border-b border-outline-variant bg-surface-container ${isOpen ? 'justify-between px-4' : 'justify-center px-2'}`}>
        {isOpen && (
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-label-sm font-semibold uppercase text-on-surface">Sidebar</h3>
          </div>
        )}
        <button
          type="button"
          className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface shadow-sm transition-colors hover:border-primary hover:text-primary ${isOpen ? 'ml-3' : ''}`}
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className="material-symbols-outlined text-[20px]">{isOpen ? 'menu_open' : 'menu'}</span>
        </button>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={`flex gap-2 border-b border-outline-variant/20 px-3 py-3 transition-colors hover:bg-surface-container ${
                isOpen ? 'items-center justify-start text-left' : 'items-center justify-center text-center'
              } ${isActive ? 'bg-primary/5 font-bold text-primary' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={() => onSelect(tab.id)}
              title={tab.label}
            >
              <span className="flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {tab.icon}
                </span>
              </span>
              <span className={`truncate text-label-sm font-label-sm ${isOpen ? 'inline' : 'hidden'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
