import React, { useState, useEffect } from 'react';
import { ShieldCheck, HeartPulse, Scale, Award, Users, BookOpen, CheckCircle } from 'lucide-react';
import Card from '../components/Card.jsx';
import { configuracionService } from '../services/configuracionService.js';

export default function Institucional() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    configuracionService.getConfiguracion().then(setConfig);
  }, []);

  return (
    <div className="bg-white">
      {/* Header Banner */}
      <section className="bg-stone-50 border-b border-stone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Marco Institucional
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2 tracking-tight">
              Sobre Nuestra Asociación
            </h1>
            <p className="text-base text-stone-600 mt-4 leading-relaxed">
              La <strong>Asociación Rosarina de Instrumentadores Quirúrgicos (ARIQ)</strong>, constituida como <em>Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil</em>, es la entidad rectora que congrega a los profesionales de la instrumentación quirúrgica en Rosario y su región.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Narrative Column */}
            <div className="lg:col-span-8 space-y-12">
              {/* Historia y Origen */}
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
                  Reseña Histórica y Personería Jurídica
                </h2>
                <div className="prose prose-stone text-sm text-stone-600 space-y-4 leading-relaxed">
                  <p>
                    Fundada con el objeto de jerarquizar y dignificar el ejercicio de la instrumentación quirúrgica, nuestra asociación civil obtuvo el reconocimiento de su <strong>Personería Jurídica mediante Resolución I.G.P.J. N° 412/1988</strong> por parte de la Inspección General de Personas Jurídicas de la Provincia de Santa Fe.
                  </p>
                  <p>
                    A lo largo de más de tres décadas, ARIQ ha sido promotora activa de leyes provinciales de ejercicio profesional, garantizando que el acto perioperatorio sea desempeñado por profesionales formados en instituciones universitarias y terciarias oficialmente reconocidas.
                  </p>
                </div>
              </div>

              {/* Misión, Visión y Valores */}
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-6 pb-2 border-b border-stone-100">
                  Pilares Estratégicos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Card padding="p-6" className="bg-stone-50/50">
                    <HeartPulse className="w-6 h-6 text-red-600 mb-3" />
                    <h3 className="text-base font-bold text-stone-900 mb-2">Misión</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Representar gremial, legal y científicamente a los instrumentadores quirúrgicos, velando por la excelencia y la seguridad del paciente.
                    </p>
                  </Card>

                  <Card padding="p-6" className="bg-stone-50/50">
                    <Award className="w-6 h-6 text-red-600 mb-3" />
                    <h3 className="text-base font-bold text-stone-900 mb-2">Visión</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Ser el referente indiscutido en formación continua, investigación y regulación de la disciplina quirúrgica en el centro del país.
                    </p>
                  </Card>

                  <Card padding="p-6" className="bg-stone-50/50">
                    <Scale className="w-6 h-6 text-red-600 mb-3" />
                    <h3 className="text-base font-bold text-stone-900 mb-2">Valores</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Ética profesional, rigor científico, compromiso deontológico, trabajo interdisciplinario y solidaridad gremial.
                    </p>
                  </Card>
                </div>
              </div>

              {/* Marco Profesional de la Instrumentación Quirúrgica */}
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
                  El Rol del Instrumentador Quirúrgico
                </h2>
                <div className="prose prose-stone text-sm text-stone-600 space-y-4 leading-relaxed">
                  <p>
                    El Instrumentador Quirúrgico es un miembro indispensable del equipo interdisciplinario que asiste técnica, científica y humanamente al paciente antes, durante y después del procedimiento quirúrgico.
                  </p>
                  <p>
                    Sus competencias comprenden desde el estricto mantenimiento de las cadenas de asepsia y antisepsia, la preparación y control del instrumental específico (abierto, laparoscópico, endoscópico y robótico), hasta la verificación del Checklist de Cirugía Segura de la OMS y el recuento riguroso de gasas, compresas e instrumental.
                  </p>
                </div>
              </div>

              {/* Objetivos Estatutarios */}
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4 pb-2 border-b border-stone-100">
                  Objetivos Estatutarios Principales
                </h2>
                <ul className="space-y-3 text-sm text-stone-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span>Promover la jerarquización del título profesional y su adecuada remuneración laboral.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span>Organizar congresos, jornadas, ateneos y cursos de actualización científica con aval institucional.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span>Defender los intereses gremiales y profesionales de los asociados ante las autoridades de salud públicas y privadas.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span>Propiciar la colegiación legal de la instrumentación quirúrgica en la Provincia de Santa Fe.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Sidebar: Official Details Card */}
            <div className="lg:col-span-4 space-y-6">
              <Card padding="p-6" className="bg-stone-50 border-stone-200">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-stone-200">
                  <img
                    src="/images/logo-ariq.png"
                    alt="Logo ARIQ"
                    className="w-12 h-12 rounded-full bg-white p-0.5 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Ficha Institucional</h3>
                    <span className="text-xs text-stone-500">Datos Oficiales</span>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-stone-400 uppercase tracking-wider block font-semibold text-[10px]">
                      Denominación Legal
                    </span>
                    <span className="font-bold text-stone-900 block mt-0.5">
                      {config?.nombre_oficial || 'Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil'}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 uppercase tracking-wider block font-semibold text-[10px]">
                      Sigla Oficial
                    </span>
                    <span className="font-bold text-red-600 block mt-0.5">
                      ARIQ
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 uppercase tracking-wider block font-semibold text-[10px]">
                      Personería Jurídica
                    </span>
                    <span className="text-stone-800 block mt-0.5">
                      {config?.personeria_juridica || 'Resolución I.G.P.J. N° 412/1988'}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 uppercase tracking-wider block font-semibold text-[10px]">
                      CUIT
                    </span>
                    <span className="text-stone-800 font-mono block mt-0.5">
                      {config?.cuit || '30-65487219-4'}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 uppercase tracking-wider block font-semibold text-[10px]">
                      Sede Principal
                    </span>
                    <span className="text-stone-800 block mt-0.5">
                      Rosario, Santa Fe, República Argentina
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 uppercase tracking-wider block font-semibold text-[10px]">
                      Horario de Atención
                    </span>
                    <span className="text-stone-800 block mt-0.5">
                      {config?.contacto?.horario_atencion || 'Lunes a Viernes de 14:00 a 19:00 hs'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card padding="p-6">
                <Users className="w-5 h-5 text-red-600 mb-2" />
                <h4 className="font-bold text-stone-900 text-sm mb-1">Comisiones de Trabajo</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Las autoridades y subcomisiones (Comité Científico, Subcomisión Gremial y Comisión Revisora de Cuentas) sesionan de manera periódica en la sede social.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
