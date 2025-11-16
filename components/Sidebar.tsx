'use client';

import { useState } from 'react';

interface SidebarProps {
  isActive: boolean;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Sidebar({ isActive, onNavigate, currentPage }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'home', icon: '⌂', label: 'Home' },
    { id: 'dashboard', icon: '▦', label: 'Dashboard' },
    { id: 'marketplace', icon: '◘', label: 'Marketplace' },
    { id: 'wallet', icon: '⊞', label: 'Wallet' },
    { id: 'profile', icon: '◉', label: 'Profile' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
    { id: 'about', icon: 'ⓘ', label: 'About' },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-screen transition-all duration-400 ease-in-out z-[999] flex flex-col py-8 shadow-xl ${
        isActive ? 'translate-x-0' : '-translate-x-full'
      } ${isCollapsed ? 'w-[70px]' : 'w-[280px]'}`}
      style={{
        background: 'linear-gradient(180deg, #FFB5B5 0%, #FFAD99 30%, #FFA57A 60%, #FF9D5C 100%)',
      }}
    >
      <div className={`px-6 mb-8 flex items-center ${isCollapsed ? 'justify-center px-3' : 'justify-between'}`}>
        {!isCollapsed && (
          <h2 className="text-white text-3xl font-bold transition-opacity duration-300">
            🌸 BloomShield
          </h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-white/20 hover:bg-white/30 text-white w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-all flex-shrink-0"
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center text-white font-medium transition-all border-l-4 ${
              currentPage === item.id
                ? 'bg-white/25 border-white'
                : 'border-transparent hover:bg-white/15'
            } ${isCollapsed ? 'px-0 py-4 justify-center' : 'px-6 py-4'}`}
          >
            <span className={`text-2xl ${isCollapsed ? 'mr-0' : 'mr-4'}`}>{item.icon}</span>
            {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
