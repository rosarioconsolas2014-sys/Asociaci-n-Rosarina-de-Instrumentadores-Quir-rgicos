import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import { cursosService } from '../services/cursosService.js';
import { inscripcionesService } from '../services/inscripcionesService.js';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [selectedModalidad, setSelectedModalidad] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Enrollment Modal State
  const [searchParams, setSearchParams] = useSearchParams();
  const [inscribiendoCurso, setInscribiendoCurso] = useState(null);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    matricula_o_dni: '',
    institucion_laboral: '',
    es_socio_ariq: false,
    comentarios: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const data = await cursosService.getCursos({ soloActivos: true });
      setCursos(data);
      return data;
    } catch (err) {
      console.error('Error al cargar cursos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos().then((list) => {
      const cursoIdParam = searchParams.get('inscribir');
      if (cursoIdParam && list) {
        const found = list.find((c) => c.id === cursoIdParam);
        if (found) {
          setInscribiendoCurso(found);
        }
      }
    });
  }, [searchParams]);

  const handleOpenEnrollment = (curso) => {
    setInscribiendoCurso(curso);
    setSubmitSuccess(null);
    setSubmitError(null);
    setFormData({
      nombre_completo: '',
      email: '',
      telefono: '',
      matricula_o_dni: '',
      institucion_laboral: '',
      es_socio_ariq: false,
      comentarios: '',
    });
  };

  const handleCloseEnrollment = () => {
    setInscribiendoCurso(null);
    setSubmitSuccess(null);
    setSubmitError(null);
    if (searchParams.get('inscribir')) {
      searchParams.delete('inscribir');
      setSearchParams(searchParams);
    }
  };

  const handleSubmitEnrollment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await inscripcionesService.registrarInscripcion({
        curso_id: inscribiendoCurso.id,
        ...formData,
      });

      setSubmitSuccess(result);
      // Reload courses to update cupos disponibles
      await fetchCursos();
    } catch (err) {
      setSubmitError(err.message || 'Error al procesar la inscripción.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCursos = cursos.filter((curso) => {
    const matchesModalidad = selectedModalidad ? curso.modalidad === selectedModalidad : true;
    const matchesSearch = searchTerm
      ? curso.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        curso.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesModalidad && matchesSearch;
  });

  return (
    <div className="bg-white min-h-[70vh]">
      {/* Header Banner */}
      <section className="bg-stone-50 border-b border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Área Académica y Docencia
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2 tracking-tight">
              Cursos y Capacitaciones
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-2">
              Programas de perfeccionamiento teórico-práctico avalados por la Asociación Rosarina de Instrumentadores Quirúrgicos.
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="border-b border-stone-200 bg-white sticky top-20 z-30 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedModalidad('')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedModalidad === ''
                  ? 'bg-red-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Todas las modalidades
            </button>
            <button
              onClick={() => setSelectedModalidad('presencial')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedModalidad === 'presencial'
                  ? 'bg-red-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Presencial
            </button>
            <button
              onClick={() => setSelectedModalidad('virtual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedModalidad === 'virtual'
                  ? 'bg-red-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Virtual
            </button>
            <button
              onClick={() => setSelectedModalidad('hibrida')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedModalidad === 'hibrida'
                  ? 'bg-red-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Híbrida
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar curso o tema..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* Courses List */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="border border-stone-200 rounded-xl p-5 space-y-4">
                  <div className="aspect-[16/10] bg-stone-200 rounded-lg" />
                  <div className="h-5 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredCursos.length === 0 ? (
            <div className="py-16 text-center text-stone-500">
              <GraduationCap className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-700">No se encontraron cursos activos</h3>
              <p className="text-xs text-stone-500 mt-1">
                Comuníquese con secretaría para consultar el cronograma del próximo semestre.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredCursos.map((curso) => (
                <div
                  key={curso.id}
                  className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col md:flex-row hover:border-stone-300 transition-all shadow-xs"
                >
                  <div className="md:w-5/12 bg-stone-100 relative min-h-[220px]">
                    <img
                      src={curso.imagen_url || '/images/curso-laparoscopia.jpg'}
                      alt={curso.nombre}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-md capitalize">
                      {curso.modalidad}
                    </div>
                  </div>

                  <div className="md:w-7/12 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>Inicio: {new Date(curso.fecha_inicio).toLocaleDateString('es-AR')}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{curso.duracion_horas} hs cátedra</span>
                      </div>

                      <h2 className="text-lg font-bold text-stone-900 mb-2 leading-snug">
                        {curso.nombre}
                      </h2>

                      <p className="text-xs text-stone-600 line-clamp-3 mb-4 leading-relaxed">
                        {curso.descripcion}
                      </p>

                      <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-100 mb-4">
                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                          <span>{curso.horario}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                          <span>{curso.lugar}</span>
                        </div>
                        {curso.arancel && (
                          <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                            <strong>Arancel:</strong> {curso.arancel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <div className="text-xs">
                        {curso.cupos_disponibles > 0 ? (
                          <span className="text-emerald-700 font-semibold tabular-nums">
                            {curso.cupos_disponibles} cupos libres
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold">
                            Cupos agotados
                          </span>
                        )}
                      </div>

                      <Button
                        variant={curso.cupos_disponibles > 0 ? 'primary' : 'outline'}
                        size="sm"
                        disabled={curso.cupos_disponibles <= 0}
                        onClick={() => handleOpenEnrollment(curso)}
                      >
                        {curso.cupos_disponibles > 0 ? 'Inscribirme' : 'Lista de Espera'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ENROLLMENT MODAL */}
      <Modal
        isOpen={Boolean(inscribiendoCurso)}
        onClose={handleCloseEnrollment}
        title="Formulario de Inscripción Oficial"
        subtitle={inscribiendoCurso ? `Curso: ${inscribiendoCurso.nombre}` : ''}
        maxWidth="max-w-xl"
      >
        {submitSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-stone-900">¡Inscripción Registrada con Éxito!</h4>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              Hemos registrado su postulación para <strong>{inscribiendoCurso.nombre}</strong>. En breve la Secretaría de Admisión revisará los datos y se pondrá en contacto a <em>{formData.email}</em>.
            </p>
            <div className="pt-4">
              <Button onClick={handleCloseEnrollment}>Cerrar y Continuar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitEnrollment} className="space-y-4">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nombre y Apellido Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                placeholder="Ej: Lic. Martín Gómez"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+54 341 000-0000"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Matrícula Profesional o DNI *
                </label>
                <input
                  type="text"
                  required
                  value={formData.matricula_o_dni}
                  onChange={(e) => setFormData({ ...formData, matricula_o_dni: e.target.value })}
                  placeholder="Mat. o N° de Documento"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Institución / Sanatorio Laboral
                </label>
                <input
                  type="text"
                  value={formData.institucion_laboral}
                  onChange={(e) => setFormData({ ...formData, institucion_laboral: e.target.value })}
                  placeholder="Hospital o Centro Quirúrgico"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="es_socio"
                checked={formData.es_socio_ariq}
                onChange={(e) => setFormData({ ...formData, es_socio_ariq: e.target.checked })}
                className="rounded border-stone-300 text-red-600 focus:ring-red-600 cursor-pointer"
              />
              <label htmlFor="es_socio" className="text-xs text-stone-700 cursor-pointer">
                Soy socio activo de la Asociación Rosarina de Instrumentadores Quirúrgicos (ARIQ)
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Comentarios o Consultas Adicionales
              </label>
              <textarea
                rows={2}
                value={formData.comentarios}
                onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                placeholder="Experiencia previa en la especialidad, solicitud de plan de pagos, etc."
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseEnrollment}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                Confirmar Solicitud de Inscripción
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
