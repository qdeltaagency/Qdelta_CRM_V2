'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'lg',
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 dark:bg-black/70 backdrop-blur-xs flex justify-end animate-fade-in">
      <div
        className={`w-full ${widthStyles[width]} h-full bg-white dark:bg-[#1C1C1F] border-l border-zinc-200 dark:border-[#2C2C31] shadow-2xl flex flex-col justify-between`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 md:p-6 border-b border-zinc-200 dark:border-[#2C2C31] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base md:text-lg text-zinc-900 dark:text-[#F5F5F5] tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-500 dark:text-[#71717A] font-normal mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-zinc-400 dark:text-[#71717A] hover:text-zinc-900 dark:hover:text-[#F5F5F5] hover:bg-zinc-100 dark:hover:bg-[#232327] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 text-zinc-800 dark:text-[#F5F5F5]">{children}</div>
      </div>
    </div>
  );
}
