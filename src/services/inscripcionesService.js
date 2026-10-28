import { supabase, isSupabaseConfigured, getLocalStore, setLocalStore, initLocalStore } from './supabase.js';
import { cursosService } from './cursosService.js';

initLocalStore();

export const inscripcionesService = {
  async getInscripciones({ cursoId = null, estado = '', search = '' } = {}) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('inscripciones')
        .select(`*, cursos:curso_id (nombre, fecha_inicio, cupos, cupos_disponibles)`)
        .order('created_at', { ascending: false });

      if (cursoId) {
        query = query.eq('curso_id', cursoId);
      }
      if (estado) {
        query = query.eq('estado', estado);
      }
      if (search) {
        query = query.or(`nombre_completo.ilike.%${search}%,email.ilike.%${search}%,matricula_o_dni.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    let items = getLocalStore('INSCRIPCIONES', []);
    const cursos = getLocalStore('CURSOS', []);
    const cursoMap = Object.fromEntries(cursos.map((c) => [c.id, c]));

    items = items.map((i) => ({
      ...i,
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
    matricula_o_dni,
    institucion_laboral,
    es_socio_ariq,
    comentarios,
  }) {
    if (!curso_id || !nombre_completo || !email || !matricula_o_dni) {
      throw new Error('Complete todos los campos obligatorios para registrarse.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Ingrese un correo electrónico válido.');
    }

    // Verify course exists and has spots
    const curso = await cursosService.getCursoById(curso_id);
    if (!curso) {
      throw new Error('El curso seleccionado no existe o no está disponible.');
    }

    if (curso.cupos_disponibles !== undefined && curso.cupos_disponibles <= 0) {
      throw new Error('Lo sentimos, los cupos para este curso están completos.');
    }

    const newRecord = {
      curso_id,
      nombre_completo: nombre_completo.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono?.trim() || null,
      matricula_o_dni: matricula_o_dni.trim(),
      institucion_laboral: institucion_laboral?.trim() || null,
      es_socio_ariq: Boolean(es_socio_ariq),
      comentarios: comentarios?.trim() || null,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inscripciones')
        .insert([newRecord])
        .select(`*, cursos:curso_id (nombre)`)
        .single();
      if (error) throw error;

      // Decrement available spots
      if (curso.cupos_disponibles > 0) {
        await supabase
          .from('cursos')
          .update({ cupos_disponibles: curso.cupos_disponibles - 1 })
          .eq('id', curso_id);
      }
      return data;
    }

    const items = getLocalStore('INSCRIPCIONES', []);
    const itemWithId = {
      ...newRecord,
      id: crypto.randomUUID ? crypto.randomUUID() : 'inscripcion_' + Date.now(),
      curso_nombre: curso.nombre,
      cursos: { nombre: curso.nombre },
    };
    items.unshift(itemWithId);
    setLocalStore('INSCRIPCIONES', items);

    // Update local course cupos
    const cursos = getLocalStore('CURSOS', []);
    const cIndex = cursos.findIndex((c) => c.id === curso_id);
    if (cIndex !== -1 && cursos[cIndex].cupos_disponibles > 0) {
      cursos[cIndex].cupos_disponibles -= 1;
      setLocalStore('CURSOS', cursos);
    }

    return itemWithId;
  },

  async updateEstado(id, nuevoEstado) {
    if (!['pendiente', 'confirmada', 'rechazada'].includes(nuevoEstado)) {
      throw new Error('Estado inválido.');
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', id)
        .select(`*, cursos:curso_id (nombre)`)
        .single();
      if (error) throw error;
      return data;
    }

    const items = getLocalStore('INSCRIPCIONES', []);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Inscripción no encontrada.');
    items[index] = { ...items[index], estado: nuevoEstado };
    setLocalStore('INSCRIPCIONES', items);
    return items[index];
  },

  async deleteInscripcion(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('inscripciones').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const items = getLocalStore('INSCRIPCIONES', []);
    const filtered = items.filter((i) => i.id !== id);
    setLocalStore('INSCRIPCIONES', filtered);
    return true;
  },
};
