import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Newspaper,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  CheckCircle2,
  Users,
} from 'lucide-react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { noticiasService } from '../services/noticiasService.js';
import { cursosService } from '../services/cursosService.js';
import { eventosService } from '../services/eventosService.js';

export default function Home() {
  const [noticias, setNoticias] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [newsData, coursesData, eventsData] = await Promise.all([
          noticiasService.getNoticias({ soloPublicadas: true }),
          cursosService.getCursos({ soloActivos: true }),
          eventosService.getEventos({ soloPublicados: true }),
        ]);
        setNoticias(newsData.slice(0, 3));
        setCursos(coursesData.slice(0, 3));
        setEventos(eventsData.slice(0, 2));
      } catch (err) {
        console.error('Error cargando datos de inicio:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  return (
    <div className="bg-white">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-stone-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Institutional Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-700">
                <span>Asociación Civil Fundada en 1988</span>
                <span aria-hidden="true">·</span>
                <span>Resolución I.G.P.J. N° 412</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.15]" style={{ textWrap: 'balance' }}>
                Instrumentadores Quirúrgicos Profesionales de Rosario
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
                Nucleamos y representamos a los profesionales de la instrumentación quirúrgica de Rosario y su zona de influencia. Promovemos la capacitación científica continua, la seguridad del paciente en el quirófano y la jerarquización del ejercicio profesional.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/cursos">
                  <Button size="lg" icon={GraduationCap}>
                    Ver Cursos y Capacitaciones
                  </Button>
                </Link>
                <Link to="/institucional">
                  <Button variant="outline" size="lg">
                    Conocer la Asociación
                  </Button>
                </Link>
                <Link to="/contacto">
                  <Button variant="ghost" size="lg">
                    Asociarse
                  </Button>
                </Link>
              </div>

              {/* Quick Institutional Highlights */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-stone-200">
                <div>
                  <span className="block text-2xl font-bold text-stone-900 tabular-nums">
                    +35 Años
                  </span>
                  <span className="text-xs text-stone-500">De trayectoria civil</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold text-stone-900 tabular-nums">
                    100%
                  </span>
                  <span className="text-xs text-stone-500">Docencia especializada</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold text-stone-900 tabular-nums">
                    Rosario
                  </span>
                  <span className="text-xs text-stone-500">Sede Santa Fe</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Surgical Photography */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-lg bg-stone-100">
                <img
                  src="/images/hero-suite.jpg"
                  alt="Quirófano e instrumental quirúrgico estéril de precisión"
                  className="w-full h-[400px] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-300">
                    Excelencia Perioperatoria
                  </span>
                  <p className="text-sm font-medium text-stone-100 mt-1">
                    Compromiso con las normas internacionales de bioseguridad y el rigor técnico en quirófano.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ACCESOS RÁPIDOS INSTITUCIONALES */}
      <section className="py-12 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/cursos" className="group">
              <Card hoverEffect padding="p-6" className="h-full border-stone-200 group-hover:border-red-300">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 mb-1 group-hover:text-red-600 transition-colors">
                  Cursos & Talleres
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Laparoscopía, esterilización hospitalaria, traumatología y simulación clínica.
                </p>
              </Card>
            </Link>

            <Link to="/eventos" className="group">
              <Card hoverEffect padding="p-6" className="h-full border-stone-200 group-hover:border-red-300">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 mb-1 group-hover:text-red-600 transition-colors">
                  Jornadas & Congresos
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Encuentros anuales, presentación de posters científicos y asambleas ordinarias.
                </p>
              </Card>
            </Link>

            <Link to="/institucional" className="group">
              <Card hoverEffect padding="p-6" className="h-full border-stone-200 group-hover:border-red-300">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 mb-1 group-hover:text-red-600 transition-colors">
                  Marco Legal & Gremial
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Leyes de ejercicio profesional, incumbencias técnicas y colegiación provincial.
                </p>
              </Card>
            </Link>

            <Link to="/contacto" className="group">
              <Card hoverEffect padding="p-6" className="h-full border-stone-200 group-hover:border-red-300">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 mb-1 group-hover:text-red-600 transition-colors">
                  Afiliación Societaria
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Sumate a la Asociación Rosarina y disfrutá de beneficios y aranceles bonificados.
                </p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. ÚLTIMAS NOTICIAS PUBLICADAS */}
      <section className="py-16 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                Actualidad Quirúrgica
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                Últimas Noticias y Comunicados
              </h2>
            </div>
            <Link
              to="/noticias"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              <span>Ver todas las noticias</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {noticias.map((item) => (
              <article key={item.id} className="flex flex-col h-full bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-stone-300 transition-all">
                <div className="aspect-[16/10] bg-stone-100 overflow-hidden relative">
                  <img
                    src={item.imagen_url || '/images/hero-suite.jpg'}
                    alt={item.titulo}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Unboxed clean metadata following zero-pill discipline */}
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                      <span className="font-medium text-red-700">
                        {item.categorias?.nombre || 'Institucional'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={item.fecha_publicacion}>
                        {new Date(item.fecha_publicacion).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </time>
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 hover:text-red-600 transition-colors leading-snug mb-2">
                      <Link to={`/noticias/${item.slug}`}>{item.titulo}</Link>
                    </h3>

                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">
                      {item.resumen}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-400">Por {item.autor}</span>
                    <Link
                      to={`/noticias/${item.slug}`}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                    >
                      <span>Leer nota</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PRÓXIMOS CURSOS Y CAPACITACIONES */}
      <section className="py-16 bg-stone-50/70 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                Formación Continua
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                Capacitaciones Destacadas
              </h2>
            </div>
            <Link
              to="/cursos"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              <span>Ver oferta académica completa</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cursos.map((curso) => (
              <div
                key={curso.id}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col justify-between hover:border-stone-300 transition-all shadow-xs"
              >
                <div>
                  <div className="aspect-[16/10] bg-stone-100 relative overflow-hidden">
                    <img
                      src={curso.imagen_url || '/images/curso-laparoscopia.jpg'}
                      alt={curso.nombre}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-md capitalize">
                      Modalidad {curso.modalidad}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                      <span>Inicio: {new Date(curso.fecha_inicio).toLocaleDateString('es-AR')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{curso.duracion_horas} Horas Cátedra</span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 mb-2 leading-snug">
                      {curso.nombre}
                    </h3>

                    <p className="text-xs text-stone-600 line-clamp-3 mb-4 leading-relaxed">
                      {curso.descripcion}
                    </p>

                    <div className="space-y-1.5 text-xs text-stone-500 pt-3 border-t border-stone-100">
                      <p><strong className="text-stone-700">Horario:</strong> {curso.horario}</p>
                      <p><strong className="text-stone-700">Lugar:</strong> {curso.lugar}</p>
                      <p className="text-red-600 font-medium">
                        Cupos disponibles: <span className="tabular-nums font-bold">{curso.cupos_disponibles}</span> de {curso.cupos}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link to={`/cursos?inscribir=${curso.id}`} className="block">
                    <Button variant="primary" className="w-full">
                      Inscribirse al Curso
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SECCIÓN INSTITUCIONAL & AGENDA */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Institutional manifesto */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                Identidad y Propósito
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                Más de tres décadas construyendo la jerarquía de la Instrumentación Quirúrgica en Rosario
              </h2>
              <div className="prose prose-stone text-sm text-stone-600 space-y-4 leading-relaxed">
                <p>
                  Constituida jurídicamente bajo la denominación de <em>Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil</em>, nuestra entidad vela por el reconocimiento social, académico y laboral de quienes integramos el equipo quirúrgico.
                </p>
                <p>
                  El quirófano es un entorno de máxima exigencia. Por ello, sostenemos convenios formativos con centros hospitalarios de primer nivel, facilitamos becas de capacitación para socios y brindamos asesoramiento permanente en cuestiones de ejercicio y matriculación.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                      Comité Científico Activo
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Actualización permanente en bioseguridad, robotización y esterilización.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                      Representación Institucional
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Defensa gremial y articulación con colegios profesionales de la salud.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Eventos Próximos */}
            <div className="lg:col-span-5 bg-stone-50 border border-stone-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <h3 className="font-bold text-base text-stone-900">Agenda Institucional</h3>
                </div>
                <Link to="/eventos" className="text-xs font-semibold text-red-600 hover:text-red-700">
                  Ver agenda &rarr;
                </Link>
              </div>

              <div className="space-y-4">
                {eventos.map((ev) => (
                  <div key={ev.id} className="bg-white border border-stone-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1">
                      <span className="font-semibold uppercase tracking-wider text-red-600">
                        {ev.tipo}
                      </span>
                      <span aria-hidden="true">·</span>
                      <time>{new Date(ev.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 mb-1 leading-snug">
                      {ev.titulo}
                    </h4>
                    <p className="text-xs text-stone-500 mb-2">
                      {ev.lugar} · {ev.horario}
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-2">
                      {ev.descripcion}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200">
                <Link to="/contacto">
                  <Button variant="outline" size="sm" className="w-full">
                    Consultar por Inscripción a Eventos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
