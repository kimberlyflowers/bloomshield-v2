'use client';

import WorkspaceIcon from './WorkspaceIcon';

interface SidebarProps {
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const navigation = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
  { id: 'home', label: 'Home' },
] as const;

export default function Sidebar({ isActive, isCollapsed, onNavigate, currentPage }: SidebarProps) {
  return (
    <aside
      id="workspace-navigation"
      className={`fixed bottom-0 left-0 top-16 z-40 w-56 overflow-y-auto border-r border-workspace-border bg-workspace-panel p-3 md:sticky md:top-16 md:z-auto md:block md:h-[calc(100dvh-4rem)] md:w-auto ${isActive ? 'block' : 'hidden'}`}
    >
      <div className={`mb-5 flex items-center gap-3 rounded-xl border border-workspace-border bg-workspace-field p-3 ${isCollapsed ? 'md:hidden' : ''}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-workspace-highlight text-workspace-accent">
          <WorkspaceIcon name="shield" />
        </span>
        <div>
          <p className="text-sm font-semibold">BloomShield</p>
          <p className="text-xs text-workspace-muted">Creator workspace</p>
        </div>
      </div>

      <nav aria-label="Workspace" className="space-y-1">
        {navigation.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            aria-current={currentPage === id ? 'page' : undefined}
            className={`workspace-nav-item ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}
            title={label}
          >
            <WorkspaceIcon name={id} />
            <span className={isCollapsed ? 'md:sr-only' : undefined}>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
