'use client';

interface TopBarProps {
  onLogin: () => void;
  isLoggedIn: boolean;
  onToggleSidebar?: () => void;
  onLogoClick?: () => void;
}

export default function TopBar({ onLogin, isLoggedIn, onToggleSidebar, onLogoClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-bloom-border bg-bloom-panel text-bloom-text">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
        <div className="flex items-center gap-3">
          {isLoggedIn && onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="bloom-secondary grid h-10 w-10 place-items-center rounded-lg text-lg"
              aria-label="Toggle menu"
            >
              ☰
            </button>
          )}
          <button type="button" onClick={onLogoClick} className="flex items-center gap-2.5 rounded-lg font-bold">
            <span className="bloom-mark h-9 w-9 rounded-[10px]" aria-hidden="true">B</span>
            BloomShield
          </button>
        </div>
        {isLoggedIn ? (
          <span className="text-sm text-bloom-muted">Welcome!</span>
        ) : (
          <button type="button" onClick={onLogin} className="bloom-secondary rounded-lg px-4 py-2 text-sm font-semibold">
            Log in
          </button>
        )}
      </div>
    </header>
  );
}
