'use client';

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leadingIcon, trailingIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-zinc-700 dark:text-[#A1A1AA] select-none">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leadingIcon && (
            <div className="absolute left-3 text-zinc-400 dark:text-[#71717A] pointer-events-none flex items-center justify-center">
              {leadingIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-[8px] border bg-white dark:bg-[#1C1C1F] px-3 py-2 text-xs font-normal text-zinc-900 dark:text-[#F5F5F5] placeholder:text-zinc-400 dark:placeholder:text-[#71717A] transition-all focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-[#8B7CFF] focus:border-zinc-400 dark:focus:border-[#8B7CFF] disabled:cursor-not-allowed disabled:opacity-50 ${
              leadingIcon ? 'pl-9' : ''
            } ${trailingIcon ? 'pr-9' : ''} ${
              error
                ? 'border-rose-500 text-rose-600 dark:border-[#F87171] dark:text-[#F87171] focus:ring-rose-500 focus:border-rose-500'
                : 'border-zinc-200 dark:border-[#2C2C31] hover:border-zinc-300 dark:hover:border-[#3F3F46]'
            } ${className}`}
            {...props}
          />

          {trailingIcon && (
            <div className="absolute right-3 text-zinc-400 dark:text-[#71717A] pointer-events-none flex items-center justify-center">
              {trailingIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] font-normal text-rose-600 dark:text-[#F87171]">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-zinc-500 dark:text-[#71717A] font-normal">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
