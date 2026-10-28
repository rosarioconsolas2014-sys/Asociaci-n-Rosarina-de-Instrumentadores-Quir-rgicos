import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ShieldCheck, HeartPulse } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo-ariq.png"
                alt="Logo ARIQ"
                className="w-12 h-12 object-contain rounded-full bg-white p-0.5"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="font-bold text-xl text-white tracking-tight">ARIQ</span>
                <p className="text-xs text-stone-400">Asociación Rosarina de Instrumentadores Quirúrgicos</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-stone-400">
              <strong className="text-stone-300">Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil</strong>
              <br />
              Personería Jurídica: Resolución I.G.P.J. N° 412/1988
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-red-400 font-medium pt-1">
              <HeartPulse className="w-3.5 h-3.5 text-red-500" />
              <span>Jerarquizando el ejercicio profesional quirúrgico</span>
            </div>
          </div>

          {/* Col 2: Institutional & Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Navegación Institucional
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/institucional" className="hover:text-white transition-colors">
                  Sobre la Asociación
                </Link>
              </li>
              <li>
                <Link to="/noticias" className="hover:text-white transition-colors">
                  Noticias y Novedades
                </Link>
              </li>
              <li>
                <Link to="/cursos" className="hover:text-white transition-colors">
                  Cursos y Capacitación
                </Link>
              </li>
              <li>
                <Link to="/eventos" className="hover:text-white transition-colors">
                  Agenda de Eventos
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-white transition-colors">
                  Contacto y Afiliaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Standards */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Marco Profesional
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Ejercicio Ético y Matriculación</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Normas de Bioseguridad en Quirófano</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Checklist de Cirugía Segura (OMS)</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Trazabilidad de Esterilización e Instrumental</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Sede y Contacto
            </h4>
            <ul className="space-y-3 text-xs text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <span>Rosario, Provincia de Santa Fe, República Argentina</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                <a href="mailto:contacto@ariq.org.ar" className="hover:text-white transition-colors">
                  contacto@ariq.org.ar
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                <span>Atención: Lunes a Viernes 14:00 a 19:00 hs</span>
              </li>
            </ul>
            <div className="mt-5 pt-4 border-t border-stone-800">
              <Link
                to="/login"
                className="text-xs text-stone-400 hover:text-red-400 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Acceso al Sistema Administrativo &rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            &copy; {currentYear} Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil (ARIQ). Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/institucional" className="hover:text-stone-400 transition-colors">
              Estatuto Social
            </Link>
            <Link to="/contacto" className="hover:text-stone-400 transition-colors">
              Consultas
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
