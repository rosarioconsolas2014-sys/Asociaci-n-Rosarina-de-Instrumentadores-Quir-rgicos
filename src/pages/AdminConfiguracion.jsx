import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Shield } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { configuracionService } from '../services/configuracionService.js';

export default function AdminConfiguracion() {
  const [config, setConfig] = useState({
    nombre_oficial: 'Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil',
    sigla: 'ARIQ',
    lema: 'Jerarquizando el ejercicio profesional y la seguridad del paciente quirúrgico',
    personeria_juridica: 'Resolución I.G.P.J. N° 412/1988',
    cuit: '30-65487219-4',
    sede: {
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
      pais: 'Argentina',
      direccion: 'Rosario, Santa Fe',
    },
    contacto: {
      email: 'contacto@ariq.org.ar',
      email_cursos: 'capacitacion@ariq.org.ar',
      telefono: '+54 (341) 480-0000',
      horario_atencion: 'Lunes a Viernes de 14:00 a 19:00 hs',
    },
    redes_sociales: {
      instagram: 'https://instagram.com/ariq_rosario',
      facebook: 'https://facebook.com/ariqrosario',
      linkedin: 'https://linkedin.com/company/ariq-rosario',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    configuracionService.getConfiguracion().then((data) => {
      if (data) setConfig(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await configuracionService.updateConfiguracion(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Error al guardar configuración: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-stone-500">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Configuración Institucional</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Modifique los datos institucionales, información legal, personería jurídica y canales de atención.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¡Configuración institucional actualizada exitosamente!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identidad Legal */}
        <Card padding="p-6">
          <h3 className="text-sm font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-600" />
            <span>Identificación Legal y Estatutaria</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Denominación Oficial Registrada
              </label>
              <input
                type="text"
                required
                value={config.nombre_oficial}
                onChange={(e) => setConfig({ ...config, nombre_oficial: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Sigla Institucional
                </label>
                <input
                  type="text"
                  required
                  value={config.sigla}
                  onChange={(e) => setConfig({ ...config, sigla: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Personería Jurídica
                </label>
                <input
                  type="text"
                  required
                  value={config.personeria_juridica}
                  onChange={(e) => setConfig({ ...config, personeria_juridica: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  CUIT
                </label>
                <input
                  type="text"
                  value={config.cuit}
                  onChange={(e) => setConfig({ ...config, cuit: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Lema Institucional
              </label>
              <input
                type="text"
                value={config.lema}
                onChange={(e) => setConfig({ ...config, lema: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
        </Card>

        {/* Contacto y Horarios */}
        <Card padding="p-6">
          <h3 className="text-sm font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-red-600" />
            <span>Canales de Contacto y Atención</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email General
              </label>
              <input
                type="email"
                value={config.contacto?.email || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contacto: { ...config.contacto, email: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email Cursos y Capacitación
              </label>
              <input
                type="email"
                value={config.contacto?.email_cursos || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contacto: { ...config.contacto, email_cursos: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Horario de Atención
              </label>
              <input
                type="text"
                value={config.contacto?.horario_atencion || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contacto: { ...config.contacto, horario_atencion: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Ciudad y Sede
              </label>
              <input
                type="text"
                value={config.sede?.ciudad || 'Rosario, Santa Fe'}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sede: { ...config.sede, ciudad: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saving} icon={Save}>
            Guardar Configuración Institucional
          </Button>
        </div>
      </form>
    </div>
  );
}
