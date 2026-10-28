import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { contactoService } from '../services/contactoService.js';
import { configuracionService } from '../services/configuracionService.js';

export default function Contacto() {
  const [searchParams] = useSearchParams();
  const [config, setConfig] = useState(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    motivo: searchParams.get('motivo') || 'general',
    mensaje: searchParams.get('ref') ? `Consulta sobre: ${searchParams.get('ref')}\n\n` : '',
    honeypot: '', // anti-bot spam honey field
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    configuracionService.getConfiguracion().then(setConfig);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await contactoService.enviarConsulta(formData);
      setSuccess(true);
      setFormData({
        nombre_completo: '',
        email: '',
        telefono: '',
        motivo: 'general',
        mensaje: '',
        honeypot: '',
      });
    } catch (err) {
      setErrorMessage(err.message || 'Ocurrió un error al enviar el formulario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-[70vh]">
      {/* Header Banner */}
      <section className="bg-stone-50 border-b border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Canales Oficiales
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2 tracking-tight">
              Mesa de Contacto y Afiliaciones
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-2">
              Comuníquese con la Secretaría de la Asociación Rosarina de Instrumentadores Quirúrgicos.
            </p>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Form */}
            <div className="lg:col-span-7">
              <Card padding="p-8">
                <h2 className="text-xl font-bold text-stone-900 mb-2">
                  Formulario de Contacto Institucional
                </h2>
                <p className="text-xs text-stone-500 mb-6">
                  Complete los datos a continuación y nos pondremos en contacto a la brevedad.
                </p>

                {success && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">¡Mensaje Enviado con Éxito!</h4>
                      <p className="text-xs mt-1 text-emerald-700 leading-relaxed">
                        Su consulta ha sido registrada en el sistema administrativo de ARIQ. Nuestro personal responderá a su casilla de correo a la mayor brevedad.
                      </p>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">No se pudo enviar la consulta</h4>
                      <p className="text-xs mt-1 text-rose-700">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot hidden input for anti-bot protection */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      name="honeypot"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.honeypot}
                      onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                      placeholder="Ej: Lic. Julieta Fernández"
                      className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
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
                        placeholder="tu-correo@ejemplo.com"
                        className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Teléfono (opcional)
                      </label>
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="+54 341 000-0000"
                        className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Motivo de la Consulta *
                    </label>
                    <select
                      required
                      value={formData.motivo}
                      onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
                    >
                      <option value="afiliacion">Afiliación a la Asociación / Cuota Societaria</option>
                      <option value="cursos">Cursos, Capacitaciones y Talleres</option>
                      <option value="ejercicio_profesional">Ejercicio Profesional y Matrícula</option>
                      <option value="legal_gremial">Consultas Legales y Gremiales</option>
                      <option value="general">Otras Consultas Generales</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Mensaje Detallado *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.mensaje}
                      onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                      placeholder="Describa su inquietud o solicitud..."
                      className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" loading={loading} icon={Send} className="w-full sm:w-auto">
                      Enviar Consulta
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Right Column: Contact info */}
            <div className="lg:col-span-5 space-y-6">
              <Card padding="p-6" className="bg-stone-50 border-stone-200">
                <h3 className="text-base font-bold text-stone-900 mb-4 pb-2 border-b border-stone-200">
                  Información Oficial de Contacto
                </h3>

                <ul className="space-y-4 text-xs text-stone-600">
                  <li className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-800 block">Sede Social</strong>
                      <span>Rosario, Provincia de Santa Fe, República Argentina</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-800 block">Correos Electrónicos</strong>
                      <a href="mailto:contacto@ariq.org.ar" className="text-red-700 hover:underline block">
                        contacto@ariq.org.ar
                      </a>
                      <a href="mailto:capacitacion@ariq.org.ar" className="text-red-700 hover:underline block">
                        capacitacion@ariq.org.ar
                      </a>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-800 block">Horario de Secretaría</strong>
                      <span>{config?.contacto?.horario_atencion || 'Lunes a Viernes de 14:00 a 19:00 hs'}</span>
                    </div>
                  </li>
                </ul>
              </Card>

              <Card padding="p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                      Afiliaciones y Beneficios
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      Estar asociado a ARIQ te permite acceder a aranceles diferenciales en congresos y capacitaciones, asesoramiento laboral y defensa de tus derechos profesionales.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
