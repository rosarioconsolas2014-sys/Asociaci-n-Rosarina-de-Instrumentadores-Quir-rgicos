import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  logInternalActivity,
} from '../firebase/firestore.js';
import { isFirebaseConfigured, db } from '../firebase/firebase.js';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getLocalStore, setLocalStore, initLocalStore } from './supabase.js';

initLocalStore();

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
  async getCategorias() {
    if (isFirebaseConfigured) {
      try {
        const cats = await listDocuments('news_categories');
        if (cats.length > 0) {
          return cats.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        }
      } catch (err) {
        console.warn('Error al cargar categorías de Firestore, usando caché:', err);
      }
    }
    const categorias = getLocalStore('CATEGORIAS', []);
    return [...categorias].sort((a, b) => (a.orden || 0) - (b.orden || 0));
  },

  async getNoticias({ soloPublicadas = false, categoriaId = null, search = '' } = {}) {
    if (isFirebaseConfigured) {
      try {
        const colRef = collection(db, 'news');
        let q;
        if (soloPublicadas) {
          q = query(colRef, where('estado', '==', 'publicada'), orderBy('fecha_publicacion', 'desc'));
        } else {
          q = query(colRef, orderBy('fecha_publicacion', 'desc'));
        }

        const snap = await getDocs(q);
        let items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          // Compatibility helper for UI expectations
          categorias: { nombre: d.data().categoria_nombre || 'General' },
        }));

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

        if (items.length > 0) {
          return items;
        }
      } catch (err) {
        console.warn('Error al cargar noticias de Firestore, recurriendo a almacenamiento local:', err);
      }
    }

    // Local storage fallback for offline demo
    let items = getLocalStore('NOTICIAS', []);
    const cats = getLocalStore('CATEGORIAS', []);
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

    items = items.map((item) => ({
      ...item,
      categorias: catMap[item.categoria_id] || { nombre: 'General' },
    }));

    if (soloPublicadas) {
      items = items.filter((n) => n.estado === 'publicada');
    }
    if (categoriaId) {
      items = items.filter((n) => n.categoria_id === categoriaId);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (n) =>
          n.titulo?.toLowerCase().includes(q) ||
          n.resumen?.toLowerCase().includes(q)
      );
    }

    return items.sort(
      (a, b) =>
        new Date(b.fecha_publicacion || b.created_at) -
        new Date(a.fecha_publicacion || a.created_at)
    );
  },

  async getNoticiaBySlug(slug) {
    if (isFirebaseConfigured) {
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
            categorias: { nombre: data.categoria_nombre || 'General' },
          };
        }
      } catch (err) {
        console.warn('Error al buscar noticia por slug en Firestore:', err);
      }
    }

    const items = await this.getNoticias({ soloPublicadas: false });
    return items.find((n) => n.slug === slug) || null;
  },

  async getNoticiaById(id) {
    if (isFirebaseConfigured) {
      try {
        const data = await getDocument('news', id);
        if (data) {
          return {
            ...data,
            categorias: { nombre: data.categoria_nombre || 'General' },
          };
        }
      } catch (err) {
        console.warn('Error al obtener noticia de Firestore:', err);
      }
    }
    const items = await this.getNoticias({ soloPublicadas: false });
    return items.find((n) => n.id === id) || null;
  },

  async createNoticia(noticia) {
    const slug = noticia.slug?.trim() ? slugify(noticia.slug) : slugify(noticia.titulo);
    const newRecord = {
      ...noticia,
      slug,
      fecha_publicacion: noticia.fecha_publicacion || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      const created = await createDocument('news', newRecord);
      await logInternalActivity('CREATE_NEWS', 'news', created.id, `Noticia creada: ${newRecord.titulo}`);
      return created;
    }

    const items = getLocalStore('NOTICIAS', []);
    const itemWithId = {
      ...newRecord,
      id: crypto.randomUUID ? crypto.randomUUID() : 'noticia_' + Date.now(),
    };
    items.unshift(itemWithId);
    setLocalStore('NOTICIAS', items);
    return itemWithId;
  },

  async updateNoticia(id, noticia) {
    const slug = noticia.slug?.trim() ? slugify(noticia.slug) : slugify(noticia.titulo);
    const updatedData = {
      ...noticia,
      slug,
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      const updated = await updateDocument('news', id, updatedData);
      await logInternalActivity('UPDATE_NEWS', 'news', id, `Noticia modificada: ${noticia.titulo || id}`);
      return updated;
    }

    const items = getLocalStore('NOTICIAS', []);
    const index = items.findIndex((n) => n.id === id);
    if (index === -1) throw new Error('Noticia no encontrada');

    items[index] = { ...items[index], ...updatedData };
    setLocalStore('NOTICIAS', items);
    return items[index];
  },

  async toggleEstado(id) {
    const current = await this.getNoticiaById(id);
    if (!current) throw new Error('Noticia no encontrada');
    const nuevoEstado = current.estado === 'publicada' ? 'borrador' : 'publicada';
    return this.updateNoticia(id, { estado: nuevoEstado });
  },

  async deleteNoticia(id) {
    if (isFirebaseConfigured) {
      await deleteDocument('news', id);
      await logInternalActivity('DELETE_NEWS', 'news', id, `Noticia eliminada id: ${id}`);
      return true;
    }

    const items = getLocalStore('NOTICIAS', []);
    const filtered = items.filter((n) => n.id !== id);
    setLocalStore('NOTICIAS', filtered);
    return true;
  },
};
