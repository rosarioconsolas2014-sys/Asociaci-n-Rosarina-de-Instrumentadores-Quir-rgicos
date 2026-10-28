import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Lock, User, LogOut } from 'lucide-react';
import { authService } from '../services/authService.js';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Institucional', path: '/institucional' },
    { label: 'Noticias', path: '/noticias' },
    { label: 'Cursos', path: '/cursos' },
    { label: 'Eventos', path: '/eventos' },
    { label: 'Contacto', path: '/contacto' },
  ];

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top Bar strictly complying with 3-Zone Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark & Logo */}
        <Link
          to="/"
          className="flex items-center gap-3.5 whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded-lg py-1"
        >
          <img
            src="/images/logo-ariq.png"
            alt="Logotipo ARIQ"
            className="w-12 h-12 object-contain shrink-0 rounded-full"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tight text-red-600 leading-none group-hover:text-red-700 transition-colors">
              ARIQ
            </span>
            <span className="text-[11px] font-medium tracking-wide text-stone-500 uppercase mt-0.5 leading-tight">
              Instrumentadores Quirúrgicos Rosario
            </span>
          </div>
        </Link>

        {/* Zone 2: Navigation Links (single-line, concise) */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-600">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                  isActive
                    ? 'text-red-600 font-semibold border-b-2 border-red-600 -mb-px'
                    : 'hover:text-stone-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action / Authentication */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-3.5 h-3.5 text-red-600" />
                <span>Panel ({currentUser.role})</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Área Privada</span>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 shadow-lg">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-50 text-red-700 font-semibold'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-stone-100">
              {currentUser ? (
                <div className="space-y-2">
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium text-stone-800 bg-stone-100 rounded-lg"
                  >
                    <User className="w-4 h-4 text-red-600" />
                    <span>Panel de Control ({currentUser.role})</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>Acceso Área Privada</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
