import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2, Tag, ChevronRight } from 'lucide-react';
import { noticiasService } from '../services/noticiasService.js';
import Button from '../components/Button.jsx';

export default function NoticiaDetalle() {
  const { slug } = useParams();
  const [noticia, setNoticia] = useState(null);
  const [relacionadas, setRelacionadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadNoticia() {
      try {
        setLoading(true);
        const item = await noticiasService.getNoticiaBySlug(slug);
        setNoticia(item);

        if (item) {
          const all = await noticiasService.getNoticias({ soloPublicadas: true });
          const others = all.filter((n) => n.slug !== slug).slice(0, 2);
          setRelacionadas(others);
        }
      } catch (err) {
        console.error('Error al cargar noticia:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNoticia();
    window.scrollTo(0, 0);
  }, [slug]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-stone-500 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-2/3 mx-auto mb-4" />
        <div className="h-4 bg-stone-200 rounded w-1/3 mx-auto mb-8" />
        <div className="aspect-[16/9] bg-stone-200 rounded-xl mb-8" />
        <div className="h-4 bg-stone-200 rounded w-full mb-3" />
        <div className="h-4 bg-stone-200 rounded w-5/6" />
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Noticia no encontrada</h1>
        <p className="text-sm text-stone-600 mb-6">
          La publicación solicitada no existe o ha sido dada de baja.
        </p>
        <Link to="/noticias">
          <Button variant="outline" icon={ArrowLeft}>
            Volver a Noticias
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/noticias"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al listado de noticias</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? '¡Enlace copiado!' : 'Compartir'}</span>
          </button>
        </div>

        {/* Header Metadata */}
        <header className="mb-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
            <span className="text-red-700 font-semibold">
              {noticia.categorias?.nombre || 'General'}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={noticia.fecha_publicacion}>
              {new Date(noticia.fecha_publicacion).toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>

          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 leading-tight"
            style={{ textWrap: 'balance' }}
          >
            {noticia.titulo}
          </h1>

          <p className="text-base text-stone-600 leading-relaxed font-normal border-l-2 border-red-600 pl-4 py-1">
            {noticia.resumen}
          </p>

          <div className="flex items-center gap-3 pt-2 text-xs text-stone-500 border-t border-stone-100">
            <span className="font-medium text-stone-700">Autor: {noticia.autor}</span>
            <span aria-hidden="true">·</span>
            <span>Asociación Rosarina de Instrumentadores Quirúrgicos</span>
          </div>
        </header>

        {/* Featured Image */}
        {noticia.imagen_url && (
          <div className="mb-10 rounded-2xl overflow-hidden border border-stone-200 shadow-xs">
            <img
              src={noticia.imagen_url}
              alt={noticia.titulo}
              className="w-full max-h-[500px] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Rich Content */}
        <div
          className="prose prose-stone max-w-none text-stone-800 leading-relaxed text-sm sm:text-base space-y-4 [&>p]:leading-relaxed [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mt-6 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1"
          dangerouslySetInnerHTML={{ __html: noticia.contenido }}
        />

        {/* Footer of the article */}
        <div className="mt-12 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-stone-500">
            Publicación oficial de la Asociación Rosarina de Instrumentadores Quirúrgicos.
          </div>
          <Link to="/noticias">
            <Button variant="outline" size="sm" icon={ArrowLeft}>
              Ver más noticias
            </Button>
          </Link>
        </div>

        {/* Related Articles */}
        {relacionadas.length > 0 && (
          <section className="mt-16 pt-10 border-t border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-6">Otras Publicaciones Recientes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relacionadas.map((rel) => (
                <div key={rel.id} className="border border-stone-200 rounded-xl p-5 hover:border-stone-300 transition-colors">
                  <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wide block mb-1">
                    {rel.categorias?.nombre || 'Institucional'}
                  </span>
                  <h4 className="text-sm font-bold text-stone-900 mb-2 leading-snug">
                    <Link to={`/noticias/${rel.slug}`} className="hover:text-red-600 transition-colors">
                      {rel.titulo}
                    </Link>
                  </h4>
                  <p className="text-xs text-stone-500 line-clamp-2 mb-3">
                    {rel.resumen}
                  </p>
                  <Link
                    to={`/noticias/${rel.slug}`}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <span>Leer</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
