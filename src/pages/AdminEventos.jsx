import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { eventosService } from '../services/eventosService.js';
import { slugify } from '../services/noticiasService.js';

export default function AdminEventos() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    slug: '',
    descripcion: '',
    imagen_url: '/images/evento-congreso.jpg',
    tipo: 'jornada',
    fecha: new Date().toISOString().split('T')[0],
    horario: '09:00 a 17:00 hs',
    lugar: 'Rosario',
    direccion: '',
    ciudad: 'Rosario, Santa Fe',
    estado: 'publicado',
    enlace_externo: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await eventosService.getEventos();
      setEventos(data);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      titulo: '',
      slug: '',
      descripcion: '',
      imagen_url: '/images/evento-congreso.jpg',
      tipo: 'jornada',
      fecha: new Date().toISOString().split('T')[0],
      horario: '09:00 a 17:00 hs',
      lugar: 'Auditorio Social ARIQ',
      direccion: 'Rosario',
      ciudad: 'Rosario, Santa Fe',
      estado: 'publicado',
      enlace_externo: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      titulo: item.titulo || '',
      slug: item.slug || '',
      descripcion: item.descripcion || '',
      imagen_url: item.imagen_url || '/images/evento-congreso.jpg',
      tipo: item.tipo || 'jornada',
      fecha: item.fecha || '',
      horario: item.horario || '',
      lugar: item.lugar || '',
      direccion: item.direccion || '',
      ciudad: item.ciudad || 'Rosario, Santa Fe',
      estado: item.estado || 'publicado',
      enlace_externo: item.enlace_externo || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleTituloChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      titulo: val,
      slug: !editingId ? slugify(val) : prev.slug,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (!formData.titulo.trim() || !formData.descripcion.trim() || !formData.fecha) {
        throw new Error('Complete título, descripción y fecha del evento.');
      }

      if (editingId) {
        await eventosService.updateEvento(editingId, formData);
      } else {
        await eventosService.createEvento(formData);
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Error al guardar el evento.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await eventosService.deleteEvento(itemToDelete.id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Evento / Actividad',
      accessor: 'titulo',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.imagen_url || '/images/evento-congreso.jpg'}
            alt=""
            className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-semibold text-stone-900 block leading-tight">{row.titulo}</span>
            <span className="text-stone-400 text-xs">{row.lugar}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      render: (row) => (
        <span className="capitalize text-xs font-semibold uppercase tracking-wider text-stone-700">
          {row.tipo}
        </span>
      ),
    },
    {
      header: 'Fecha y Horario',
      accessor: 'fecha',
      render: (row) => (
        <div className="text-xs text-stone-600">
          <span className="block font-medium tabular-nums">
            {new Date(row.fecha).toLocaleDateString('es-AR')}
          </span>
          <span className="text-stone-400 text-[11px]">{row.horario}</span>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: 'estado',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            row.estado === 'publicado'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-stone-100 text-stone-600'
          }`}
        >
          {row.estado}
        </span>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-stone-600 hover:text-blue-600 hover:bg-stone-100 rounded cursor-pointer"
            title="Editar evento"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setItemToDelete(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
            title="Eliminar evento"
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
          <h1 className="text-2xl font-bold text-stone-900">Agenda y Eventos Institucionales</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Organice congresos, jornadas científicas, asambleas ordinarias y talleres.
          </p>
        </div>
        <Button onClick={handleOpenCreate} icon={Plus}>
          Nuevo Evento
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={eventos}
        searchPlaceholder="Buscar eventos..."
        searchKeys={['titulo', 'lugar', 'tipo', 'descripcion']}
      />

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Evento' : 'Registrar Nuevo Evento'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Título del Evento *
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={handleTituloChange}
              placeholder="Ej: XVII Jornadas Rosarinas de Instrumentación Quirúrgica"
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tipo de Actividad *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              >
                <option value="jornada">Jornada</option>
                <option value="congreso">Congreso</option>
                <option value="taller">Taller</option>
                <option value="asamblea">Asamblea Ordinaria / Extraordinaria</option>
                <option value="institucional">Acto Institucional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Horario *
              </label>
              <input
                type="text"
                required
                value={formData.horario}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                placeholder="Ej: 08:30 a 18:00 hs"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Lugar / Espacio *
              </label>
              <input
                type="text"
                required
                value={formData.lugar}
                onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                placeholder="Centro Metropolitano Rosario"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Dirección Física
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Av. Central Argentino 6102"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Imagen del Evento (Preset o URL)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.imagen_url}
                onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <select
                onChange={(e) => {
                  if (e.target.value) setFormData({ ...formData, imagen_url: e.target.value });
                }}
                className="text-xs border border-stone-300 rounded-lg px-2 py-2 bg-stone-50"
              >
                <option value="">Presets...</option>
                <option value="/images/evento-congreso.jpg">Auditorio / Congreso</option>
                <option value="/images/hero-suite.jpg">Sede Quirúrgica</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Descripción del Evento *
            </label>
            <textarea
              required
              rows={4}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Programa temático, panelistas, modalidad de acreditación..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Guardar Cambios' : 'Registrar Evento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar Baja de Evento"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">¿Desea eliminar el evento?</p>
              <p className="mt-1">
                Evento: <strong>{itemToDelete?.titulo}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
