'use client';

import React from 'react';

interface LumaSpinProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | number;
}

export const LumaSpin: React.FC<LumaSpinProps> = ({ className = '', size = 'sm' }) => {
  const scale =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 0.65
      : size === 'md'
      ? 0.85
      : 1;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width: Math.round(65 * scale),
        height: Math.round(65 * scale),
      }}
    >
      <div
        className="relative w-[65px] aspect-square origin-center shrink-0"
        style={{ transform: `scale(${scale})` }}
      >
        <span className="absolute rounded-[50px] animate-loaderAnim shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100" />
        <span className="absolute rounded-[50px] animate-loaderAnim animation-delay shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100" />
      </div>
      <style>{`
        @keyframes loaderAnim {
          0% {
            inset: 0 35px 35px 0;
          }
          12.5% {
            inset: 0 35px 0 0;
          }
          25% {
            inset: 35px 35px 0 0;
          }
          37.5% {
            inset: 35px 0 0 0;
          }
          50% {
            inset: 35px 0 0 35px;
          }
          62.5% {
            inset: 0 0 0 35px;
          }
          75% {
            inset: 0 0 35px 35px;
          }
          87.5% {
            inset: 0 0 35px 0;
          }
          100% {
            inset: 0 35px 35px 0;
          }
        }
        .animate-loaderAnim {
          animation: loaderAnim 2.5s infinite ease-in-out;
        }
        .animation-delay {
          animation-delay: -1.25s;
        }
      `}</style>
    </div>
  );
};

export const Component = LumaSpin;
export default LumaSpin;
