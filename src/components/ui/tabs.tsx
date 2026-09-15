'use client';

import React from 'react';

interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  className = '',
}: TabsProps) {
  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-6 border-b border-zinc-200 dark:border-[#2C2C31] overflow-x-auto ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px cursor-pointer ${
                isActive
                  ? 'border-zinc-900 dark:border-[#8B7CFF] text-zinc-950 dark:text-[#F5F5F5] font-semibold'
                  : 'border-transparent text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F5F5F5] hover:border-zinc-300 dark:hover:border-[#3F3F46]'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full border ${
                    isActive ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-[#232327] dark:text-[#A99CFF] dark:border-[#8B7CFF]/40' : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-[#1C1C1F] dark:text-[#71717A] dark:border-[#2C2C31]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 p-1 rounded-[8px] bg-zinc-100 dark:bg-[#1C1C1F] border border-zinc-200 dark:border-[#2C2C31] overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-white text-zinc-950 font-semibold shadow-2xs border border-zinc-200/80 dark:bg-[#232327] dark:text-[#F5F5F5] dark:border-[#3F3F46]/50'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-950 hover:bg-zinc-200/60 dark:hover:text-[#F5F5F5] dark:hover:bg-[#202023]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full border ${
                  isActive ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-[#2C2C31] dark:text-[#F5F5F5] dark:border-[#3F3F46]' : 'bg-zinc-200/80 text-zinc-500 border-zinc-300/60 dark:bg-[#232327] dark:text-[#71717A] dark:border-[#2C2C31]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
