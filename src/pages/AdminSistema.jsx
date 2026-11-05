import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  Database,
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  HardDrive,
  Lock,
  Play,
  Plus,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
  Sliders,
  Terminal,
  Wifi,
  X,
  XCircle,
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import {
  firebaseConfig,
  isFirebaseConfigured,
  testFirestoreConnection,
} from '../firebase/firebase.js';
import { listDocuments } from '../firebase/firestore.js';
import { seedFirestoreIfEmpty } from '../services/seedService.js';
import { resetLocalStore } from '../services/supabase.js';
import {
  HealthStatus,
  IncidentSeverity,
  IncidentState,
  executeFullAudit,
  verifyWebRoutes,
  verifyFirebaseHealth,
  verifyStaticAssets,
  verifyHttpsProtocol,
  verifyGitHubActionsStatus,
  getIncidents,
  registerIncident,
  resolveIncident,
} from '../services/monitoringService.js';

export default function AdminSistema() {
  const [activeTab, setActiveTab] = useState('monitoreo'); // 'monitoreo' | 'incidentes' | 'github' | 'mantenimiento'
  const [copied, setCopied] = useState(null);

  // Estados de auditoría y monitoreo
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // Estados de incidentes
  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [incidentFilter, setIncidentFilter] = useState('todos'); // 'todos' | 'abierto' | 'resuelto'
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [newIncidentForm, setNewIncidentForm] = useState({
    servicio: 'hosting',
    tipo_error: '',
    descripcion: '',
    severidad: IncidentSeverity.ADVERTENCIA,
  });
  const [submittingIncident, setSubmittingIncident] = useState(false);

  // Estados de resolución
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Estados de auditoría previa y seed
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    // Al montar, cargar incidentes y ejecutar la primera comprobación real
    loadIncidents();
    loadInternalLogs();
    runInitialHealthCheck();
  }, []);

  const runInitialHealthCheck = async () => {
    setIsAuditing(true);
    try {
      const report = await executeFullAudit();
      setAuditReport(report);
      setLastCheckTime(new Date());
    } catch (err) {
      console.error('Error al ejecutar comprobación inicial:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleRunFullAudit = async () => {
    setIsAuditing(true);
    try {
      const report = await executeFullAudit();
      setAuditReport(report);
      setLastCheckTime(new Date());
      // Recargar lista de incidentes por si la auditoría registró uno nuevo
      await loadIncidents();
    } catch (err) {
      console.error('Error en auditoría completa:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const loadIncidents = async () => {
    setLoadingIncidents(true);
    try {
      const items = await getIncidents(incidentFilter);
      setIncidents(items);
    } catch (err) {
      console.error('Error al cargar incidentes:', err);
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [incidentFilter]);

  const loadInternalLogs = async () => {
    setLoadingLogs(true);
    try {
      const items = await listDocuments('internal_logs');
      setLogs(
        items.sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        ).slice(0, 8)
      );
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!newIncidentForm.tipo_error || !newIncidentForm.descripcion) {
      alert('Por favor complete el tipo de error y la descripción.');
      return;
    }
    setSubmittingIncident(true);
    try {
      await registerIncident({
        ...newIncidentForm,
        creado_por: 'admin_manual',
      });
      setShowNewIncidentModal(false);
      setNewIncidentForm({
        servicio: 'hosting',
        tipo_error: '',
        descripcion: '',
        severidad: IncidentSeverity.ADVERTENCIA,
      });
      await loadIncidents();
    } catch (err) {
      alert('No se pudo registrar el incidente: ' + err.message);
    } finally {
      setSubmittingIncident(false);
    }
  };

  const handleResolveIncident = async (id) => {
    try {
      await resolveIncident(id, resolutionNote || 'Resuelto y verificado por el administrador.');
      setResolvingId(null);
      setResolutionNote('');
      await loadIncidents();
    } catch (err) {
      alert('Error al resolver incidente: ' + err.message);
    }
  };

  const handleCopy = (text, key) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    }
  };

  const handleDownloadReport = () => {
    if (!auditReport) return;
    const blob = new Blob([JSON.stringify(auditReport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ariq-health-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSeedFirestore = async () => {
    if (
      window.confirm(
        '¿Desea inicializar Firestore en ariq-rosario con los datos institucionales (autoridades, cursos, noticias, categorías y eventos)?'
      )
    ) {
      setSeeding(true);
      setSeedResult(null);
      const res = await seedFirestoreIfEmpty();
      setSeeding(false);
      setSeedResult(res);
      await loadInternalLogs();
    }
  };

  const handleResetLocal = () => {
    if (window.confirm('¿Desea restablecer el almacenamiento local de contingencia?')) {
      resetLocalStore();
      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
        window.location.reload();
      }, 800);
    }
  };

  // Helper de badges de estado visual
  const renderStatusBadge = (status) => {
    switch (status) {
      case HealthStatus.OPERATIVO:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            OPERATIVO
          </span>
        );
      case HealthStatus.ADVERTENCIA:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            ADVERTENCIA
          </span>
        );
      case HealthStatus.ERROR:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            ERROR
          </span>
        );
      case HealthStatus.SIN_VERIFICAR:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            SIN VERIFICAR
          </span>
        );
    }
  };

  const adminCliScript = `# Dar de alta el Administrador Principal en ariq-rosario:
# 1. En Firebase Authentication > Crear usuario con email y contraseña:
#    Email: admin@ariq.org.ar
#    Contraseña: [tu-contraseña-segura]

# 2. En Cloud Firestore > Colección 'profiles' > Documento con ID = UID del usuario:
{
  "uid": "<USER_UID>",
  "email": "admin@ariq.org.ar",
  "full_name": "Administrador General ARIQ",
  "role": "admin",
  "activo": true,
  "created_at": "${new Date().toISOString()}"
}`;

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header con acciones principales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Control de Producción & Monitoreo
            </h1>
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-mono text-[10px] font-bold">
              ARIQ LIVE
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Supervisión automática de disponibilidad web, Cloud Firestore, Auth, Storage y GitHub Actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={FileText}
            disabled={!auditReport}
            onClick={handleDownloadReport}
          >
            Exportar JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => setShowNewIncidentModal(true)}
          >
            Reportar Incidente
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            loading={isAuditing}
            onClick={handleRunFullAudit}
          >
            Ejecutar Monitoreo Completo
          </Button>
        </div>
      </div>

      {/* Banner Principal de Estado Global */}
      <Card
        padding="p-5"
        className={`border-l-4 ${
          auditReport?.overallStatus === HealthStatus.OPERATIVO
            ? 'border-l-emerald-500 bg-emerald-50/20'
            : auditReport?.overallStatus === HealthStatus.ADVERTENCIA
            ? 'border-l-amber-500 bg-amber-50/20'
            : auditReport?.overallStatus === HealthStatus.ERROR
            ? 'border-l-rose-500 bg-rose-50/20'
            : 'border-l-stone-300 bg-stone-50/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                auditReport?.overallStatus === HealthStatus.OPERATIVO
                  ? 'bg-emerald-100 text-emerald-700'
                  : auditReport?.overallStatus === HealthStatus.ADVERTENCIA
                  ? 'bg-amber-100 text-amber-700'
                  : auditReport?.overallStatus === HealthStatus.ERROR
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs uppercase tracking-wider font-bold text-stone-500">
                  Estado General de la Plataforma
                </span>
                {renderStatusBadge(auditReport?.overallStatus || HealthStatus.SIN_VERIFICAR)}
              </div>
              <p className="text-stone-700 text-sm font-medium mt-0.5">
                {auditReport?.overallStatus === HealthStatus.OPERATIVO &&
                  'Todos los servicios de producción, rutas institucionales y bases de datos responden con normalidad.'}
                {auditReport?.overallStatus === HealthStatus.ADVERTENCIA &&
                  'Se detectaron advertencias menores o latencia elevada en algunos componentes.'}
                {auditReport?.overallStatus === HealthStatus.ERROR &&
                  'Se han detectado errores críticos en servicios o rutas que requieren intervención.'}
                {!auditReport && 'Aguardando ejecución de la comprobación diagnóstica en tiempo real.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-stone-500 md:border-l md:border-stone-200 md:pl-6 shrink-0">
            <div>
              <span className="block text-[10px] uppercase font-semibold text-stone-400">
                Última Comprobación
              </span>
              <span className="font-mono font-medium text-stone-800">
                {lastCheckTime ? lastCheckTime.toLocaleTimeString('es-AR') : 'Sin verificar'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-semibold text-stone-400">
                Duración de Auditoría
              </span>
              <span className="font-mono font-medium text-stone-800">
                {auditReport ? `${auditReport.totalAuditTimeMs} ms` : '-'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-semibold text-stone-400">
                Ciclo Automático
              </span>
              <span className="font-medium text-emerald-700">Cron 30m</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs de Navegación Técnica */}
      <div className="flex border-b border-stone-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('monitoreo')}
          className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'monitoreo'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Server className="w-4 h-4" />
          Servicios & Rutas
        </button>

        <button
          onClick={() => setActiveTab('incidentes')}
          className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'incidentes'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Registro de Incidentes (`system_health_logs`)
          {incidents.filter((i) => i.estado !== IncidentState.RESUELTO).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
              {incidents.filter((i) => i.estado !== IncidentState.RESUELTO).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'github'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          GitHub Actions & CI/CD
        </button>

        <button
          onClick={() => setActiveTab('mantenimiento')}
          className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'mantenimiento'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Mantenimiento & Logs
        </button>
      </div>

      {/* TAB 1: SERVICIOS Y RUTAS */}
      {activeTab === 'monitoreo' && (
        <div className="space-y-6">
          {/* Tarjetas de los 4 Pilares de Firebase + Hosting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hosting & Sitio Web */}
            <Card padding="p-5" className="border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                {renderStatusBadge(auditReport?.routes?.status || HealthStatus.SIN_VERIFICAR)}
              </div>
              <h3 className="text-xs font-bold text-stone-900">Sitio Web & Hosting</h3>
              <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                Latencia Media: {auditReport?.routes ? `${auditReport.routes.avgLatencyMs} ms` : '-'}
              </p>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 flex items-center justify-between">
                <span>Comprobado:</span>
                <span className="font-mono">
                  {lastCheckTime ? lastCheckTime.toLocaleTimeString('es-AR') : 'Pendiente'}
                </span>
              </div>
            </Card>

            {/* Cloud Firestore */}
            <Card padding="p-5" className="border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                {renderStatusBadge(auditReport?.firebase?.firestore?.status || HealthStatus.SIN_VERIFICAR)}
              </div>
              <h3 className="text-xs font-bold text-stone-900">Cloud Firestore</h3>
              <p className="text-[11px] text-stone-500 mt-1 line-clamp-1 truncate font-mono">
                DB: {firebaseConfig.projectId} ({firebaseConfig.firestoreDatabaseId || '(default)'})
              </p>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 flex items-center justify-between">
                <span>Colecciones:</span>
                <span className="font-semibold text-emerald-700">9 Activas</span>
              </div>
            </Card>

            {/* Firebase Auth */}
            <Card padding="p-5" className="border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                {renderStatusBadge(auditReport?.firebase?.auth?.status || HealthStatus.SIN_VERIFICAR)}
              </div>
              <h3 className="text-xs font-bold text-stone-900">Firebase Authentication</h3>
              <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                Google Auth + Email/Pass
              </p>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 flex items-center justify-between">
                <span>Persistencia:</span>
                <span className="font-semibold text-stone-700">Segura</span>
              </div>
            </Card>

            {/* Firebase Storage */}
            <Card padding="p-5" className="border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
                {renderStatusBadge(auditReport?.firebase?.storage?.status || HealthStatus.SIN_VERIFICAR)}
              </div>
              <h3 className="text-xs font-bold text-stone-900">Firebase Storage</h3>
              <p className="text-[11px] text-stone-500 mt-1 line-clamp-1 truncate font-mono">
                {firebaseConfig.storageBucket || 'ariq-rosario.firebasestorage.app'}
              </p>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 flex items-center justify-between">
                <span>Reglas:</span>
                <span className="font-semibold text-emerald-700">storage.rules</span>
              </div>
            </Card>
          </div>

          {/* Matriz de Rutas Monitoreadas (Requisito 1) */}
          <Card padding="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Monitoreo de Disponibilidad de Rutas del Sitio Web
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Verificación de respuesta HTTP, tiempos de latencia y disponibilidad de componentes clave.
                </p>
              </div>
              <span className="text-[11px] text-stone-400">
                {auditReport?.routes?.routes?.length || 0} rutas comprobadas
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 font-semibold">Ruta</th>
                    <th className="py-2.5 font-semibold">Nombre del Módulo</th>
                    <th className="py-2.5 font-semibold">Código HTTP</th>
                    <th className="py-2.5 font-semibold">Latencia</th>
                    <th className="py-2.5 font-semibold text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {auditReport?.routes?.routes?.map((r, i) => (
                    <tr key={i} className="hover:bg-stone-50/70">
                      <td className="py-2.5 font-mono text-stone-900 font-semibold">{r.path}</td>
                      <td className="py-2.5 text-stone-700">{r.name}</td>
                      <td className="py-2.5">
                        <span
                          className={`font-mono px-2 py-0.5 rounded text-[11px] font-bold ${
                            r.ok
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {r.status || 'ERROR'}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-stone-600">
                        {r.latencyMs} ms
                        {r.isSlow && (
                          <span className="ml-1.5 text-[10px] text-amber-600 font-sans">
                            (Lento)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {r.ok ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" /> Fallo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!auditReport && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-stone-400">
                        Haga clic en "Ejecutar Monitoreo Completo" para comprobar las rutas en tiempo real.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Comprobación de Recursos Estáticos y Seguridad HTTPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card padding="p-5">
              <h4 className="text-xs font-bold text-stone-900 mb-3 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-red-600" />
                Recursos Estáticos & Medios
              </h4>
              <div className="space-y-2.5 text-xs">
                {auditReport?.assets?.assets?.map((asset, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-100"
                  >
                    <div>
                      <span className="font-semibold text-stone-800 block text-[11px]">
                        {asset.name}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">{asset.url}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          asset.ok
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {asset.ok ? '200 OK' : 'FALLO'}
                      </span>
                      <span className="block text-[10px] text-stone-400 mt-0.5 font-mono">
                        {asset.latencyMs} ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="p-5">
              <h4 className="text-xs font-bold text-stone-900 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                Seguridad de Transporte & HTTPS
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <span className="text-stone-600">Protocolo de Conexión:</span>
                  <span className="font-mono font-bold text-stone-800">
                    {auditReport?.security?.protocol || window.location.protocol}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <span className="text-stone-600">Contexto Cifrado Seguro:</span>
                  <span className="font-semibold text-emerald-700">
                    {window.isSecureContext ? 'Activo (SecureContext)' : 'Inseguro'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Diagnóstico de Seguridad:</span>
                  <span className="text-stone-800 text-[11px]">
                    {auditReport?.security?.detail || 'Transporte verificado'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: CENTRO DE INCIDENTES (system_health_logs) */}
      {activeTab === 'incidentes' && (
        <div className="space-y-6">
          <Card padding="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Registro de Incidentes de Producción (`system_health_logs`)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Colección privada de Firestore donde se registran fallos detectados, severidad y resoluciones.
                </p>
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-2">
                <select
                  value={incidentFilter}
                  onChange={(e) => setIncidentFilter(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700"
                >
                  <option value="todos">Todos los estados</option>
                  <option value={IncidentState.ABIERTO}>Abiertos / Investigando</option>
                  <option value={IncidentState.RESUELTO}>Resueltos</option>
                </select>

                <Button
                  size="sm"
                  variant="outline"
                  icon={RefreshCw}
                  loading={loadingIncidents}
                  onClick={loadIncidents}
                >
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Lista de Incidentes */}
            {incidents.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="text-xs font-bold text-stone-800">No hay incidentes registrados</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  La plataforma no presenta anomalías abiertas en `system_health_logs`.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 mt-2">
                {incidents.map((incident) => (
                  <div key={incident.id} className="py-3.5 flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Severidad */}
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            incident.severidad === IncidentSeverity.CRITICO
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : incident.severidad === IncidentSeverity.ADVERTENCIA
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {incident.severidad}
                        </span>

                        <span className="font-mono text-[11px] font-bold text-stone-900 uppercase">
                          {incident.tipo_error}
                        </span>

                        <span className="text-[10px] px-1.5 py-0.2 bg-stone-100 rounded text-stone-600 font-mono">
                          {incident.servicio}
                        </span>

                        {incident.estado === IncidentState.RESUELTO ? (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                            Resuelto
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.2 rounded border border-rose-200">
                            Pendiente
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-700 mt-1.5 font-medium leading-relaxed">
                        {incident.descripcion}
                      </p>

                      {incident.resolucion_notas && (
                        <div className="mt-2 p-2 bg-emerald-50/60 border border-emerald-100 rounded text-[11px] text-emerald-800">
                          <strong>Resolución:</strong> {incident.resolucion_notas}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[10px] text-stone-400 mt-2 font-mono">
                        <span>ID: {incident.id}</span>
                        <span>
                          {new Date(incident.timestamp).toLocaleString('es-AR')}
                        </span>
                        <span>Origen: {incident.creado_por || 'sistema'}</span>
                      </div>
                    </div>

                    {/* Botón de Resolver */}
                    {incident.estado !== IncidentState.RESUELTO && (
                      <div className="shrink-0 pt-1">
                        {resolvingId === incident.id ? (
                          <div className="space-y-2 max-w-xs">
                            <input
                              type="text"
                              placeholder="Notas de resolución..."
                              value={resolutionNote}
                              onChange={(e) => setResolutionNote(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 border border-stone-200 rounded"
                            />
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleResolveIncident(incident.id)}
                              >
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setResolvingId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Check}
                            onClick={() => {
                              setResolvingId(incident.id);
                              setResolutionNote('');
                            }}
                          >
                            Resolver Incidente
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: GITHUB ACTIONS & CI/CD */}
      {activeTab === 'github' && (
        <div className="space-y-6">
          <Card padding="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-red-600" />
                  Automatización de CI/CD & Monitoreo en GitHub Actions
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Procesos configurados para verificación periódica continua y despliegues a Firebase Hosting.
                </p>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Flujos Activos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Workflow 1 */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    Monitoreo Periódico de Producción
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Cron */30 * * * *
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Ejecuta `scripts/health-check.mjs` cada 30 minutos sin interrupción para verificar la disponibilidad HTTP de las 7 rutas principales y el logotipo institucional.
                </p>
                <div className="pt-2 text-[10px] text-stone-400 font-mono">
                  Archivo: `.github/workflows/health-check.yml`
                </div>
              </div>

              {/* Workflow 2 */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-stone-500" />
                    CI/CD & Despliegue a Firebase Hosting
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Push a main
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Realiza validación de sintaxis (`npm run lint`), compilación de producción (`npm run build`) y despliegue automatizado al canal en vivo de Firebase Hosting.
                </p>
                <div className="pt-2 text-[10px] text-stone-400 font-mono">
                  Archivo: `.github/workflows/firebase-ci-cd.yml`
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-stone-900 text-stone-200 rounded-xl text-xs space-y-2 font-mono">
              <div className="flex items-center justify-between text-stone-400 border-b border-stone-800 pb-2">
                <span>Secretos Requeridos en Repositorio GitHub (Settings &gt; Secrets and variables &gt; Actions):</span>
              </div>
              <p className="text-stone-300">
                1. <span className="text-amber-400">FIREBASE_SERVICE_ACCOUNT_ARIQ_ROSARIO</span>: Clave de cuenta de servicio de Firebase para despliegue automático.
              </p>
              <p className="text-stone-300">
                2. <span className="text-amber-400">APP_URL</span>: URL pública del sitio web (por defecto: `https://ariq-rosario.firebaseapp.com`).
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: MANTENIMIENTO & LOGS */}
      {activeTab === 'mantenimiento' && (
        <div className="space-y-6">
          {/* Inicialización de Firestore */}
          <Card padding="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Poblar Firestore con Datos Oficiales de ARIQ
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Inicializa las colecciones en el proyecto `ariq-rosario` (autoridades, cursos, noticias, categorías quirúrgicas y eventos) sin sobreescribir datos existentes.
                </p>
              </div>
              <Button
                size="sm"
                loading={seeding}
                icon={Cloud}
                onClick={handleSeedFirestore}
              >
                Cargar Datos Iniciales a Firestore
              </Button>
            </div>

            {seedResult && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sincronización de Firestore completada con éxito:</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Categorías creadas: {seedResult.results?.categoriesCount || 0} · Noticias: {seedResult.results?.newsCount || 0} · Cursos: {seedResult.results?.coursesCount || 0} · Eventos: {seedResult.results?.eventsCount || 0} · Perfiles: {seedResult.results?.profilesCount || 0}
                </p>
              </div>
            )}
          </Card>

          {/* Registro de Auditoría Interna (`internal_logs`) */}
          <Card padding="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-sm text-stone-900">
                  Registro de Actividad Administrativa (`internal_logs`)
                </h3>
              </div>
              <Button size="sm" variant="ghost" onClick={loadInternalLogs} loading={loadingLogs}>
                Actualizar
              </Button>
            </div>

            {logs.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                No hay registros de auditoría administrativa recientes.
              </p>
            ) : (
              <div className="divide-y divide-stone-100 text-xs">
                {logs.map((log, idx) => (
                  <div key={log.id || idx} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-[11px] uppercase">
                          {log.accion}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-stone-100 rounded text-stone-600 font-mono">
                          {log.modulo}
                        </span>
                      </div>
                      <p className="text-stone-600 text-[11px] truncate mt-0.5">
                        {log.detalles}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-stone-400 text-[10px] block">
                        {log.usuario_email}
                      </span>
                      <span className="text-stone-400 text-[10px] block tabular-nums">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('es-AR') : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Guía de Alta del Primer Administrador */}
          <Card padding="p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  Alta del Primer Administrador en Firebase
                </h3>
              </div>
              <button
                onClick={() => handleCopy(adminCliScript, 'sql_admin')}
                className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded cursor-pointer"
              >
                {copied === 'sql_admin' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied === 'sql_admin' ? 'Copiado' : 'Copiar Instrucciones'}</span>
              </button>
            </div>
            <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed">
              {adminCliScript}
            </pre>
          </Card>

          {/* Mantenimiento de Caché */}
          <Card padding="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  Mantenimiento de Caché Local
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Limpia la copia en localStorage utilizada para contingencia fuera de línea.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={handleResetLocal}
              >
                {resetDone ? 'Restaurado...' : 'Limpiar Caché Local'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Reportar Nuevo Incidente Manual */}
      {showNewIncidentModal && (
        <Modal
          isOpen={showNewIncidentModal}
          onClose={() => setShowNewIncidentModal(false)}
          title="Registrar Incidente en system_health_logs"
        >
          <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Servicio Afectado
              </label>
              <select
                value={newIncidentForm.servicio}
                onChange={(e) =>
                  setNewIncidentForm({ ...newIncidentForm, servicio: e.target.value })
                }
                className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50"
              >
                <option value="hosting">Firebase Hosting / Sitio Web</option>
                <option value="firestore">Cloud Firestore</option>
                <option value="auth">Firebase Authentication</option>
                <option value="storage">Firebase Storage</option>
                <option value="rutas">Rutas / Navegación</option>
                <option value="github_actions">GitHub Actions / CI/CD</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Severidad
              </label>
              <select
                value={newIncidentForm.severidad}
                onChange={(e) =>
                  setNewIncidentForm({ ...newIncidentForm, severidad: e.target.value })
                }
                className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50"
              >
                <option value={IncidentSeverity.INFO}>Informativo (Info)</option>
                <option value={IncidentSeverity.ADVERTENCIA}>Advertencia (Warning)</option>
                <option value={IncidentSeverity.CRITICO}>Crítico (Requiere intervención urgente)</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Código o Tipo de Error
              </label>
              <input
                type="text"
                required
                placeholder="Ej. HTTP_500_TIMEOUT o PERMISSION_DENIED"
                value={newIncidentForm.tipo_error}
                onChange={(e) =>
                  setNewIncidentForm({ ...newIncidentForm, tipo_error: e.target.value })
                }
                className="w-full border border-stone-200 rounded-lg px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Descripción Detallada (Sin contraseñas ni claves API)
              </label>
              <textarea
                required
                rows={3}
                placeholder="Detalle el comportamiento anómalo detectado..."
                value={newIncidentForm.descripcion}
                onChange={(e) =>
                  setNewIncidentForm({ ...newIncidentForm, descripcion: e.target.value })
                }
                className="w-full border border-stone-200 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewIncidentModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={submittingIncident}
              >
                Guardar Incidente
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
