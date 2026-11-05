import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { authService } from '../services/authService.js';
import { isFirebaseConfigured } from '../firebase/firebase.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const demoUsers = authService.getDemoUsers();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await authService.loginGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickDemoLogin = async (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setLoading(true);
    setError(null);
    try {
      await authService.login(user.email, user.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Error en inicio rápido.');
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
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In (Firebase Authentication) */}
          {isFirebaseConfigured && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{googleLoading ? 'Iniciando sesión...' : 'Continuar con Google (Firebase)'}</span>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-stone-400">O ingresar con credenciales</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@ariq.org.ar"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
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
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={loading} className="w-full">
                Iniciar Sesión
              </Button>
            </div>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-3">
              <Shield className="w-4 h-4 text-red-600" />
              <span>Acceso Rápido por Rol (Demostración y Pruebas):</span>
            </div>
            <div className="space-y-2">
              {demoUsers.map((u) => (
                <button
                  key={u.role}
                  type="button"
                  onClick={() => handleQuickDemoLogin(u)}
                  className="w-full text-left p-2.5 rounded-lg border border-stone-200 hover:border-red-300 hover:bg-stone-50 transition-colors text-xs flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-stone-900 block capitalize">
                      {u.role === 'admin' ? 'Administrador' : u.role === 'editor' ? 'Editor de Contenidos' : 'Operador de Gestión'}
                    </span>
                    <span className="text-[11px] text-stone-500">{u.email}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-stone-100 rounded text-stone-600">
                    Ingresar &rarr;
                  </span>
                </button>
              ))}
            </div>
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
