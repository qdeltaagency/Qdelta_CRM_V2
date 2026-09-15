'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode | string;
  description?: string;
}

export interface CustomSelectProps {
  label?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
  searchable?: boolean;
  onClear?: () => void;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search options...',
  error,
  icon,
  clearable = false,
  searchable = false,
  onClear,
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  return (
    <div className={`relative w-full ${isOpen ? 'z-30' : 'z-0'} ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5">
            {label}
          </div>
          <div className="flex items-center gap-2">
            {error && <span className="text-[10px] text-rose-500 font-normal">{error}</span>}
            {clearable && value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-zinc-50/90 dark:bg-zinc-900/90 border rounded-xl text-xs text-left transition-all shadow-2xs cursor-pointer ${
          error
            ? 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/15'
            : isOpen
            ? 'border-zinc-500 dark:border-zinc-400 ring-2 ring-zinc-400/10'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="text-zinc-400 shrink-0">{icon}</span>}
          {selectedOption ? (
            <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ChevronDownIcon
            className={`h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-zinc-700 dark:text-zinc-200' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#18181B] p-1 shadow-2xl animate-fade-in max-h-64 overflow-hidden flex flex-col">
          {searchable && (
            <div className="p-1 border-b border-zinc-100 dark:border-zinc-800/80 mb-1 shrink-0">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <MagnifyingGlassIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent border-0 p-0 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-0"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto max-h-48 space-y-0.5 flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={`${option.value}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-white font-normal'
                    }`}
                  >
                    <span className="truncate flex-1">{option.label}</span>
                    {isSelected && (
                      <CheckIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-[11px] text-zinc-400">
                No matching options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
