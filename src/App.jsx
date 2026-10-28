import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

// Public Pages
import Home from './pages/Home.jsx';
import Institucional from './pages/Institucional.jsx';
import Noticias from './pages/Noticias.jsx';
import NoticiaDetalle from './pages/NoticiaDetalle.jsx';
import Cursos from './pages/Cursos.jsx';
import Eventos from './pages/Eventos.jsx';
import Contacto from './pages/Contacto.jsx';
import Login from './pages/Login.jsx';

// Admin Pages
import Dashboard from './pages/Dashboard.jsx';
import AdminNoticias from './pages/AdminNoticias.jsx';
import AdminCursos from './pages/AdminCursos.jsx';
import AdminEventos from './pages/AdminEventos.jsx';
import AdminInscripciones from './pages/AdminInscripciones.jsx';
import AdminContacto from './pages/AdminContacto.jsx';
import AdminConfiguracion from './pages/AdminConfiguracion.jsx';
import AdminSistema from './pages/AdminSistema.jsx';

// Security
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Institutional Portal */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/institucional" element={<Institucional />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/noticias/:slug" element={<NoticiaDetalle />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Private Administration Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="operador">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          {/* Content Management (Admin & Editor) */}
          <Route
            path="noticias"
            element={
              <ProtectedRoute requiredRole="editor">
                <AdminNoticias />
              </ProtectedRoute>
            }
          />
          <Route
            path="cursos"
            element={
              <ProtectedRoute requiredRole="editor">
                <AdminCursos />
              </ProtectedRoute>
            }
          />
          <Route
            path="eventos"
            element={
              <ProtectedRoute requiredRole="editor">
                <AdminEventos />
              </ProtectedRoute>
            }
          />

          {/* Operations & Records (Admin, Editor & Operador) */}
          <Route
            path="inscripciones"
            element={
              <ProtectedRoute requiredRole="operador">
                <AdminInscripciones />
              </ProtectedRoute>
            }
          />
          <Route
            path="contacto"
            element={
              <ProtectedRoute requiredRole="operador">
                <AdminContacto />
              </ProtectedRoute>
            }
          />

          {/* System Settings & Database (Admin only) */}
          <Route
            path="configuracion"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminConfiguracion />
              </ProtectedRoute>
            }
          />
          <Route
            path="sistema"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSistema />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
