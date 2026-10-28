import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Check,
  Eye,
  Trash2,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  Reply,
} from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { contactoService } from '../services/contactoService.js';

export default function AdminContacto() {
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMotivo, setSelectedMotivo] = useState('');

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedContacto, setSelectedContacto] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await contactoService.getContactos();
      setContactos(data);
    } catch (err) {
      console.error('Error al cargar contactos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetail = async (item) => {
    setSelectedContacto(item);
    setAdminNotes(item.notas_admin || '');
    setDetailModalOpen(true);

    if (!item.leido) {
      await contactoService.marcarLeido(item.id, true);
      await loadData();
    }
  };

  const handleSaveNotesAndReply = async () => {
    if (!selectedContacto) return;
    setSavingNotes(true);
    try {
      await contactoService.marcarRespondido(selectedContacto.id, true, adminNotes);
      setDetailModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Error al guardar notas: ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await contactoService.deleteContacto(itemToDelete.id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      alert('Error al eliminar consulta: ' + err.message);
    }
  };

  const filteredData = selectedMotivo
    ? contactos.filter((c) => c.motivo === selectedMotivo)
    : contactos;

  const columns = [
    {
      header: 'Remitente',
      accessor: 'nombre_completo',
      render: (row) => (
        <div className="flex items-center gap-2">
          {!row.leido && (
            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" title="Nuevo / No leído" />
          )}
          <div>
            <span className="font-semibold text-stone-900 block leading-tight">
              {row.nombre_completo}
            </span>
            <span className="text-stone-400 text-xs">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Motivo',
      accessor: 'motivo',
      render: (row) => (
        <span className="capitalize text-xs font-semibold uppercase tracking-wider text-stone-700">
          {row.motivo.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Mensaje',
      accessor: 'mensaje',
      render: (row) => (
        <p className="text-xs text-stone-600 line-clamp-1 max-w-sm">
          {row.mensaje}
        </p>
      ),
    },
    {
      header: 'Fecha',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-xs text-stone-500 tabular-nums">
          {new Date(row.created_at).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: 'respondido',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            row.respondido
              ? 'bg-emerald-50 text-emerald-700'
              : row.leido
              ? 'bg-stone-100 text-stone-600'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {row.respondido ? 'Respondido' : row.leido ? 'Leído' : 'Pendiente'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenDetail(row)}
            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
            title="Leer y responder"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setItemToDelete(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
            title="Eliminar consulta"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Consultas de Contacto</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Mensajes, dudas de afiliación y consultas gremiales ingresadas a través del sitio web.
          </p>
        </div>

        <select
          value={selectedMotivo}
          onChange={(e) => setSelectedMotivo(e.target.value)}
          className="text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600"
        >
          <option value="">Todos los motivos</option>
          <option value="afiliacion">Afiliación</option>
          <option value="cursos">Cursos</option>
          <option value="ejercicio_profesional">Ejercicio Profesional</option>
          <option value="legal_gremial">Legal y Gremial</option>
          <option value="general">General</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Buscar por nombre, correo o texto..."
        searchKeys={['nombre_completo', 'email', 'mensaje', 'telefono']}
      />

      {/* DETAIL AND REPLY MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detalle de Consulta"
        subtitle={selectedContacto?.nombre_completo}
        maxWidth="max-w-xl"
      >
        {selectedContacto && (
          <div className="space-y-4 text-xs">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 capitalize text-sm">
                  Motivo: {selectedContacto.motivo.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-stone-500">
                  {new Date(selectedContacto.created_at).toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-stone-600">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <a href={`mailto:${selectedContacto.email}`} className="text-red-700 hover:underline">
                    {selectedContacto.email}
                  </a>
                </div>
                {selectedContacto.telefono && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{selectedContacto.telefono}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <strong className="block text-stone-800 mb-1">Mensaje recibido:</strong>
              <div className="p-4 bg-white border border-stone-200 rounded-lg text-stone-800 leading-relaxed whitespace-pre-wrap">
                {selectedContacto.mensaje}
              </div>
            </div>

            <div>
              <label className="block text-stone-800 font-semibold mb-1">
                Notas Internas / Acciones Realizadas por la Secretaría:
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ej: Respondido telefónicamente el 28/10. Se envió instructivo de matriculación por email."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <a
                href={`mailto:${selectedContacto.email}?subject=Respuesta ARIQ - Consulta sobre ${encodeURIComponent(selectedContacto.motivo)}`}
                className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Responder por Email</span>
              </a>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)}>
                  Cerrar
                </Button>
                <Button size="sm" loading={savingNotes} onClick={handleSaveNotesAndReply}>
                  Guardar y Marcar Respondido
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Mensaje"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">¿Desea eliminar esta consulta de contacto?</p>
              <p className="mt-1">
                Remitente: <strong>{itemToDelete?.nombre_completo}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Eliminar Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
