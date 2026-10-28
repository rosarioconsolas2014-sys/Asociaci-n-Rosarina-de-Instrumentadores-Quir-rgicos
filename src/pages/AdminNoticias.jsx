import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  AlertTriangle,
  Upload,
  Globe,
  FileText,
} from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { noticiasService, slugify } from '../services/noticiasService.js';

export default function AdminNoticias() {
  const [noticias, setNoticias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    slug: '',
    resumen: '',
    contenido: '',
    imagen_url: '/images/hero-suite.jpg',
    categoria_id: '',
    autor: 'Comisión Directiva ARIQ',
    estado: 'publicada',
    fecha_publicacion: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [searchParams] = useSearchParams();

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, news] = await Promise.all([
        noticiasService.getCategorias(),
        noticiasService.getNoticias({ soloPublicadas: false }),
      ]);
      setCategorias(cats);
      setNoticias(news);
      if (cats.length > 0 && !formData.categoria_id) {
        setFormData((prev) => ({ ...prev, categoria_id: cats[0].id }));
      }
    } catch (err) {
      console.error('Error al cargar noticias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('nueva') === '1') {
      handleOpenCreate();
    }
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      titulo: '',
      slug: '',
      resumen: '',
      contenido: '',
      imagen_url: '/images/hero-suite.jpg',
      categoria_id: categorias[0]?.id || '',
      autor: 'Comisión Directiva ARIQ',
      estado: 'publicada',
      fecha_publicacion: new Date().toISOString().split('T')[0],
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      titulo: item.titulo || '',
      slug: item.slug || '',
      resumen: item.resumen || '',
      contenido: item.contenido || '',
      imagen_url: item.imagen_url || '/images/hero-suite.jpg',
      categoria_id: item.categoria_id || categorias[0]?.id || '',
      autor: item.autor || 'Comisión Directiva ARIQ',
      estado: item.estado || 'publicada',
      fecha_publicacion: item.fecha_publicacion || new Date().toISOString().split('T')[0],
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleTituloChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      titulo: val,
      // Auto-update slug if creating or if slug matches old title slug
      slug: !editingId ? slugify(val) : prev.slug,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (!formData.titulo.trim() || !formData.resumen.trim() || !formData.contenido.trim()) {
        throw new Error('Complete todos los campos requeridos (título, resumen y contenido).');
      }

      if (editingId) {
        await noticiasService.updateNoticia(editingId, formData);
      } else {
        await noticiasService.createNoticia(formData);
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Error al guardar la noticia.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (item) => {
    try {
      await noticiasService.toggleEstado(item.id);
      await loadData();
    } catch (err) {
      alert('Error al cambiar estado: ' + err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await noticiasService.deleteNoticia(itemToDelete.id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Noticia / Título',
      accessor: 'titulo',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.imagen_url || '/images/hero-suite.jpg'}
            alt=""
            className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-semibold text-stone-900 block leading-tight">{row.titulo}</span>
            <span className="text-stone-400 text-xs font-mono">{row.slug}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Categoría',
      accessor: 'categoria_id',
      render: (row) => (
        <span className="text-xs text-stone-600 font-medium">
          {row.categorias?.nombre || 'General'}
        </span>
      ),
    },
    {
      header: 'Fecha',
      accessor: 'fecha_publicacion',
      render: (row) => (
        <span className="text-xs text-stone-600 tabular-nums">
          {new Date(row.fecha_publicacion).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: 'estado',
      render: (row) => (
        <button
          onClick={() => handleToggleEstado(row)}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer uppercase tracking-wider transition-colors ${
            row.estado === 'publicada'
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
          title="Haga clic para alternar estado"
        >
          {row.estado}
        </button>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <a
            href={`/noticias/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
            title="Ver en el sitio"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-stone-600 hover:text-blue-600 hover:bg-stone-100 rounded cursor-pointer"
            title="Editar noticia"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setItemToDelete(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
            title="Eliminar noticia"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Gestión de Noticias</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Publique, edite y categorice artículos de la Asociación Rosarina de Instrumentadores Quirúrgicos.
          </p>
        </div>
        <Button onClick={handleOpenCreate} icon={Plus}>
          Nueva Noticia
        </Button>
      </div>

      {/* News Table */}
      <DataTable
        columns={columns}
        data={noticias}
        searchPlaceholder="Buscar por título, slug o resumen..."
        searchKeys={['titulo', 'slug', 'resumen', 'autor']}
      />

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Noticia' : 'Crear Nueva Noticia'}
        subtitle="Complete los campos requeridos para publicar el artículo."
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
              Título del Artículo *
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={handleTituloChange}
              placeholder="Ej: Nuevas Directivas de Bioseguridad en Quirófano"
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Slug (URL amigable) *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="nuevas-directivas-bioseguridad"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Categoría *
              </label>
              <select
                required
                value={formData.categoria_id}
                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Autor *
              </label>
              <input
                type="text"
                required
                value={formData.autor}
                onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                placeholder="Comisión Directiva ARIQ"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Fecha de Publicación *
              </label>
              <input
                type="date"
                required
                value={formData.fecha_publicacion}
                onChange={(e) => setFormData({ ...formData, fecha_publicacion: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
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
                <option value="publicada">Publicada (Visible)</option>
                <option value="borrador">Borrador (Oculta)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Imagen Destacada (URL o Preset de Quirófano)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.imagen_url}
                onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                placeholder="/images/hero-suite.jpg o URL de Supabase Storage"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <select
                onChange={(e) => {
                  if (e.target.value) setFormData({ ...formData, imagen_url: e.target.value });
                }}
                className="text-xs border border-stone-300 rounded-lg px-2 py-2 bg-stone-50"
              >
                <option value="">Presets...</option>
                <option value="/images/hero-suite.jpg">Quirófano Estéril</option>
                <option value="/images/curso-laparoscopia.jpg">Laparoscopía</option>
                <option value="/images/curso-esterilizacion.jpg">Esterilización</option>
                <option value="/images/evento-congreso.jpg">Auditorio / Congreso</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Resumen Breve (Copete) *
            </label>
            <textarea
              required
              rows={2}
              value={formData.resumen}
              onChange={(e) => setFormData({ ...formData, resumen: e.target.value })}
              placeholder="Breve introducción que se muestra en las tarjetas de noticias..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Cuerpo del Contenido (HTML o texto estructurado) *
            </label>
            <textarea
              required
              rows={8}
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              placeholder="<p>Texto de la noticia...</p><h3>Subtítulo</h3><p>Detalles...</p>"
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 font-mono text-stone-800"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Guardar Cambios' : 'Publicar Noticia'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">¿Está seguro de eliminar esta noticia?</p>
              <p className="mt-1">
                Título: <strong>{itemToDelete?.titulo}</strong>
              </p>
              <p className="mt-1 text-stone-500">Esta acción no se puede deshacer.</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Eliminar Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
