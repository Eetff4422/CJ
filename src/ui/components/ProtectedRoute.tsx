import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@ui/contexts/AuthContext';
import { RoleId, ROLES } from '@domain/entities/Role';

interface Props {
  allowedRoles: RoleId[];
  children: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gabon-primary">Chargement…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLES[user.role].homeRoute} replace />;
  }

  return <>{children}</>;
}
