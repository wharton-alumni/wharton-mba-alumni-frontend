import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { profile, token } = useAuth();
  return profile && token ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, token } = useAuth();
  if (!profile || !token) return <Navigate to="/login" replace />;
  return profile.role === 'ADMIN' ? <>{children}</> : <Navigate to="/events" replace />;
}
