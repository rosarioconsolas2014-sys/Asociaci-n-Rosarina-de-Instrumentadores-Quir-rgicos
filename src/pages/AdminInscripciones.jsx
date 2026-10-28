import React, { useState, useEffect } from 'react';
import {
  Users,
  Check,
  X,
  Eye,
  Trash2,
  Download,
  AlertTriangle,
  Mail,
  Phone,
  Hospital,
} from 'lucide-react';
import DataTable from '../components/DataTable.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { inscripcionesService } from '../services/inscripcionesService.js';
import { cursosService } from '../services/cursosService.js';

export default function AdminInscripciones() {
  const [inscripciones, setInscripciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ins, cur] = await Promise.all([
        inscripcionesService.getInscripciones(),
        cursosService.getCursos(),
      ]);
      setInscripciones(ins);
      setCursos(cur);
    } catch (err) {
      console.error('Error al cargar inscripciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id, nuevoEstado) => {
    try {
      await inscripcionesService.updateEstado(id, nuevoEstado);
      await loadData();
      if (selectedInscripcion && selectedInscripcion.id === id) {
        setSelectedInscripcion((prev) => ({ ...prev, estado: nuevoEstado }));
      }
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await inscripcionesService.deleteInscripcion(itemToDelete.id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (inscripciones.length === 0) return;
    const headers = ['Nombre Completo', 'Email', 'Telefono', 'Matricula/DNI', 'Curso', 'Institucion', 'Socio ARIQ', 'Estado', 'Fecha Registro'];
    const rows = inscripciones.map((i) => [
      `"${i.nombre_completo}"`,
      `"${i.email}"`,
      `"${i.telefono || ''}"`,
      `"${i.matricula_o_dni}"`,
      `"${i.cursos?.nombre || i.curso_nombre || ''}"`,
      `"${i.institucion_laboral || ''}"`,
      i.es_socio_ariq ? 'SI' : 'NO',
      i.estado,
      new Date(i.created_at).toLocaleDateString('es-AR'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ariq_inscriptos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = inscripciones.filter((i) => {
    const matchesCurso = selectedCursoId ? i.curso_id === selectedCursoId : true;
    const matchesEstado = selectedEstado ? i.estado === selectedEstado : true;
    return matchesCurso && matchesEstado;
  });

  const columns = [
    {
      header: 'Profesional Inscripto',
      accessor: 'nombre_completo',
      render: (row) => (
        <div>
          <span className="font-semibold text-stone-900 block leading-tight">
            {row.nombre_completo}
          </span>
          <span className="text-stone-400 text-xs">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Curso',
      accessor: 'curso_id',
      render: (row) => (
        <span className="text-xs text-stone-700 font-medium line-clamp-1 max-w-xs">
          {row.cursos?.nombre || row.curso_nombre || 'Curso'}
        </span>
      ),
    },
    {
      header: 'Matrícula / DNI',
      accessor: 'matricula_o_dni',
      render: (row) => (
        <span className="text-xs font-mono text-stone-600">
          {row.matricula_o_dni}
        </span>
      ),
    },
    {
      header: 'Socio ARIQ',
      accessor: 'es_socio_ariq',
      render: (row) => (
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
            row.es_socio_ariq
              ? 'bg-red-50 text-red-700'
              : 'bg-stone-100 text-stone-500'
          }`}
        >
          {row.es_socio_ariq ? 'Socio' : 'No Socio'}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: 'estado',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            row.estado === 'confirmada'
              ? 'bg-emerald-50 text-emerald-700'
              : row.estado === 'rechazada'
              ? 'bg-rose-50 text-rose-700'
              : 'bg-amber-50 text-amber-700'
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
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setSelectedInscripcion(row);
              setDetailModalOpen(true);
            }}
            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
            title="Ver ficha completa"
          >
            <Eye className="w-4 h-4" />
          </button>

          {row.estado !== 'confirmada' && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'confirmada')}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
              title="Confirmar vacante"
            >
              <Check className="w-4 h-4" />
            </button>
          )}

          {row.estado !== 'rechazada' && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'rechazada')}
              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded cursor-pointer"
              title="Rechazar inscripción"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              setItemToDelete(row);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
            title="Eliminar registro"
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
          <h1 className="text-2xl font-bold text-stone-900">Inscripciones a Cursos</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Revise los aspirantes registrados, apruebe vacantes y gestione el padrón de alumnos.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          icon={Download}
          disabled={inscripciones.length === 0}
        >
          Exportar Padrón (CSV)
        </Button>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedCursoId}
          onChange={(e) => setSelectedCursoId(e.target.value)}
          className="text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600"
        >
          <option value="">Todos los cursos</option>
          {cursos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select
          value={selectedEstado}
          onChange={(e) => setSelectedEstado(e.target.value)}
          className="text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="confirmada">Confirmadas</option>
          <option value="rechazada">Rechazadas</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Buscar por nombre, correo o matrícula..."
        searchKeys={['nombre_completo', 'email', 'matricula_o_dni', 'institucion_laboral']}
      />

      {/* DETAIL MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Ficha del Inscripto"
        subtitle={selectedInscripcion?.nombre_completo}
        maxWidth="max-w-lg"
      >
        {selectedInscripcion && (
          <div className="space-y-4 text-xs">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
              <div>
                <span className="text-stone-400 block font-semibold text-[10px] uppercase">
                  Curso Solicitado
                </span>
                <span className="font-bold text-stone-900 text-sm block">
                  {selectedInscripcion.cursos?.nombre || selectedInscripcion.curso_nombre}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                <div>
                  <span className="text-stone-400 block font-semibold text-[10px] uppercase">
                    Estado Actual
                  </span>
                  <span className="capitalize font-bold text-stone-800">
                    {selectedInscripcion.estado}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block font-semibold text-[10px] uppercase">
                    Fecha de Postulación
                  </span>
                  <span className="text-stone-700">
                    {new Date(selectedInscripcion.created_at).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-stone-400" />
                <span><strong>Email:</strong> {selectedInscripcion.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-400" />
                <span><strong>Teléfono:</strong> {selectedInscripcion.telefono || 'No indicado'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hospital className="w-4 h-4 text-stone-400" />
                <span><strong>Institución:</strong> {selectedInscripcion.institucion_laboral || 'No especificada'}</span>
              </div>
              <div>
                <strong>Matrícula / DNI:</strong> {selectedInscripcion.matricula_o_dni}
              </div>
              <div>
                <strong>Condición Societaria:</strong> {selectedInscripcion.es_socio_ariq ? 'Socio Activo ARIQ' : 'No Asociado'}
              </div>
              {selectedInscripcion.comentarios && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                  <strong className="block mb-1">Comentarios del postulante:</strong>
                  <p className="text-stone-600 italic">{selectedInscripcion.comentarios}</p>
                </div>
              )}
            </div>

            {/* Change Status Fast Buttons */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="font-semibold text-stone-700">Cambiar estado:</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={selectedInscripcion.estado === 'confirmada' ? 'secondary' : 'primary'}
                  onClick={() => handleUpdateStatus(selectedInscripcion.id, 'confirmada')}
                >
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedInscripcion.id, 'rechazada')}
                >
                  Rechazar
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
        title="Eliminar Inscripción"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">¿Desea eliminar este registro de inscripción?</p>
              <p className="mt-1">
                Postulante: <strong>{itemToDelete?.nombre_completo}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
