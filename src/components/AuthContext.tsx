import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AlumniProfile } from '../types/domain';

interface AuthContextValue {
  profile: AlumniProfile | null;
  token: string | null;
  setSession: (token: string, profile: AlumniProfile) => void;
  updateCurrentProfile: (profile: AlumniProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const storedProfile = localStorage.getItem('wharton.profile');
const storedToken = localStorage.getItem('wharton.token');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AlumniProfile | null>(
    storedProfile ? JSON.parse(storedProfile) : null,
  );
  const [token, setToken] = useState<string | null>(storedToken);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      token,
      setSession: (nextToken, nextProfile) => {
        localStorage.setItem('wharton.token', nextToken);
        localStorage.setItem('wharton.profile', JSON.stringify(nextProfile));
        setToken(nextToken);
        setProfile(nextProfile);
      },
      updateCurrentProfile: (nextProfile) => {
        localStorage.setItem('wharton.profile', JSON.stringify(nextProfile));
        setProfile(nextProfile);
      },
      logout: () => {
        localStorage.removeItem('wharton.token');
        localStorage.removeItem('wharton.profile');
        localStorage.removeItem('wharton.biobookProfile');
        setToken(null);
        setProfile(null);
      },
    }),
    [profile, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
