'use client';

import WorkspaceIcon from './WorkspaceIcon';

interface TopBarProps {
  onLogin: () => void;
  isLoggedIn: boolean;
  onToggleSidebar?: () => void;
  onLogoClick?: () => void;
  sidebarOpen?: boolean;
  sidebarCollapsed?: boolean;
  onCollapseSidebar?: () => void;
  accountName?: string;
  onProfile?: () => void;
}

export default function TopBar({
  onLogin, isLoggedIn, onToggleSidebar, onLogoClick, sidebarOpen, sidebarCollapsed, onCollapseSidebar, accountName, onProfile,
}: TopBarProps) {
  if (isLoggedIn) {
    const initial = accountName?.trim().charAt(0).toUpperCase() || 'B';

    return (
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b border-workspace-border bg-workspace-panel px-4 text-workspace-text sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="grid h-11 w-11 place-items-center rounded-lg border border-workspace-border text-workspace-muted md:hidden"
            aria-label="Toggle workspace navigation"
            aria-controls="workspace-navigation"
            aria-expanded={sidebarOpen}
          >
            <WorkspaceIcon name="menu" />
          </button>
          <button
            type="button"
            onClick={onCollapseSidebar}
            className="hidden h-9 w-9 place-items-center rounded-lg border border-workspace-border text-workspace-muted md:grid"
            aria-label={sidebarCollapsed ? 'Expand workspace navigation' : 'Collapse workspace navigation'}
            aria-controls="workspace-navigation"
            aria-expanded={!sidebarCollapsed}
          >
            <WorkspaceIcon name="menu" />
          </button>
          <button type="button" onClick={onLogoClick} className="flex items-center gap-2.5 rounded-lg font-bold">
            <span className="workspace-gradient grid h-9 w-9 place-items-center rounded-[10px]" aria-hidden="true">
              <WorkspaceIcon name="shield" />
            </span>
            BloomShield
          </button>
        </div>
        <button
          type="button"
          onClick={onProfile}
          aria-label="Open profile"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full md:h-9 md:w-9 border border-workspace-border bg-workspace-highlight text-sm font-bold text-workspace-accent"
        >
          {initial}
        </button>
      </header>
    );
  }

  return (
    <div className="bg-white px-4 md:px-8 py-4 shadow-md flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2 md:gap-4">
        <div
          className="text-xl md:text-2xl font-semibold text-[#FF8C42] cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onLogoClick}
          title="Go to homepage"
        >
          🌸 BloomShield
        </div>
      </div>
      <button
        onClick={onLogin}
        className="bg-white text-[#FF8C42] border-2 border-[#FF8C42] px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-[#FF8C42] hover:text-white transition-all"
      >
        Log in
      </button>
    </div>
  );
}
