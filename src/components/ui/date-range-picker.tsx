'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDaysIcon,
  XMarkIcon,
  ChevronDownIcon,
  ClockIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export interface DateRange {
  startDate: string; // YYYY-MM-DD or empty
  endDate: string;   // YYYY-MM-DD or empty
  presetLabel?: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  align?: 'left' | 'right';
}

export function DateRangePicker({
  value,
  onChange,
  className = '',
  align = 'right',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rangeType, setRangeType] = useState<'month' | 'day'>('month');
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [fromDate, setFromDate] = useState(value.startDate || '');
  const [toDate, setToDate] = useState(value.endDate || '');

  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    setFromDate(value.startDate || '');
    setToDate(value.endDate || '');
    if (value.startDate) {
      setFromMonth(value.startDate.slice(0, 7));
    }
    if (value.endDate) {
      setToMonth(value.endDate.slice(0, 7));
    }
  }, [value]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Helper to format display label
  const getDisplayLabel = () => {
    if (value.presetLabel) return value.presetLabel;
    if (!value.startDate && !value.endDate) return 'All Time';
    if (value.startDate && value.endDate) {
      if (value.startDate === value.endDate) {
        return new Date(value.startDate + 'T00:00:00').toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      const s = new Date(value.startDate + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const e = new Date(value.endDate + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${s} → ${e}`;
    }
    if (value.startDate) return `From ${value.startDate}`;
    if (value.endDate) return `Until ${value.endDate}`;
    return 'All Time';
  };

  // Quick Preset Handlers
  const handlePreset = (preset: 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year') => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    if (preset === 'all') {
      onChange({ startDate: '', endDate: '', presetLabel: 'All Time' });
      setFromDate('');
      setToDate('');
      setFromMonth('');
      setToMonth('');
      setIsOpen(false);
      return;
    }

    if (preset === 'this_month') {
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const start = firstDay.toISOString().split('T')[0];
      const end = lastDay.toISOString().split('T')[0];
      const label = firstDay.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      onChange({ startDate: start, endDate: end, presetLabel: `This Month (${label})` });
      setIsOpen(false);
      return;
    }

    if (preset === 'last_month') {
      const firstDay = new Date(currentYear, currentMonth - 1, 1);
      const lastDay = new Date(currentYear, currentMonth, 0);
      const start = firstDay.toISOString().split('T')[0];
      const end = lastDay.toISOString().split('T')[0];
      const label = firstDay.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      onChange({ startDate: start, endDate: end, presetLabel: `Last Month (${label})` });
      setIsOpen(false);
      return;
    }

    if (preset === 'last_3_months') {
      const firstDay = new Date(currentYear, currentMonth - 2, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const start = firstDay.toISOString().split('T')[0];
      const end = lastDay.toISOString().split('T')[0];
      onChange({ startDate: start, endDate: end, presetLabel: 'Last 3 Months' });
      setIsOpen(false);
      return;
    }

    if (preset === 'last_6_months') {
      const firstDay = new Date(currentYear, currentMonth - 5, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const start = firstDay.toISOString().split('T')[0];
      const end = lastDay.toISOString().split('T')[0];
      onChange({ startDate: start, endDate: end, presetLabel: 'Last 6 Months' });
      setIsOpen(false);
      return;
    }

    if (preset === 'this_year') {
      const firstDay = new Date(currentYear, 0, 1);
      const lastDay = new Date(currentYear, 11, 31);
      const start = firstDay.toISOString().split('T')[0];
      const end = lastDay.toISOString().split('T')[0];
      onChange({ startDate: start, endDate: end, presetLabel: `Year ${currentYear}` });
      setIsOpen(false);
      return;
    }
  };

  // Apply Month Range
  const handleApplyMonthRange = () => {
    if (!fromMonth && !toMonth) {
      onChange({ startDate: '', endDate: '', presetLabel: 'All Time' });
      setIsOpen(false);
      return;
    }

    let start = '';
    let end = '';

    if (fromMonth) {
      const [y, m] = fromMonth.split('-').map(Number);
      const firstDay = new Date(y, m - 1, 1);
      start = firstDay.toISOString().split('T')[0];
    }

    if (toMonth) {
      const [y, m] = toMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0);
      end = lastDay.toISOString().split('T')[0];
    } else if (fromMonth) {
      // If only fromMonth provided, default end to end of that month
      const [y, m] = fromMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0);
      end = lastDay.toISOString().split('T')[0];
    }

    onChange({ startDate: start, endDate: end, presetLabel: undefined });
    setIsOpen(false);
  };

  // Apply Date Range
  const handleApplyDateRange = () => {
    if (!fromDate && !toDate) {
      onChange({ startDate: '', endDate: '', presetLabel: 'All Time' });
      setIsOpen(false);
      return;
    }
    onChange({ startDate: fromDate, endDate: toDate || fromDate, presetLabel: undefined });
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange({ startDate: '', endDate: '', presetLabel: 'All Time' });
    setFromDate('');
    setToDate('');
    setFromMonth('');
    setToMonth('');
    setIsOpen(false);
  };

  const isFiltered = Boolean(value.startDate || value.endDate);

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
          isFiltered
            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-200'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80'
        }`}
      >
        <CalendarDaysIcon className={`h-4 w-4 shrink-0 ${isFiltered ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`} />
        <span className="truncate max-w-[210px]">{getDisplayLabel()}</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3.5 animate-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4 text-indigo-500" />
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                Filter by Month & Date Range
              </span>
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Quick Timeframes
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handlePreset('all')}
                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => handlePreset('this_month')}
                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handlePreset('last_month')}
                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => handlePreset('last_3_months')}
                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Last 3 Months
              </button>
              <button
                type="button"
                onClick={() => handlePreset('last_6_months')}
                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Last 6 Months
              </button>
              <button
                type="button"
                onClick={() => handlePreset('this_year')}
                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                This Year
              </button>
            </div>
          </div>

          {/* Mode Switcher: From Month to To Month vs Specific Days */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Custom Selection Mode
              </span>
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={() => setRangeType('month')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    rangeType === 'month'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  By Month
                </button>
                <button
                  type="button"
                  onClick={() => setRangeType('day')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    rangeType === 'day'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Exact Date
                </button>
              </div>
            </div>

            {/* MONTH-TO-MONTH SELECTION */}
            {rangeType === 'month' ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                      From Month
                    </label>
                    <input
                      type="month"
                      value={fromMonth}
                      onChange={(e) => setFromMonth(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                      To Month
                    </label>
                    <input
                      type="month"
                      value={toMonth}
                      onChange={(e) => setToMonth(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyMonthRange}
                  className="w-full mt-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Apply Month Range
                </button>
              </div>
            ) : (
              /* EXACT DATE RANGE SELECTION */
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyDateRange}
                  className="w-full mt-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Apply Exact Date Range
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
