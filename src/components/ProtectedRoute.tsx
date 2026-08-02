import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  return profile ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile) return <Navigate to="/login" replace />;
  return profile.role === 'ADMIN' ? <>{children}</> : <Navigate to="/events" replace />;
}
