'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'warning' | 'error';
  show: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', show, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const borderColors = {
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500',
  };

  return (
    <div
      className={`fixed top-24 right-8 bg-white px-8 py-6 rounded-xl shadow-2xl border-l-4 ${borderColors[type]} z-[1000] min-w-[300px] animate-slideIn`}
    >
      <p className="text-base font-medium text-gray-800">{message}</p>
    </div>
  );
}
