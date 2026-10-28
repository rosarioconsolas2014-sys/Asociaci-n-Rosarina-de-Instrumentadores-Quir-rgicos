import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, ChevronRight, Inbox } from 'lucide-react';
import { noticiasService } from '../services/noticiasService.js';
import Card from '../components/Card.jsx';

export default function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, news] = await Promise.all([
          noticiasService.getCategorias(),
          noticiasService.getNoticias({ soloPublicadas: true }),
        ]);
        setCategorias(cats);
        setNoticias(news);
      } catch (err) {
        console.error('Error al cargar noticias:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredNoticias = noticias.filter((item) => {
    const matchesCat = selectedCat ? item.categoria_id === selectedCat : true;
    const matchesSearch = searchTerm
      ? item.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resumen?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-white min-h-[70vh]">
      {/* Banner */}
      <section className="bg-stone-50 border-b border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Prensa y Comunicación
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-2 tracking-tight">
              Noticias y Novedades
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-2">
              Artículos científicos, informes gremiales, convocatorias y actualizaciones de la instrumentación quirúrgica.
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="border-b border-stone-200 bg-white sticky top-20 z-30 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs (Segmented control) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCat('')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCat === ''
                  ? 'bg-red-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Todas las Categorías
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCat === cat.id
                    ? 'bg-red-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar noticias..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="border border-stone-200 rounded-xl p-4 space-y-4">
                  <div className="aspect-[16/10] bg-stone-200 rounded-lg" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredNoticias.length === 0 ? (
            <div className="py-16 text-center text-stone-500">
              <Inbox className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-700">No se encontraron noticias</h3>
              <p className="text-xs text-stone-500 mt-1">
                Pruebe ajustando el término de búsqueda o cambiando el filtro de categoría.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredNoticias.map((item) => (
                <article
                  key={item.id}
                  className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col justify-between hover:border-stone-300 transition-all hover:shadow-xs"
                >
                  <div>
                    <div className="aspect-[16/10] bg-stone-100 overflow-hidden relative">
                      <img
                        src={item.imagen_url || '/images/hero-suite.jpg'}
                        alt={item.titulo}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="p-6">
                      {/* Zero-pill metadata */}
                      <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                        <span className="font-medium text-red-700">
                          {item.categorias?.nombre || 'General'}
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

                      <h2 className="text-lg font-bold text-stone-900 leading-snug mb-2 hover:text-red-600 transition-colors">
                        <Link to={`/noticias/${item.slug}`}>{item.titulo}</Link>
                      </h2>

                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                        {item.resumen}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-stone-100 text-xs">
                    <span className="text-stone-400">Por {item.autor}</span>
                    <Link
                      to={`/noticias/${item.slug}`}
                      className="font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                    >
                      <span>Leer completo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
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
