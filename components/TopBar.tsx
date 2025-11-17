'use client';

interface TopBarProps {
  onLogin: () => void;
  isLoggedIn: boolean;
  onToggleSidebar?: () => void;
  onLogoClick?: () => void;
}

export default function TopBar({ onLogin, isLoggedIn, onToggleSidebar, onLogoClick }: TopBarProps) {
  return (
    <div className="bg-white px-4 md:px-8 py-4 shadow-md flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Only show hamburger menu when logged in */}
        {isLoggedIn && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="text-2xl text-[#FF8C42] hover:bg-orange-50 w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label="Toggle menu"
            title="Open menu"
          >
            ☰
          </button>
        )}
        <div
          className="text-xl md:text-2xl font-semibold text-[#FF8C42] cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onLogoClick}
          title="Go to homepage"
        >
          🌸 BloomShield
        </div>
      </div>
      {!isLoggedIn && (
        <button
          onClick={onLogin}
          className="bg-white text-[#FF8C42] border-2 border-[#FF8C42] px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-[#FF8C42] hover:text-white transition-all"
        >
          Log in
        </button>
      )}
      {isLoggedIn && (
        <div className="text-sm text-gray-600">
          Welcome! 👋
        </div>
      )}
    </div>
  );
}
