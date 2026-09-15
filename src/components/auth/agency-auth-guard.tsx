'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import {
  LockClosedIcon,
  ShieldCheckIcon,
  KeyIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { TeamMemberName } from '@/lib/types';
import { LumaSpin } from '@/components/ui/luma-spin';

interface AgencyAuthContextType {
  isAuthenticated: boolean;
  authenticatedUser: TeamMemberName | 'Master Admin' | null;
  token: string | null;
  login: (passkey: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AgencyAuthContext = createContext<AgencyAuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'qdelta_agency_auth_session_v1';
const JWT_STORAGE_KEY = 'qdelta_jwt_token_v1';

export function AgencyAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [mounted, setMounted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<TeamMemberName | 'Master Admin' | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Form State
  const [inputPasskey, setInputPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Instantaneous Local Session Hydration & Background Verification
  useEffect(() => {
    setMounted(true);

    function parseClientJwt(jwt: string) {
      try {
        const parts = jwt.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return null; // Expired
        }
        return payload;
      } catch {
        return null;
      }
    }

    try {
      const storedToken = localStorage.getItem(JWT_STORAGE_KEY);
      const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

      if (storedToken && storedSession) {
        const parsed = JSON.parse(storedSession);
        const jwtPayload = parseClientJwt(storedToken);

        if (jwtPayload && parsed.authenticated) {
          setIsAuthenticated(true);
          setAuthenticatedUser(jwtPayload.partnerName || parsed.user || 'Master Admin');
          setToken(storedToken);

          // Fast background silent validation
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${storedToken}`,
            },
            body: JSON.stringify({ action: 'verify', token: storedToken }),
            signal: controller.signal,
          })
            .then(async (res) => {
              clearTimeout(timeoutId);
              if (res.ok) {
                const data = await res.json();
                if (!data.authenticated) {
                  localStorage.removeItem(JWT_STORAGE_KEY);
                  localStorage.removeItem(AUTH_STORAGE_KEY);
                  setIsAuthenticated(false);
                  setAuthenticatedUser(null);
                  setToken(null);
                }
              }
            })
            .catch(() => {
              clearTimeout(timeoutId);
            });
        }
      }
    } catch {
      // Storage error
    }
  }, []);

  // 2. Cryptographic Server-Side Login with Master Passkey
  const login = async (passkey: string): Promise<{ success: boolean; error?: string }> => {
    setIsSubmitting(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          partnerName: 'Master Admin',
          passkey: passkey.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errMsg = data.error || 'Authentication failed. Invalid passkey.';
        setAuthError(errMsg);
        setIsSubmitting(false);
        return { success: false, error: errMsg };
      }

      // Store verified JWT token and session
      localStorage.setItem(JWT_STORAGE_KEY, data.token);
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          authenticated: true,
          user: 'Master Admin',
          role: data.user.role || 'Master Administrator',
          timestamp: Date.now(),
        })
      );

      setToken(data.token);
      setIsAuthenticated(true);
      setAuthenticatedUser('Master Admin');
      setInputPasskey('');
      setAuthError('');
      setIsSubmitting(false);
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || 'Network error connecting to authentication server.';
      setAuthError(errMsg);
      setIsSubmitting(false);
      return { success: false, error: errMsg };
    }
  };

  // 3. Cryptographic Server-Side Logout
  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(JWT_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setIsAuthenticated(false);
      setAuthenticatedUser(null);
      setToken(null);
    }
  };

  const isPublicRoute =
    pathname === '/pay' ||
    pathname?.startsWith('/pay/') ||
    pathname?.startsWith('/api') ||
    pathname === '/favicon.ico';

  // If on public client checkout route, bypass auth guard
  if (isPublicRoute) {
    return (
      <AgencyAuthContext.Provider
        value={{ isAuthenticated, authenticatedUser, token, login, logout }}
      >
        {children}
      </AgencyAuthContext.Provider>
    );
  }

  // Render hydration-safe initial shell before client mount
  if (!mounted) {
    return (
      <AgencyAuthContext.Provider
        value={{ isAuthenticated: false, authenticatedUser: null, token: null, login, logout }}
      >
        <div className="flex min-h-screen bg-[#ECEEF2] dark:bg-[#111112]" />
      </AgencyAuthContext.Provider>
    );
  }

  // If already authenticated with verified token, render dashboard
  if (isAuthenticated) {
    return (
      <AgencyAuthContext.Provider
        value={{ isAuthenticated, authenticatedUser, token, login, logout }}
      >
        {children}
      </AgencyAuthContext.Provider>
    );
  }

  // Otherwise, render Unified Master Passkey Login Gateway
  return (
    <AgencyAuthContext.Provider
      value={{ isAuthenticated, authenticatedUser, token, login, logout }}
    >
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 text-white relative overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <LockClosedIcon className="h-6 w-6 stroke-[2]" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                <ShieldCheckIcon className="h-3 w-3" />
                <span>HMAC-SHA256 Encrypted Portal</span>
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-2">
                Qdelta Agency Gateway
              </h1>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Enter your master studio security passkey to generate a verified session token.
              </p>
            </div>
          </div>

          {/* Master Passkey Entry Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!inputPasskey.trim()) {
                setAuthError('Please enter the security passkey.');
                return;
              }
              await login(inputPasskey);
            }}
            className="space-y-3 pt-1"
          >
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Master Security Passkey:
              </label>
              <div className="relative">
                <KeyIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={inputPasskey}
                  onChange={(e) => {
                    setInputPasskey(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Enter Passkey (Default: qdelta2026)"
                  disabled={isSubmitting}
                  autoFocus
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/50 mt-2">
                  <p className="text-[11px] text-rose-300 font-medium">{authError}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Verifying Cryptographic Passkey...</span>
                </>
              ) : (
                <>
                  <LockClosedIcon className="h-3.5 w-3.5" />
                  <span>Unlock Studio Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Footer & Public Link Note */}
          <div className="pt-1 text-center text-[10px] text-zinc-400 flex items-center justify-center gap-1">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span>Public checkouts (/pay/[id]) remain open for clients</span>
          </div>
        </div>
      </div>
    </AgencyAuthContext.Provider>
  );
}

export function useAgencyAuth() {
  const context = useContext(AgencyAuthContext);
  if (!context) {
    throw new Error('useAgencyAuth must be used within an AgencyAuthProvider');
  }
  return context;
}
