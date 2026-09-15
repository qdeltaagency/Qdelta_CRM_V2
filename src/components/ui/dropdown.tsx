'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: (DropdownItem | 'divider')[];
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-48 rounded-[8px] border border-zinc-200 dark:border-[#2C2C31] bg-white dark:bg-[#1C1C1F] p-1 shadow-2xl animate-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, index) => {
            if (item === 'divider') {
              return <div key={index} className="my-1 h-px bg-zinc-200 dark:bg-[#2C2C31]" />;
            }

            return (
              <button
                key={index}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                  item.destructive
                    ? 'text-rose-600 dark:text-[#F87171] hover:bg-rose-50 dark:hover:bg-[#7F1D1D]/30'
                    : 'text-zinc-700 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#232327] hover:text-zinc-950 dark:hover:text-[#F5F5F5]'
                }`}
              >
                {item.icon && <span className="shrink-0 text-zinc-400 dark:text-[#71717A]">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
