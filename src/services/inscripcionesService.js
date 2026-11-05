import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  registerForCourseTransaction,
  logInternalActivity,
} from '../firebase/firestore.js';
import { isFirebaseConfigured, db } from '../firebase/firebase.js';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { cursosService } from './cursosService.js';
import { getLocalStore, setLocalStore, initLocalStore } from './supabase.js';

initLocalStore();

export const inscripcionesService = {
  async getInscripciones({ cursoId = null, estado = '', search = '' } = {}) {
    if (isFirebaseConfigured) {
      try {
        const colRef = collection(db, 'course_registrations');
        const snap = await getDocs(colRef);
        let items = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            cursos: { nombre: data.curso_nombre || 'Capacitación Quirúrgica' },
          };
        });

        if (cursoId) {
          items = items.filter((i) => i.curso_id === cursoId);
        }
        if (estado) {
          items = items.filter((i) => i.estado === estado);
        }
        if (search) {
          const q = search.toLowerCase();
          items = items.filter(
            (i) =>
              i.nombre_completo?.toLowerCase().includes(q) ||
              i.email?.toLowerCase().includes(q) ||
              i.dni?.toLowerCase().includes(q) ||
              i.matricula_o_dni?.toLowerCase().includes(q)
          );
        }

        if (items.length > 0) {
          return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
      } catch (err) {
        console.warn('Error al cargar inscripciones de Firestore, usando caché local:', err);
      }
    }

    let items = getLocalStore('INSCRIPCIONES', []);
    const cursos = getLocalStore('CURSOS', []);
    const cursoMap = Object.fromEntries(cursos.map((c) => [c.id, c]));

    items = items.map((i) => ({
      ...i,
      dni: i.dni || i.matricula_o_dni,
      cursos: cursoMap[i.curso_id] || { nombre: i.curso_nombre || 'Curso' },
    }));

    if (cursoId) {
      items = items.filter((i) => i.curso_id === cursoId);
    }
    if (estado) {
      items = items.filter((i) => i.estado === estado);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.nombre_completo?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.dni?.toLowerCase().includes(q) ||
          i.matricula_o_dni?.toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async registrarInscripcion({
    curso_id,
    nombre_completo,
    email,
    telefono,
    dni,
    matricula_o_dni,
    matricula,
    institucion_laboral,
    es_socio_ariq,
    comentarios,
  }) {
    const docIdent = (dni || matricula_o_dni || '').trim();
    if (!curso_id || !nombre_completo || !email || !docIdent) {
      throw new Error('Complete todos los campos obligatorios para registrarse.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Ingrese un correo electrónico válido.');
    }

    // Verify course exists
    const curso = await cursosService.getCursoById(curso_id);
    if (!curso) {
      throw new Error('El curso seleccionado no existe o no está disponible.');
    }

    const registrationPayload = {
      curso_id,
      curso_nombre: curso.nombre,
      nombre_completo: nombre_completo.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono?.trim() || null,
      dni: docIdent,
      matricula_o_dni: docIdent,
      matricula: (matricula || docIdent).trim(),
      institucion_laboral: institucion_laboral?.trim() || null,
      es_socio_ariq: Boolean(es_socio_ariq),
      comentarios: comentarios?.trim() || null,
    };

    // Use Firestore atomic transaction for spot reservation
    if (isFirebaseConfigured) {
      const result = await registerForCourseTransaction(registrationPayload);
      await logInternalActivity(
        'REGISTER_APPLICANT',
        'course_registrations',
        result.id,
        `Inscripción a ${curso.nombre} de ${nombre_completo}`
      );
      return result;
    }

    // Local fallback
    if (curso.cupos_disponibles !== undefined && curso.cupos_disponibles <= 0) {
      throw new Error('Lo sentimos, los cupos para este curso están completos.');
    }

    const items = getLocalStore('INSCRIPCIONES', []);
    const itemWithId = {
      ...registrationPayload,
      id: crypto.randomUUID ? crypto.randomUUID() : 'inscripcion_' + Date.now(),
      estado: 'pendiente',
      cursos: { nombre: curso.nombre },
      created_at: new Date().toISOString(),
    };
    items.unshift(itemWithId);
    setLocalStore('INSCRIPCIONES', items);

    // Update local course cupos
    const cursos = getLocalStore('CURSOS', []);
    const cIndex = cursos.findIndex((c) => c.id === curso_id);
    if (cIndex !== -1 && cursos[cIndex].cupos_disponibles > 0) {
      cursos[cIndex].cupos_disponibles -= 1;
      cursos[cIndex].vacantes_disponibles = cursos[cIndex].cupos_disponibles;
      setLocalStore('CURSOS', cursos);
    }

    return itemWithId;
  },

  async updateEstado(id, nuevoEstado, observaciones = '') {
    if (!['pendiente', 'confirmada', 'rechazada', 'cancelada'].includes(nuevoEstado)) {
      throw new Error('Estado de inscripción inválido.');
    }

    if (isFirebaseConfigured) {
      const updated = await updateDocument('course_registrations', id, {
        estado: nuevoEstado,
        observaciones_admin: observaciones || '',
      });
      await logInternalActivity(
        'UPDATE_REGISTRATION_STATUS',
        'course_registrations',
        id,
        `Estado actualizado a: ${nuevoEstado}`
      );
      return updated;
    }

    const items = getLocalStore('INSCRIPCIONES', []);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Inscripción no encontrada.');
    items[index] = {
      ...items[index],
      estado: nuevoEstado,
      observaciones_admin: observaciones || items[index].observaciones_admin,
    };
    setLocalStore('INSCRIPCIONES', items);
    return items[index];
  },

  async deleteInscripcion(id) {
    if (isFirebaseConfigured) {
      await deleteDocument('course_registrations', id);
      await logInternalActivity('DELETE_REGISTRATION', 'course_registrations', id, `Inscripción eliminada id: ${id}`);
      return true;
    }

    const items = getLocalStore('INSCRIPCIONES', []);
    const filtered = items.filter((i) => i.id !== id);
    setLocalStore('INSCRIPCIONES', filtered);
    return true;
  },
};
