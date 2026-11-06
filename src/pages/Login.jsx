import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { authService } from '../services/authService.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.login(identifier, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block group mb-3">
            <img
              src="/images/logo-ariq.png"
              alt="ARIQ"
              className="w-16 h-16 rounded-full mx-auto object-contain bg-white p-1 border border-stone-200 shadow-xs"
              referrerPolicy="no-referrer"
            />
          </Link>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Acceso al Área Administrativa
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Instrumentadores Quirúrgicos Profesionales de Rosario (ARIQ)
          </p>
        </div>

        <Card padding="p-8" className="shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Usuario o Correo Institucional
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin o admin@ariq.org.ar"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={loading} className="w-full">
                Iniciar Sesión
              </Button>
            </div>
          </form>

          {/* Seguridad y Políticas Institucionales */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-center gap-2 text-[11px] text-stone-400 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Autenticación protegida con cifrado bcrypt y bloqueo anti-fuerza bruta</span>
          </div>
        </Card>

        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al portal público de ARIQ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
