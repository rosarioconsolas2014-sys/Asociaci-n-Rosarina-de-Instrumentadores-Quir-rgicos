import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Cloud,
  HardDrive,
  Users,
  Activity,
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import {
  firebaseConfig,
  isFirebaseConfigured,
  testFirestoreConnection,
} from '../firebase/firebase.js';
import { listDocuments } from '../firebase/firestore.js';
import { seedFirestoreIfEmpty } from '../services/seedService.js';
import { resetLocalStore } from '../services/supabase.js';

export default function AdminSistema() {
  const [copied, setCopied] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    checkConnection();
    loadLogs();
  }, []);

  const checkConnection = async () => {
    setTestingConnection(true);
    const res = await testFirestoreConnection();
    setConnectionStatus(res);
    setTestingConnection(false);
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const items = await listDocuments('internal_logs');
      setLogs(
        items.sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        ).slice(0, 10)
      );
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCopy = (text, key) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    }
  };

  const handleSeedFirestore = async () => {
    if (
      window.confirm(
        '¿Desea poblar Firestore con los datos iniciales de ARIQ (categorías, capacitaciones, noticias institucionales y configuración)? No se sobrescribirán documentos existentes.'
      )
    ) {
      setSeeding(true);
      setSeedResult(null);
      const res = await seedFirestoreIfEmpty();
      setSeeding(false);
      setSeedResult(res);
      await loadLogs();
    }
  };

  const handleResetLocal = () => {
    if (
      window.confirm(
        '¿Desea reiniciar el almacenamiento local a su estado inicial? Esta acción solo afecta la copia de demostración fuera de línea.'
      )
    ) {
      resetLocalStore();
      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
        window.location.reload();
      }, 1000);
    }
  };

  const adminCliScript = `# Crear el primer Administrador en Firebase desde Firebase CLI o Cloud Functions:
# 1. Crear el usuario en Firebase Authentication (Consola de Firebase > Authentication > Agregar usuario):
#    Email: admin@ariq.org.ar
#    Contraseña: [tu-contraseña-segura]

# 2. Asignar rol de 'admin' en Firestore (/profiles/{uid}):
# En Firestore Database > Colección 'profiles' > Documento con ID = UID del usuario:
{
  "uid": "<USER_UID>",
  "email": "admin@ariq.org.ar",
  "full_name": "Administrador Principal ARIQ",
  "role": "admin",
  "activo": true,
  "created_at": "2026-11-05T00:00:00.000Z"
}`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          Infraestructura Firebase & Seguridad
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Gestión centralizada de Cloud Firestore, Firebase Authentication, Firebase Storage y auditoría.
        </p>
      </div>

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Firestore */}
        <Card padding="p-5" className="border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                connectionStatus?.ok
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {connectionStatus?.ok ? 'En línea' : 'Verificando'}
            </span>
          </div>
          <h3 className="text-xs font-bold text-stone-900">Cloud Firestore</h3>
          <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
            DB: {firebaseConfig.firestoreDatabaseId || '(default)'}
          </p>
        </Card>

        {/* Authentication */}
        <Card padding="p-5" className="border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
              Activo
            </span>
          </div>
          <h3 className="text-xs font-bold text-stone-900">Firebase Auth</h3>
          <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
            Google Popup + Email/Password
          </p>
        </Card>

        {/* Storage */}
        <Card padding="p-5" className="border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
              Configurado
            </span>
          </div>
          <h3 className="text-xs font-bold text-stone-900">Firebase Storage</h3>
          <p className="text-[11px] text-stone-500 mt-1 line-clamp-1 truncate">
            {firebaseConfig.storageBucket || 'storage.app'}
          </p>
        </Card>
      </div>

      {/* Connection & Configuration Diagnostics */}
      <Card padding="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-sm text-stone-900">
              Diagnóstico del Proyecto Firebase Conectado
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Identificadores de entorno y estado de conectividad en tiempo real.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            icon={RefreshCw}
            loading={testingConnection}
            onClick={checkConnection}
          >
            Verificar Conexión
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-stone-400 block font-semibold text-[10px] uppercase">
              Project ID
            </span>
            <span className="text-stone-900 font-mono font-semibold">
              {firebaseConfig.projectId || 'No definido'}
            </span>
          </div>
          <div>
            <span className="text-stone-400 block font-semibold text-[10px] uppercase">
              App ID
            </span>
            <span className="text-stone-900 font-mono text-[11px] truncate block">
              {firebaseConfig.appId || 'No definido'}
            </span>
          </div>
          <div>
            <span className="text-stone-400 block font-semibold text-[10px] uppercase">
              Reglas de Seguridad
            </span>
            <span className="text-emerald-700 font-semibold block">
              firestore.rules (Desplegadas)
            </span>
          </div>
          <div>
            <span className="text-stone-400 block font-semibold text-[10px] uppercase">
              Estado de Red
            </span>
            <span
              className={`font-semibold block ${
                connectionStatus?.ok ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {connectionStatus ? connectionStatus.message : 'Verificando...'}
            </span>
          </div>
        </div>
      </Card>

      {/* Firestore Database Population & Seeding */}
      <Card padding="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-sm text-stone-900">
              Poblar Firestore con Datos Iniciales de ARIQ
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Inicializa las 9 colecciones oficiales (configuración legal, categorías quirúrgicas, noticias, cursos de laparoscopía/esterilización y eventos) sin alterar registros preexistentes.
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

      {/* Recent Activity & Internal Audit Logs */}
      <Card padding="p-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-sm text-stone-900">
              Registro de Actividad y Auditoría (`internal_logs`)
            </h3>
          </div>
          <Button size="sm" variant="ghost" onClick={loadLogs} loading={loadingLogs}>
            Actualizar
          </Button>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">
            No hay registros de auditoría recientes en Cloud Firestore.
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

      {/* Security and Admin Creation Guide */}
      <Card padding="p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-stone-900">
              Instrucciones de Despliegue y Alta del Primer Administrador
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
            <span>{copied === 'sql_admin' ? 'Copiado' : 'Copiar Guía'}</span>
          </button>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed mb-3">
          Las reglas de seguridad de Firestore (`firestore.rules`) bloquean la autoasignación del rol de administrador desde el cliente web. Para dar de alta o promover un usuario con rol de <strong>Administrador</strong>:
        </p>

        <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed">
          {adminCliScript}
        </pre>
      </Card>

      {/* Cache & Offline Maintenance */}
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
  );
}
