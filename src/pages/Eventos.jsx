import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Tag, ArrowRight, Search, Inbox } from 'lucide-react';
import { eventosService } from '../services/eventosService.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [activeTab, setActiveTab] = useState('proximos'); // 'proximos' | 'anteriores'
  const [selectedTipo, setSelectedTipo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEventos() {
      try {
        setLoading(true);
        const data = await eventosService.getEventos({ soloPublicados: true });
        setEventos(data);
      } catch (err) {
        console.error('Error al cargar eventos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEventos();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filteredEventos = eventos.filter((ev) => {
    const isUpcoming = ev.fecha >= today;
    const matchesTab = activeTab === 'proximos' ? isUpcoming : !isUpcoming;
    const matchesTipo = selectedTipo ? ev.tipo === selectedTipo : true;
    const matchesSearch = searchTerm
      ? ev.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.lugar?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return matchesTab && matchesTipo && matchesSearch;
  });

  return (
    <div className="bg-white min-h-[70vh]">
      {/* Banner */}
      <section className="bg-stone-50 border-b border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Agenda Científica e Institucional
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2 tracking-tight">
              Jornadas, Congresos y Encuentros
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-2">
              Espacios de encuentro, debate interdisciplinario y divulgación científica para toda la comunidad quirúrgica.
            </p>
          </div>
        </div>
      </section>

      {/* Control Bar */}
      <section className="border-b border-stone-200 bg-white sticky top-20 z-30 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs: Próximos vs Anteriores */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('proximos')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'proximos'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Próximas Actividades
            </button>
            <button
              onClick={() => setActiveTab('anteriores')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'anteriores'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Archivo de Eventos
            </button>
          </div>

          {/* Filters by Type and Search */}
          <div className="flex items-center gap-3">
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">Todos los tipos</option>
              <option value="congreso">Congresos</option>
              <option value="jornada">Jornadas</option>
              <option value="taller">Talleres</option>
              <option value="asamblea">Asambleas</option>
            </select>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por lugar o título..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2].map((n) => (
                <div key={n} className="border border-stone-200 rounded-xl p-6 h-48 bg-stone-50" />
              ))}
            </div>
          ) : filteredEventos.length === 0 ? (
            <div className="py-16 text-center text-stone-500">
              <Inbox className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-700">No hay actividades para mostrar en este segmento</h3>
              <p className="text-xs text-stone-500 mt-1">
                Revise la pestaña alternativa o consulte las convocatorias en nuestra sección de noticias.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEventos.map((ev) => (
                <article
                  key={ev.id}
                  className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-stone-300 transition-all shadow-xs flex flex-col md:flex-row"
                >
                  {/* Event Thumbnail */}
                  <div className="md:w-80 bg-stone-100 relative min-h-[200px] shrink-0">
                    <img
                      src={ev.imagen_url || '/images/evento-congreso.jpg'}
                      alt={ev.titulo}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                      {ev.tipo}
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mb-2">
                        <span className="flex items-center gap-1 font-semibold text-stone-900">
                          <Calendar className="w-3.5 h-3.5 text-red-600" />
                          <time dateTime={ev.fecha}>
                            {new Date(ev.fecha).toLocaleDateString('es-AR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </time>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{ev.horario}</span>
                        </span>
                      </div>

                      <h2 className="text-xl font-bold text-stone-900 mb-2 leading-snug">
                        {ev.titulo}
                      </h2>

                      <p className="text-xs sm:text-sm text-stone-600 mb-4 leading-relaxed">
                        {ev.descripcion}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                        <span><strong>Lugar:</strong> {ev.lugar} {ev.direccion ? `(${ev.direccion})` : ''} — {ev.ciudad}</span>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-xs text-stone-400">Organiza: Asociación Rosarina de Instrumentadores Quirúrgicos</span>
                      <Link to={`/contacto?motivo=cursos&ref=${encodeURIComponent(ev.titulo)}`}>
                        <Button variant="outline" size="sm">
                          Solicitar Información / Asistir
                        </Button>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
