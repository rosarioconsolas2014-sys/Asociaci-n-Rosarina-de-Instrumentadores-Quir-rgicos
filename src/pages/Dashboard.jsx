import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Newspaper,
  GraduationCap,
  Calendar,
  Users,
  MessageSquare,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { noticiasService } from '../services/noticiasService.js';
import { cursosService } from '../services/cursosService.js';
import { eventosService } from '../services/eventosService.js';
import { inscripcionesService } from '../services/inscripcionesService.js';
import { contactoService } from '../services/contactoService.js';
import { authService } from '../services/authService.js';

export default function Dashboard() {
  const currentUser = authService.getCurrentUser();
  const [stats, setStats] = useState({
    noticiasTotal: 0,
    noticiasPublicadas: 0,
    cursosTotal: 0,
    eventosTotal: 0,
    inscripcionesTotal: 0,
    inscripcionesPendientes: 0,
    contactosTotal: 0,
    contactosNoLeidos: 0,
    usuariosTotal: 0,
  });

  const [recentInscripciones, setRecentInscripciones] = useState([]);
  const [recentContactos, setRecentContactos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [news, courses, events, enrollments, contacts, users] = await Promise.all([
          noticiasService.getNoticias(),
          cursosService.getCursos(),
          eventosService.getEventos(),
          inscripcionesService.getInscripciones(),
          contactoService.getContactos(),
          authService.listUsers().catch(() => []),
        ]);

        setStats({
          noticiasTotal: news.length,
          noticiasPublicadas: news.filter((n) => n.estado === 'publicada').length,
          cursosTotal: courses.length,
          eventosTotal: events.length,
          inscripcionesTotal: enrollments.length,
          inscripcionesPendientes: enrollments.filter((i) => i.estado === 'pendiente').length,
          contactosTotal: contacts.length,
          contactosNoLeidos: contacts.filter((c) => !c.leido).length,
          usuariosTotal: users.length,
        });

        setRecentInscripciones(enrollments.slice(0, 5));
        setRecentContactos(contacts.slice(0, 5));
      } catch (err) {
        console.error('Error al cargar dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
            Panel de Gestión ARIQ
          </span>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">
            Bienvenido/a, {currentUser?.full_name || 'Colega'}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Rol actual: <strong className="uppercase">{currentUser?.role}</strong> · Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {authService.hasPermission(currentUser?.role, 'editor') && (
            <>
              <Link to="/admin/noticias?nueva=1">
                <Button size="sm" icon={Plus}>
                  Nueva Noticia
                </Button>
              </Link>
              <Link to="/admin/cursos?nuevo=1">
                <Button variant="outline" size="sm" icon={Plus}>
                  Nuevo Curso
                </Button>
              </Link>
            </>
          )}
          <Link to="/" target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" icon={ExternalLink}>
              Portal Público
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid - 5 Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Noticias */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Noticias
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Newspaper className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">
              {stats.noticiasTotal}
            </span>
            <span className="text-xs text-stone-500">
              ({stats.noticiasPublicadas} pub.)
            </span>
          </div>
          <Link
            to="/admin/noticias"
            className="text-xs font-medium text-red-600 hover:text-red-700 inline-flex items-center gap-1 mt-3"
          >
            <span>Noticias</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Cursos */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Cursos
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">
              {stats.cursosTotal}
            </span>
            <span className="text-xs text-stone-500">
              Activos
            </span>
          </div>
          <Link
            to="/admin/cursos"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mt-3"
          >
            <span>Cursos</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Eventos */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Eventos
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">
              {stats.eventosTotal}
            </span>
            <span className="text-xs text-stone-500">
              Agendados
            </span>
          </div>
          <Link
            to="/admin/eventos"
            className="text-xs font-medium text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 mt-3"
          >
            <span>Eventos</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Consultas */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Consultas
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">
              {stats.contactosTotal}
            </span>
            {stats.contactosNoLeidos > 0 && (
              <span className="text-xs font-semibold text-rose-600">
                ({stats.contactosNoLeidos} nuevas)
              </span>
            )}
          </div>
          <Link
            to="/admin/contacto"
            className="text-xs font-medium text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 mt-3"
          >
            <span>Mensajes</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Usuarios del Panel */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Usuarios Panel
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">
              {stats.usuariosTotal}
            </span>
            <span className="text-xs text-stone-500">
              Registrados
            </span>
          </div>
          <Link
            to="/admin/usuarios"
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 mt-3"
          >
            <span>Gestión</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* Two-Column Operational Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inscriptions */}
        <Card padding="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Últimas Inscripciones a Cursos</h3>
              <p className="text-xs text-stone-500">Postulaciones recibidas recientemente</p>
            </div>
            <Link
              to="/admin/inscripciones"
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Ver todas &rarr;
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {recentInscripciones.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No hay inscripciones registradas.</p>
            ) : (
              recentInscripciones.map((ins) => (
                <div key={ins.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-stone-900 block">{ins.nombre_completo}</span>
                    <span className="text-stone-500 block truncate max-w-xs">
                      {ins.cursos?.nombre || ins.curso_nombre || 'Curso'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ins.estado === 'confirmada'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ins.estado === 'rechazada'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {ins.estado}
                    </span>
                    <span className="block text-[10px] text-stone-400 mt-0.5">
                      {new Date(ins.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Inquiries */}
        <Card padding="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Consultas de Contacto Recientes</h3>
              <p className="text-xs text-stone-500">Mensajes de socios y profesionales</p>
            </div>
            <Link
              to="/admin/contacto"
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Ver todas &rarr;
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {recentContactos.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No hay mensajes recientes.</p>
            ) : (
              recentContactos.map((c) => (
                <div key={c.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-stone-900">{c.nombre_completo}</span>
                      {!c.leido && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" title="No leído" />
                      )}
                    </div>
                    <p className="text-stone-500 truncate">{c.mensaje}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      {c.motivo}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(c.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
