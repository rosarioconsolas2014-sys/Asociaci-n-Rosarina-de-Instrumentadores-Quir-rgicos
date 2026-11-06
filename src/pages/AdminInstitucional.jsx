import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Users,
  Award,
  Scale,
  HeartPulse,
  BookOpen,
  FileText,
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { configuracionService } from '../services/configuracionService.js';
import { logInternalActivity } from '../firebase/firestore.js';

export default function AdminInstitucional() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [formData, setFormData] = useState({
    nombre_oficial: 'Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil',
    sigla: 'ARIQ',
    personeria_juridica: 'Resolución I.G.P.J. N° 412/1988',
    cuit: '30-65487219-4',
    fecha_fundacion: '1988-06-15',
    historia_resumen:
      'Fundada con el objeto de jerarquizar y dignificar el ejercicio de la instrumentación quirúrgica, nuestra asociación civil obtuvo el reconocimiento de su Personería Jurídica mediante Resolución I.G.P.J. N° 412/1988 por parte de la Inspección General de Personas Jurídicas de la Provincia de Santa Fe.',
    historia_completa:
      'A lo largo de más de tres décadas, ARIQ ha sido promotora activa de leyes provinciales de ejercicio profesional, garantizando que el acto perioperatorio sea desempeñado por profesionales formados en instituciones universitarias y terciarias oficialmente reconocidas.\n\nARIQ promueve el perfeccionamiento científico, la defensa gremial, el cumplimiento de las normas de bioseguridad quirúrgica y la jerarquización del rol dentro del equipo quirúrgico en efectores de salud públicos y privados.',
    mision:
      'Representar gremial, legal y científicamente a los instrumentadores quirúrgicos, velando por la excelencia y la seguridad del paciente.',
    vision:
      'Ser el referente indiscutido en formación continua, investigación y regulación de la disciplina quirúrgica en el centro del país.',
    valores:
      'Ética profesional, rigor científico, compromiso deontológico, trabajo interdisciplinario y solidaridad gremial.',
    rol_profesional_texto:
      'El Instrumentador Quirúrgico es un miembro indispensable del equipo interdisciplinario que asiste técnica, científica y humanamente al paciente antes, durante y después del procedimiento quirúrgico. Sus competencias comprenden desde el estricto mantenimiento de las cadenas de asepsia y antisepsia, la preparación y control del instrumental específico, hasta la verificación del Checklist de Cirugía Segura de la OMS.',
    objetivos_estatutarios: [
      'Promover la jerarquización del título profesional y su adecuada remuneración laboral.',
      'Organizar congresos, jornadas, ateneos y cursos de actualización científica con aval institucional.',
      'Defender los intereses gremiales y profesionales de los asociados ante las autoridades de salud públicas y privadas.',
      'Propiciar la colegiación legal de la instrumentación quirúrgica en la Provincia de Santa Fe.',
      'Promover la investigación y publicación científica de la especialidad.',
    ],
    autoridades: [
      { cargo: 'Presidente', nombre: 'Lic. Claudia S. Morales', periodo: '2024-2026' },
      { cargo: 'Vicepresidente', nombre: 'Lic. Mariano F. Ponce', periodo: '2024-2026' },
      { cargo: 'Secretario General', nombre: 'Prof. Javier V. Giménez', periodo: '2024-2026' },
      { cargo: 'Tesorera', nombre: 'Tec. Lucía R. Mendoza', periodo: '2024-2026' },
      { cargo: 'Vocal Titular 1°', nombre: 'Lic. Romina Andrea López', periodo: '2024-2026' },
      { cargo: 'Vocal Titular 2°', nombre: 'Tec. Gabriel E. Benítez', periodo: '2024-2026' },
      { cargo: 'Comité Científico', nombre: 'Coord. Dra. Valeria S. Fontana', periodo: '2024-2026' },
      { cargo: 'Revisora de Cuentas', nombre: 'Lic. Patricia D. Castro', periodo: '2024-2026' },
    ],
  });

  useEffect(() => {
    async function fetchInstitucional() {
      try {
        setLoading(true);
        const data = await configuracionService.getConfiguracion();
        if (data) {
          setFormData((prev) => ({
            ...prev,
            ...data,
            objetivos_estatutarios:
              data.objetivos_estatutarios && data.objetivos_estatutarios.length > 0
                ? data.objetivos_estatutarios
                : prev.objetivos_estatutarios,
            autoridades:
              data.autoridades && data.autoridades.length > 0
                ? data.autoridades
                : prev.autoridades,
          }));
        }
      } catch (err) {
        console.error('Error al cargar datos institucionales:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInstitucional();
  }, []);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleAddObjetivo = () => {
    setFormData((prev) => ({
      ...prev,
      objetivos_estatutarios: [...prev.objetivos_estatutarios, ''],
    }));
  };

  const handleUpdateObjetivo = (idx, text) => {
    setFormData((prev) => {
      const copy = [...prev.objetivos_estatutarios];
      copy[idx] = text;
      return { ...prev, objetivos_estatutarios: copy };
    });
  };

  const handleRemoveObjetivo = (idx) => {
    setFormData((prev) => ({
      ...prev,
      objetivos_estatutarios: prev.objetivos_estatutarios.filter((_, i) => i !== idx),
    }));
  };

  const handleAddAutoridad = () => {
    setFormData((prev) => ({
      ...prev,
      autoridades: [
        ...prev.autoridades,
        { cargo: 'Nuevo Cargo', nombre: '', periodo: '2024-2026' },
      ],
    }));
  };

  const handleUpdateAutoridad = (idx, field, val) => {
    setFormData((prev) => {
      const copy = [...prev.autoridades];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, autoridades: copy };
    });
  };

  const handleRemoveAutoridad = (idx) => {
    setFormData((prev) => ({
      ...prev,
      autoridades: prev.autoridades.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await configuracionService.updateConfiguracion(formData);
      await logInternalActivity(
        'UPDATE_INSTITUCIONAL',
        'institucional',
        'ariq_main',
        'Actualización del marco institucional, autoridades y estatutos'
      );
      setSuccessMsg('Información institucional actualizada correctamente en Firestore.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la información institucional.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-stone-400">
        Cargando contenidos institucionales...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Gestión Institucional
            </h1>
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-mono text-[10px] font-bold">
              SECCIÓN C
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Administre la historia oficial, personería jurídica (Res. IGPJ 412/1988), pilares estratégicos y nómina de autoridades.
          </p>
        </div>

        <Button
          onClick={handleSave}
          loading={saving}
          icon={Save}
          size="sm"
          className="self-start sm:self-center"
        >
          Guardar Cambios Institucionales
        </Button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Datos Jurídicos e Identidad Legal */}
        <Card padding="p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-stone-100">
            <Scale className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-bold text-stone-900">
              Marco Legal y Personería Jurídica
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Denominación Legal Oficial
              </label>
              <input
                type="text"
                value={formData.nombre_oficial}
                onChange={(e) => handleChange('nombre_oficial', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Sigla Institucional
              </label>
              <input
                type="text"
                value={formData.sigla}
                onChange={(e) => handleChange('sigla', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 font-bold text-red-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Personería Jurídica (IGPJ Santa Fe)
              </label>
              <input
                type="text"
                value={formData.personeria_juridica}
                onChange={(e) => handleChange('personeria_juridica', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                CUIT Oficial
              </label>
              <input
                type="text"
                value={formData.cuit}
                onChange={(e) => handleChange('cuit', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
              />
            </div>
          </div>
        </Card>

        {/* 2. Reseña Histórica y Origen */}
        <Card padding="p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-stone-100">
            <BookOpen className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-bold text-stone-900">
              Reseña Histórica y Trayectoria
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Resumen Histórico (Primer párrafo en portal público)
              </label>
              <textarea
                rows={3}
                value={formData.historia_resumen}
                onChange={(e) => handleChange('historia_resumen', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Trayectoria y Logros Institucionales
              </label>
              <textarea
                rows={4}
                value={formData.historia_completa}
                onChange={(e) => handleChange('historia_completa', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
        </Card>

        {/* 3. Pilares Estratégicos (Misión, Visión, Valores) */}
        <Card padding="p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-stone-100">
            <HeartPulse className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-bold text-stone-900">
              Pilares Estratégicos Institucionales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Misión Institucional
              </label>
              <textarea
                rows={4}
                value={formData.mision}
                onChange={(e) => handleChange('mision', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Visión de Futuro
              </label>
              <textarea
                rows={4}
                value={formData.vision}
                onChange={(e) => handleChange('vision', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Valores Deontológicos
              </label>
              <textarea
                rows={4}
                value={formData.valores}
                onChange={(e) => handleChange('valores', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
        </Card>

        {/* 4. El Rol del Instrumentador Quirúrgico */}
        <Card padding="p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-stone-100">
            <Award className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-bold text-stone-900">
              Definición del Rol del Instrumentador Quirúrgico
            </h2>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-stone-700 mb-1">
              Competencias y Alcance Profesional
            </label>
            <textarea
              rows={4}
              value={formData.rol_profesional_texto}
              onChange={(e) => handleChange('rol_profesional_texto', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
        </Card>

        {/* 5. Objetivos Estatutarios */}
        <Card padding="p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              <h2 className="text-sm font-bold text-stone-900">
                Objetivos Estatutarios Principales
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddObjetivo}
            >
              Agregar Objetivo
            </Button>
          </div>

          <div className="space-y-2.5 text-xs">
            {formData.objetivos_estatutarios.map((obj, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-bold text-stone-400 w-5 shrink-0 text-center">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  value={obj}
                  onChange={(e) => handleUpdateObjetivo(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveObjetivo(idx)}
                  className="p-2 text-stone-400 hover:text-red-600 rounded cursor-pointer"
                  title="Eliminar objetivo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* 6. Autoridades y Comisión Directiva */}
        <Card padding="p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              <h2 className="text-sm font-bold text-stone-900">
                Comisión Directiva y Autoridades
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddAutoridad}
            >
              Agregar Autoridad
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px]">
                  <th className="py-2">Cargo / Comisión</th>
                  <th className="py-2">Nombre y Apellido</th>
                  <th className="py-2">Período</th>
                  <th className="py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {formData.autoridades.map((aut, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={aut.cargo}
                        onChange={(e) => handleUpdateAutoridad(idx, 'cargo', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-semibold text-stone-900"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={aut.nombre}
                        onChange={(e) => handleUpdateAutoridad(idx, 'nombre', e.target.value)}
                        placeholder="Ej. Lic. Claudia S. Morales"
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={aut.periodo}
                        onChange={(e) => handleUpdateAutoridad(idx, 'periodo', e.target.value)}
                        placeholder="2024-2026"
                        className="w-28 px-2.5 py-1.5 border border-stone-300 rounded font-mono text-center"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveAutoridad(idx)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded cursor-pointer"
                        title="Eliminar autoridad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bottom Save Bar */}
        <div className="flex justify-end pt-4">
          <Button type="submit" loading={saving} icon={Save} size="lg">
            Guardar Todos los Cambios Institucionales
          </Button>
        </div>
      </form>
    </div>
  );
}
