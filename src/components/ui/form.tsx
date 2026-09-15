'use client';

import * as React from 'react';

export function FormGroup({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`space-y-1.5 ${className}`}>{children}</div>;
}

export function FormLabel({
  className = '',
  required = false,
  children,
  htmlFor,
}: {
  className?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-medium text-zinc-700 dark:text-zinc-300 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export function FormDescription({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={`text-[11px] text-zinc-500 dark:text-zinc-400 ${className}`}>
      {children}
    </p>
  );
}

export function FormError({
  className = '',
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <p className={`text-[11px] font-medium text-red-500 dark:text-red-400 ${className}`}>
      {children}
    </p>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-2xs transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? 'border-red-500 focus-visible:ring-red-500'
            : 'border-zinc-200 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300'
        } text-zinc-900 dark:text-zinc-100 ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`flex h-9 w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? 'border-red-500 focus-visible:ring-red-500'
            : 'border-zinc-200 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300'
        } text-zinc-900 dark:text-zinc-100 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? 'border-red-500 focus-visible:ring-red-500'
            : 'border-zinc-200 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300'
        } text-zinc-900 dark:text-zinc-100 ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
