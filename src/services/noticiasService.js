/**
 * @file noticiasService.js
 * Servicio de Noticias y Categorías de ARIQ conectado exclusivamente a Cloud Firestore.
 * Colecciones: `news` e `news_categories`.
 * Las imágenes se persisten y recuperan directamente en Base64.
 */

import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  logInternalActivity,
} from '../firebase/firestore.js';
import { db } from '../firebase/firebase.js';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const noticiasService = {
  /**
   * Obtiene las categorías de noticias desde Cloud Firestore
   */
  async getCategorias() {
    try {
      const cats = await listDocuments('news_categories');
      return cats.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    } catch (err) {
      console.error('Error al recuperar categorías desde Firestore:', err);
      return [];
    }
  },

  /**
   * Obtiene el listado de noticias desde Cloud Firestore
   */
  async getNoticias({ soloPublicadas = false, categoriaId = null, search = '' } = {}) {
    try {
      const colRef = collection(db, 'news');
      let q;
      if (soloPublicadas) {
        q = query(colRef, where('estado', '==', 'publicada'), orderBy('fecha_publicacion', 'desc'));
      } else {
        q = query(colRef, orderBy('fecha_publicacion', 'desc'));
      }

      const snap = await getDocs(q);
      let items = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          imagen_url: data.imagen_base64 || data.imagen_url,
          categorias: { nombre: data.categoria_nombre || 'General' },
        };
      });

      if (categoriaId) {
        items = items.filter((n) => n.categoria_id === categoriaId);
      }

      if (search) {
        const qStr = search.toLowerCase();
        items = items.filter(
          (n) =>
            n.titulo?.toLowerCase().includes(qStr) ||
            n.resumen?.toLowerCase().includes(qStr) ||
            n.slug?.toLowerCase().includes(qStr)
        );
      }

      return items;
    } catch (err) {
      console.error('Error al obtener noticias desde Firestore:', err);
      return [];
    }
  },

  /**
   * Obtiene una noticia por su slug único desde Cloud Firestore
   */
  async getNoticiaBySlug(slug) {
    try {
      const colRef = collection(db, 'news');
      const q = query(colRef, where('slug', '==', slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          imagen_url: data.imagen_base64 || data.imagen_url,
          categorias: { nombre: data.categoria_nombre || 'General' },
        };
      }
    } catch (err) {
      console.error('Error al recuperar noticia por slug desde Firestore:', err);
    }
    return null;
  },

  /**
   * Obtiene una noticia por su ID de documento desde Cloud Firestore
   */
  async getNoticiaById(id) {
    try {
      const data = await getDocument('news', id);
      if (data) {
        return {
          ...data,
          imagen_url: data.imagen_base64 || data.imagen_url,
          categorias: { nombre: data.categoria_nombre || 'General' },
        };
      }
    } catch (err) {
      console.error('Error al recuperar noticia por ID desde Firestore:', err);
    }
    return null;
  },

  /**
   * Crea una nueva noticia en Cloud Firestore con imagen en Base64
   */
  async createNoticia(noticia) {
    const slug = noticia.slug?.trim() ? slugify(noticia.slug) : slugify(noticia.titulo);
    const newRecord = {
      ...noticia,
      slug,
      imagen_url: noticia.imagen_base64 || noticia.imagen_url || '',
      imagen_base64: noticia.imagen_base64 || noticia.imagen_url || '',
      fecha_publicacion: noticia.fecha_publicacion || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = await createDocument('news', newRecord);
    await logInternalActivity(
      'CREATE_NEWS',
      'news',
      created.id,
      `Noticia creada en Firestore: ${newRecord.titulo}`
    );
    return created;
  },

  /**
   * Actualiza una noticia en Cloud Firestore
   */
  async updateNoticia(id, noticia) {
    const slug = noticia.slug?.trim() ? slugify(noticia.slug) : slugify(noticia.titulo);
    const updatedData = {
      ...noticia,
      slug,
      imagen_url: noticia.imagen_base64 || noticia.imagen_url,
      imagen_base64: noticia.imagen_base64 || noticia.imagen_url,
      updated_at: new Date().toISOString(),
    };

    const updated = await updateDocument('news', id, updatedData);
    await logInternalActivity(
      'UPDATE_NEWS',
      'news',
      id,
      `Noticia modificada en Firestore: ${noticia.titulo || id}`
    );
    return updated;
  },

  /**
   * Alterna estado entre 'publicada' y 'borrador'
   */
  async toggleEstado(id) {
    const current = await this.getNoticiaById(id);
    if (!current) throw new Error('Noticia no encontrada');
    const nuevoEstado = current.estado === 'publicada' ? 'borrador' : 'publicada';
    return this.updateNoticia(id, { estado: nuevoEstado });
  },

  /**
   * Elimina una noticia de Cloud Firestore
   */
  async deleteNoticia(id) {
    await deleteDocument('news', id);
    await logInternalActivity('DELETE_NEWS', 'news', id, `Noticia eliminada id: ${id}`);
    return true;
  },
};
