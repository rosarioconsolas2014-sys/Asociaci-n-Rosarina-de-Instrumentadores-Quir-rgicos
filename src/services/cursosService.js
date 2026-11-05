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
import { slugify } from './noticiasService.js';
import { getLocalStore, setLocalStore, initLocalStore } from './supabase.js';

initLocalStore();

export const cursosService = {
  async getCursos({ soloActivos = false, modalidad = '', search = '' } = {}) {
    if (isFirebaseConfigured) {
      try {
        const colRef = collection(db, 'courses');
        let q;
        if (soloActivos) {
          q = query(colRef, where('estado', 'in', ['activo', 'proximamente']), orderBy('fecha_inicio', 'asc'));
        } else {
          q = query(colRef, orderBy('fecha_inicio', 'asc'));
        }

        const snap = await getDocs(q);
        let items = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            cupos: data.cupo_total ?? data.cupos ?? 20,
            cupos_disponibles: data.vacantes_disponibles ?? data.cupos_disponibles ?? 0,
          };
        });

        if (modalidad) {
          items = items.filter((c) => c.modalidad === modalidad);
        }
        if (search) {
          const qStr = search.toLowerCase();
          items = items.filter(
            (c) =>
              c.nombre?.toLowerCase().includes(qStr) ||
              c.descripcion?.toLowerCase().includes(qStr) ||
              c.lugar?.toLowerCase().includes(qStr)
          );
        }

        if (items.length > 0) {
          return items;
        }
      } catch (err) {
        console.warn('Error al cargar cursos de Firestore, usando caché local:', err);
      }
    }

    let items = getLocalStore('CURSOS', []);

    if (soloActivos) {
      items = items.filter((c) => c.estado === 'activo' || c.estado === 'proximamente');
    }
    if (modalidad) {
      items = items.filter((c) => c.modalidad === modalidad);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.nombre?.toLowerCase().includes(q) ||
          c.descripcion?.toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
  },

  async getCursoBySlug(slug) {
    if (isFirebaseConfigured) {
      try {
        const colRef = collection(db, 'courses');
        const q = query(colRef, where('slug', '==', slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            cupos: data.cupo_total ?? data.cupos ?? 20,
            cupos_disponibles: data.vacantes_disponibles ?? data.cupos_disponibles ?? 0,
          };
        }
      } catch (err) {
        console.warn('Error al buscar curso por slug en Firestore:', err);
      }
    }
    const items = getLocalStore('CURSOS', []);
    return items.find((c) => c.slug === slug) || null;
  },

  async getCursoById(id) {
    if (isFirebaseConfigured) {
      try {
        const data = await getDocument('courses', id);
        if (data) {
          return {
            ...data,
            cupos: data.cupo_total ?? data.cupos ?? 20,
            cupos_disponibles: data.vacantes_disponibles ?? data.cupos_disponibles ?? 0,
          };
        }
      } catch (err) {
        console.warn('Error al buscar curso por ID en Firestore:', err);
      }
    }
    const items = getLocalStore('CURSOS', []);
    return items.find((c) => c.id === id) || null;
  },

  async createCurso(curso) {
    const slug = curso.slug?.trim() ? slugify(curso.slug) : slugify(curso.nombre);
    const cupoTotal = Number(curso.cupos || curso.cupo_total) || 20;
    const vacantes = Number(curso.cupos_disponibles ?? curso.vacantes_disponibles ?? cupoTotal);

    const newRecord = {
      ...curso,
      slug,
      cupos: cupoTotal,
      cupo_total: cupoTotal,
      cupos_disponibles: vacantes,
      vacantes_disponibles: vacantes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      const created = await createDocument('courses', newRecord);
      await logInternalActivity('CREATE_COURSE', 'courses', created.id, `Curso creado: ${newRecord.nombre}`);
      return created;
    }

    const items = getLocalStore('CURSOS', []);
    const itemWithId = {
      ...newRecord,
      id: crypto.randomUUID ? crypto.randomUUID() : 'curso_' + Date.now(),
    };
    items.push(itemWithId);
    setLocalStore('CURSOS', items);
    return itemWithId;
  },

  async updateCurso(id, curso) {
    const slug = curso.slug?.trim() ? slugify(curso.slug) : slugify(curso.nombre);
    const cupoTotal = Number(curso.cupos || curso.cupo_total) || 20;
    const vacantes = Number(curso.cupos_disponibles ?? curso.vacantes_disponibles ?? cupoTotal);

    const updatedData = {
      ...curso,
      slug,
      cupos: cupoTotal,
      cupo_total: cupoTotal,
      cupos_disponibles: vacantes,
      vacantes_disponibles: vacantes,
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      const updated = await updateDocument('courses', id, updatedData);
      await logInternalActivity('UPDATE_COURSE', 'courses', id, `Curso actualizado: ${curso.nombre || id}`);
      return updated;
    }

    const items = getLocalStore('CURSOS', []);
    const index = items.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Curso no encontrado');

    items[index] = { ...items[index], ...updatedData };
    setLocalStore('CURSOS', items);
    return items[index];
  },

  async deleteCurso(id) {
    if (isFirebaseConfigured) {
      await deleteDocument('courses', id);
      await logInternalActivity('DELETE_COURSE', 'courses', id, `Curso eliminado id: ${id}`);
      return true;
    }

    const items = getLocalStore('CURSOS', []);
    const filtered = items.filter((c) => c.id !== id);
    setLocalStore('CURSOS', filtered);
    return true;
  },
};
