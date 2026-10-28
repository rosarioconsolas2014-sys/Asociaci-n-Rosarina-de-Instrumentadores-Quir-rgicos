import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Newspaper,
  GraduationCap,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  Database,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import { authService } from '../services/authService.js';
import { isSupabaseConfigured } from '../services/supabase.js';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser() || {
    full_name: 'Usuario Administrador',
    role: 'admin',
    email: 'admin@ariq.org.ar',
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/admin',
      end: true,
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'editor', 'operador'],
    },
    {
      to: '/admin/noticias',
      label: 'Noticias y Novedades',
      icon: Newspaper,
      roles: ['admin', 'editor'],
    },
    {
      to: '/admin/cursos',
      label: 'Cursos y Capacitaciones',
      icon: GraduationCap,
      roles: ['admin', 'editor'],
    },
    {
      to: '/admin/eventos',
      label: 'Agenda y Eventos',
      icon: Calendar,
      roles: ['admin', 'editor'],
    },
    {
      to: '/admin/inscripciones',
      label: 'Inscripciones a Cursos',
      icon: Users,
      roles: ['admin', 'operador', 'editor'],
    },
    {
      to: '/admin/contacto',
      label: 'Consultas de Contacto',
      icon: MessageSquare,
      roles: ['admin', 'operador', 'editor'],
    },
    {
      to: '/admin/configuracion',
      label: 'Datos Institucionales',
      icon: Settings,
      roles: ['admin'],
    },
    {
      to: '/admin/sistema',
      label: 'Supabase & Seguridad',
      icon: Database,
      roles: ['admin'],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    authService.hasPermission(currentUser.role, item.roles[0])
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'operador':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col lg:flex-row text-stone-800">
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-stone-900 text-white px-4 py-3 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/logo-ariq.png"
            alt="ARIQ"
            className="w-8 h-8 rounded-full bg-white p-0.5 object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="font-bold text-sm tracking-tight">ARIQ Gestión</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800 cursor-pointer"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-stone-900 text-stone-300 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header & Brand */}
          <div className="p-6 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo-ariq.png"
                alt="ARIQ"
                className="w-10 h-10 rounded-full bg-white p-0.5 object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="overflow-hidden">
                <span className="font-extrabold text-lg text-white tracking-tight block">ARIQ</span>
                <span className="text-[11px] text-stone-400 block truncate">
                  Panel de Administración
                </span>
              </div>
            </div>

            {/* Supabase connection indicator */}
            <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
              <span className="text-stone-400">Motor de Datos:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                  isSupabaseConfigured
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-stone-800 text-amber-300 border border-stone-700'
                }`}
              >
                {isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Demostración'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-600 text-white font-semibold'
                        : 'text-stone-300 hover:text-white hover:bg-stone-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout in Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-stone-800 text-stone-200 flex items-center justify-center font-bold text-xs uppercase border border-stone-700">
              {currentUser.full_name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser.full_name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getRoleBadge(currentUser.role)}`}>
                  {currentUser.role}
                </span>
                <span className="text-[10px] text-stone-500 truncate">{currentUser.email}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800/80">
            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium text-stone-300 hover:text-white hover:bg-stone-800 rounded transition-colors"
              title="Volver al portal público"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Sitio</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
