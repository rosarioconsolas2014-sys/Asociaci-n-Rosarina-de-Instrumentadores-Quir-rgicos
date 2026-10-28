import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { cursosService } from '../services/cursosService.js';
import { slugify } from '../services/noticiasService.js';

export default function AdminCursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    imagen_url: '/images/curso-laparoscopia.jpg',
    modalidad: 'presencial',
    lugar: 'Sede ARIQ - Rosario',
    fecha_inicio: '',
    fecha_fin: '',
    horario: 'Sábados de 09:00 a 13:00 hs',
    duracion_horas: 30,
    cupos: 25,
    cupos_disponibles: 25,
    requisitos: 'Título de Instrumentador Quirúrgico o constancia de estudiante avanzado.',
    arancel: 'Socios ARIQ con bonificación',
    info_inscripcion: 'Inscripción online mediante el sitio oficial.',
    material_descargable_url: '',
    estado: 'activo',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [searchParams] = useSearchParams();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await cursosService.getCursos();
      setCursos(data);
    } catch (err) {
      console.error('Error al cargar cursos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('nuevo') === '1') {
      handleOpenCreate();
    }
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      nombre: '',
      slug: '',
      descripcion: '',
      imagen_url: '/images/curso-laparoscopia.jpg',
      modalidad: 'presencial',
      lugar: 'Sede Social ARIQ - Rosario',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      horario: 'Sábados de 09:00 a 13:00 hs',
      duracion_horas: 32,
      cupos: 25,
      cupos_disponibles: 25,
      requisitos: 'Título oficial o constancia de alumno regular de último año.',
      arancel: 'Socios con 40% de descuento',
      info_inscripcion: 'Inscripción online mediante formulario.',
      material_descargable_url: '',
      estado: 'activo',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      nombre: item.nombre || '',
      slug: item.slug || '',
      descripcion: item.descripcion || '',
      imagen_url: item.imagen_url || '/images/curso-laparoscopia.jpg',
      modalidad: item.modalidad || 'presencial',
      lugar: item.lugar || '',
      fecha_inicio: item.fecha_inicio || '',
      fecha_fin: item.fecha_fin || '',
      horario: item.horario || '',
      duracion_horas: item.duracion_horas || 30,
      cupos: item.cupos || 25,
      cupos_disponibles: item.cupos_disponibles ?? item.cupos,
      requisitos: item.requisitos || '',
      arancel: item.arancel || '',
      info_inscripcion: item.info_inscripcion || '',
      material_descargable_url: item.material_descargable_url || '',
      estado: item.estado || 'activo',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleNombreChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      nombre: val,
      slug: !editingId ? slugify(val) : prev.slug,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (!formData.nombre.trim() || !formData.descripcion.trim() || !formData.fecha_inicio) {
        throw new Error('Complete nombre, descripción y fecha de inicio.');
      }

      if (editingId) {
        await cursosService.updateCurso(editingId, formData);
      } else {
        await cursosService.createCurso(formData);
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Error al guardar el curso.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await cursosService.deleteCurso(itemToDelete.id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      alert('Error al eliminar curso: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Curso / Capacitación',
      accessor: 'nombre',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.imagen_url || '/images/curso-laparoscopia.jpg'}
            alt=""
            className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-semibold text-stone-900 block leading-tight">{row.nombre}</span>
            <span className="text-stone-400 text-xs">{row.lugar}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Modalidad',
      accessor: 'modalidad',
      render: (row) => (
        <span className="capitalize text-xs font-medium text-stone-700">
          {row.modalidad}
        </span>
      ),
    },
    {
      header: 'Fecha Inicio',
      accessor: 'fecha_inicio',
      render: (row) => (
        <span className="text-xs text-stone-600 tabular-nums">
          {new Date(row.fecha_inicio).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      header: 'Cupos (Libres/Total)',
      accessor: 'cupos',
      render: (row) => (
        <span className="text-xs font-bold tabular-nums text-stone-800">
          {row.cupos_disponibles} / {row.cupos}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: 'estado',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            row.estado === 'activo'
              ? 'bg-emerald-50 text-emerald-700'
              : row.estado === 'proximamente'
              ? 'bg-blue-50 text-blue-700'
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
            title="Editar curso"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setItemToDelete(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
            title="Eliminar curso"
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
          <h1 className="text-2xl font-bold text-stone-900">Gestión de Cursos y Capacitaciones</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Administre la oferta académica, fechas, modalidades y cupos disponibles.
          </p>
        </div>
        <Button onClick={handleOpenCreate} icon={Plus}>
          Nuevo Curso
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={cursos}
        searchPlaceholder="Buscar por nombre, lugar o descripción..."
        searchKeys={['nombre', 'lugar', 'modalidad', 'descripcion']}
      />

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Curso' : 'Registrar Nuevo Curso'}
        subtitle="Complete los detalles académicos del programa."
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
              Nombre de la Capacitación *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={handleNombreChange}
              placeholder="Ej: Instrumentación Quirúrgica en Neurocirugía"
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Modalidad *
              </label>
              <select
                value={formData.modalidad}
                onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              >
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="hibrida">Híbrida</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Estado *
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              >
                <option value="activo">Activo (Abierto a inscripción)</option>
                <option value="proximamente">Próximamente</option>
                <option value="finalizado">Finalizado</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Duración (Horas Cátedra)
              </label>
              <input
                type="number"
                value={formData.duracion_horas}
                onChange={(e) => setFormData({ ...formData, duracion_horas: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                required
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Horario y Días *
              </label>
              <input
                type="text"
                required
                value={formData.horario}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                placeholder="Ej: Sábados de 09:00 a 13:00 hs"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Lugar / Sede *
              </label>
              <input
                type="text"
                required
                value={formData.lugar}
                onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                placeholder="Sede ARIQ o Campus Virtual"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cupos Totales *
              </label>
              <input
                type="number"
                required
                value={formData.cupos}
                onChange={(e) => setFormData({ ...formData, cupos: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cupos Disponibles *
              </label>
              <input
                type="number"
                required
                value={formData.cupos_disponibles}
                onChange={(e) => setFormData({ ...formData, cupos_disponibles: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Imagen del Curso (URL o Preset)
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
                <option value="/images/curso-laparoscopia.jpg">Laparoscopía</option>
                <option value="/images/curso-esterilizacion.jpg">Esterilización</option>
                <option value="/images/hero-suite.jpg">Quirófano</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Descripción del Programa *
            </label>
            <textarea
              required
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Objetivos del curso, contenidos temáticos y metodología..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Requisitos de Admisión
              </label>
              <input
                type="text"
                value={formData.requisitos}
                onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
                placeholder="Título de Instrumentador Quirúrgico o constancia..."
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Arancel e Información de Pago
              </label>
              <input
                type="text"
                value={formData.arancel}
                onChange={(e) => setFormData({ ...formData, arancel: e.target.value })}
                placeholder="Valores, cuotas y descuento a socios..."
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Guardar Cambios' : 'Registrar Curso'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar Baja de Curso"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">¿Desea eliminar el curso seleccionado?</p>
              <p className="mt-1">
                Curso: <strong>{itemToDelete?.nombre}</strong>
              </p>
              <p className="mt-1 text-stone-500">Se eliminarán también las inscripciones asociadas.</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Confirmar Baja
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
