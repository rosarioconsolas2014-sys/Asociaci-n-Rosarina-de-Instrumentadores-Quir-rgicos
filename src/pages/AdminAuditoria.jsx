import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  User,
  Shield,
  FileText,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { listDocuments } from '../firebase/firestore.js';

export default function AdminAuditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('todos');
  const [actionFilter, setActionFilter] = useState('todos');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const items = await listDocuments('internal_logs');
      // Ordenar cronológicamente descendente
      items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setLogs(items);
    } catch (err) {
      console.error('Error al cargar logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const availableModules = [
    'todos',
    'auth_propia',
    'noticias',
    'cursos',
    'eventos',
    'institucional',
    'configuracion',
    'usuarios',
    'contacto',
    'inscripciones',
    'sistema',
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesModule = moduleFilter === 'todos' || log.modulo === moduleFilter;
    const matchesAction = actionFilter === 'todos' || log.accion === actionFilter;
    const matchesSearch =
      !searchTerm ||
      log.accion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detalles?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.modulo?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesModule && matchesAction && matchesSearch;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Fecha_Hora', 'Usuario', 'Rol', 'Accion', 'Modulo', 'Registro_ID', 'Detalles'];
    const rows = filteredLogs.map((l) => [
      l.timestamp || '',
      l.usuario_email || '',
      l.usuario_rol || '',
      l.accion || '',
      l.modulo || '',
      l.registro_id || '',
      `"${String(l.detalles || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `ariq-auditoria-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (accion) => {
    if (accion.includes('DELETE') || accion.includes('LOCKED') || accion.includes('FAILED')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (accion.includes('CREATE') || accion.includes('BOOTSTRAP') || accion.includes('SUCCESS')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (accion.includes('UPDATE') || accion.includes('CHANGE')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-stone-100 text-stone-700 border-stone-200';
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Registro de Auditoría Interna
            </h1>
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-mono text-[10px] font-bold">
              SECCIÓN I
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Trazabilidad completa de operaciones administrativas en Firestore (`internal_logs`). Registro inmutable con fecha, usuario y detalles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
          >
            Exportar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={loadLogs}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por usuario, acción o detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
            >
              <option value="todos">Todos los módulos</option>
              {availableModules.slice(1).map((m) => (
                <option key={m} value={m}>
                  Módulo: {m.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>
              Mostrando <strong>{filteredLogs.length}</strong> de {logs.length} eventos
            </span>
            {(searchTerm || moduleFilter !== 'todos' || actionFilter !== 'todos') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setModuleFilter('todos');
                  setActionFilter('todos');
                }}
                className="text-red-600 hover:text-red-700 font-semibold cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card padding="p-6">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            No se encontraron registros de auditoría que coincidan con los criterios.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-semibold">Fecha y Hora</th>
                  <th className="py-2.5 font-semibold">Usuario Responsable</th>
                  <th className="py-2.5 font-semibold">Módulo</th>
                  <th className="py-2.5 font-semibold">Acción</th>
                  <th className="py-2.5 font-semibold">Detalles de Operación</th>
                  <th className="py-2.5 font-semibold text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/70">
                    <td className="py-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('es-AR') : '-'}
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      <div className="font-semibold text-stone-900">{log.usuario_email}</div>
                      {log.usuario_rol && (
                        <span className="text-[10px] text-stone-400 uppercase font-bold">
                          {log.usuario_rol}
                        </span>
                      )}
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold uppercase">
                        {log.modulo}
                      </span>
                    </td>

                    <td className="py-3 whitespace-nowrap">
                      <span
                        className={`inline-block font-mono text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${getActionBadge(
                          log.accion || ''
                        )}`}
                      >
                        {log.accion}
                      </span>
                    </td>

                    <td className="py-3 text-stone-600 max-w-md truncate">
                      {log.detalles}
                    </td>

                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded cursor-pointer"
                        title="Ver detalles completos"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Detalle de Registro de Auditoría */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title={`Detalle de Auditoría: ${selectedLog.accion}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-lg border border-stone-200">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">
                  Fecha y Hora
                </span>
                <span className="font-mono text-stone-800 font-semibold block mt-0.5">
                  {selectedLog.timestamp
                    ? new Date(selectedLog.timestamp).toLocaleString('es-AR')
                    : '-'}
                </span>
              </div>

              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">
                  ID de Registro
                </span>
                <span className="font-mono text-stone-800 block mt-0.5 truncate">
                  {selectedLog.id}
                </span>
              </div>

              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">
                  Usuario
                </span>
                <span className="text-stone-800 font-semibold block mt-0.5">
                  {selectedLog.usuario_email}
                </span>
              </div>

              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">
                  Módulo Afectado
                </span>
                <span className="font-mono text-stone-800 font-bold block mt-0.5 uppercase">
                  {selectedLog.modulo}
                </span>
              </div>
            </div>

            <div>
              <span className="text-stone-600 font-semibold block mb-1">
                Detalles Completos
              </span>
              <div className="p-3 bg-stone-900 text-stone-100 rounded-lg font-mono text-[11px] whitespace-pre-wrap leading-relaxed break-words">
                {selectedLog.detalles}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
