'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, type = 'info' }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      const newToast: ToastItem = { id, title, description, type };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const iconMap = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-[#34D399] shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-rose-500 dark:text-[#F87171] shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-[#F5B74F] shrink-0" />,
    info: <Info className="h-4 w-4 text-indigo-500 dark:text-[#8B7CFF] shrink-0" />,
  };

  const borderMap = {
    success: 'border-emerald-200 dark:border-[#34D399]/30 bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-[#F5F5F5]',
    error: 'border-rose-200 dark:border-[#F87171]/30 bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-[#F5F5F5]',
    warning: 'border-amber-200 dark:border-[#F5B74F]/30 bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-[#F5F5F5]',
    info: 'border-indigo-200 dark:border-[#8B7CFF]/30 bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-[#F5F5F5]',
  };

  const contextValue = React.useMemo(() => ({ toast, removeToast }), [toast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Viewport */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-[10px] border shadow-2xl backdrop-blur-xs transition-all animate-fade-in ${
              borderMap[t.type || 'info']
            }`}
          >
            {iconMap[t.type || 'info']}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-[#F5F5F5]">{t.title}</h4>
              {t.description && <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded text-zinc-400 dark:text-[#71717A] hover:text-zinc-900 dark:hover:text-[#F5F5F5] hover:bg-zinc-100 dark:hover:bg-[#232327] transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
