'use client';

interface TopBarProps {
  onLogin: () => void;
  isLoggedIn: boolean;
}

export default function TopBar({ onLogin, isLoggedIn }: TopBarProps) {
  return (
    <div className="bg-white px-8 py-4 shadow-md flex justify-between items-center">
      <div className="text-2xl font-semibold text-[#FF8C42]">
        🌸 BloomShield
      </div>
      {!isLoggedIn && (
        <button
          onClick={onLogin}
          className="bg-white text-[#FF8C42] border-2 border-[#FF8C42] px-6 py-2 rounded-lg font-semibold hover:bg-[#FF8C42] hover:text-white transition-all"
        >
          Log in
        </button>
      )}
    </div>
  );
}
