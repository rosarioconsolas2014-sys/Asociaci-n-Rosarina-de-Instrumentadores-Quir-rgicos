import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { ShieldAlert } from 'lucide-react';
import Button from './Button.jsx';

export default function ProtectedRoute({ children, requiredRole = 'operador' }) {
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAuthorized = authService.hasPermission(currentUser.role, requiredRole);

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Acceso Restringido</h2>
          <p className="text-sm text-stone-600 mb-6">
            Su perfil actual (<strong>{currentUser.role?.toUpperCase()}</strong>) no posee los privilegios requeridos para acceder a esta sección.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => window.history.back()}>
              Volver Atrás
            </Button>
            <Button onClick={() => (window.location.href = '/admin')}>
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
