import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';

interface AuthGuardProps {
  user: User | null;
  isAdmin?: boolean;
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ user, isAdmin, children }) => {
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">Acesso Restrito</h2>
        <p className="text-stone-600 mb-8">Por favor, entre com sua conta Google para acessar este recurso.</p>
      </div>
    );
  }

  if (isAdmin !== undefined && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
