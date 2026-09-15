'use client';

import * as React from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface CRMSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export type CRMSelectOptionInput = string | CRMSelectOption;

export interface CRMSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CRMSelectOptionInput[];
  label?: React.ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'table' | 'pill';
  align?: 'left' | 'right';
  error?: string;
  helperText?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  id?: string;
}

export function CRMSelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  searchable = false,
  clearable = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  align = 'left',
  error,
  helperText,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  id,
}: CRMSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Normalize options array
  const normalizedOptions: CRMSelectOption[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = React.useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !search.trim()) return normalizedOptions;
    const q = search.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchable, search]);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  // Focus search input on open
  React.useEffect(() => {
    if (isOpen && searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setSearch('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next >= filteredOptions.length ? 0 : next;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? filteredOptions.length - 1 : next;
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const target = filteredOptions[highlightedIndex];
        if (!target.disabled) {
          onChange(target.value);
          setIsOpen(false);
        }
      } else if (filteredOptions.length === 1 && !filteredOptions[0].disabled) {
        onChange(filteredOptions[0].value);
        setIsOpen(false);
      }
    }
  };

  const handleSelect = (option: CRMSelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  // Size styling
  const sizeStyles = {
    xs: 'h-6 px-2 text-[11px] rounded',
    sm: 'h-7 px-2.5 text-xs rounded-md',
    md: 'h-9 px-3 text-xs rounded-lg',
  };

  // Variant styling
  const variantTriggerStyles = {
    default:
      'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs',
    table:
      'bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-none font-medium',
    pill:
      'bg-zinc-100 dark:bg-zinc-800/80 border border-transparent text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full',
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isOpen ? 'z-40' : 'z-0'} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 select-none"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full inline-flex items-center justify-between gap-1.5 transition-all focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer select-none text-left ${
          sizeStyles[size]
        } ${variantTriggerStyles[variant]} ${
          error
            ? 'border-rose-500 text-rose-600 dark:border-rose-500 dark:text-rose-400 focus:ring-rose-500'
            : isOpen
            ? 'border-zinc-400 dark:border-zinc-600 ring-1 ring-zinc-400/20'
            : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${triggerClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 text-zinc-400">{selectedOption.icon}</span>
          )}
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-zinc-400 font-normal truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              title="Clear"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-150 shrink-0 ${
              isOpen ? 'rotate-180 text-zinc-700 dark:text-zinc-200' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 min-w-[160px] w-full max-w-xs z-50 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-xl animate-fade-in ${menuClassName}`}
        >
          {/* Optional Search Bar */}
          {searchable && (
            <div className="p-1 border-b border-zinc-100 dark:border-zinc-800/80 mb-1 flex items-center gap-1.5 px-2">
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent border-none py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-2.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                        : isHighlighted
                        ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                    } ${opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      {opt.icon && <span className="shrink-0 text-zinc-400">{opt.icon}</span>}
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.description && (
                          <span className="text-[10px] text-zinc-400 font-normal block truncate">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error ? (
        <p className="text-[11px] font-normal text-rose-600 dark:text-rose-400 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
