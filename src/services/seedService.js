import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase.js';
import {
  INITIAL_CATEGORIAS,
  INITIAL_NOTICIAS,
  INITIAL_CURSOS,
  INITIAL_EVENTOS,
  INITIAL_CONFIGURACION,
} from './mockData.js';
import { logInternalActivity } from '../firebase/firestore.js';

export async function seedFirestoreIfEmpty() {
  const results = {
    settings: false,
    categoriesCount: 0,
    newsCount: 0,
    coursesCount: 0,
    eventsCount: 0,
    profilesCount: 0,
  };

  try {
    // 1. Institutional Settings
    const settingsRef = doc(db, 'institutional_settings', 'ariq_main');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        nombre_institucional: 'ARIQ',
        nombre_legal_completo: INITIAL_CONFIGURACION.nombre_oficial,
        sigla: INITIAL_CONFIGURACION.sigla,
        lema: INITIAL_CONFIGURACION.lema,
        cuit: INITIAL_CONFIGURACION.cuit,
        personeria_juridica: INITIAL_CONFIGURACION.personeria_juridica,
        resolucion_igpj: 'Resolución I.G.P.J. N° 412/1988',
        direccion: INITIAL_CONFIGURACION.sede.direccion,
        ciudad: INITIAL_CONFIGURACION.sede.ciudad,
        provincia: INITIAL_CONFIGURACION.sede.provincia,
        telefono: INITIAL_CONFIGURACION.contacto.telefono,
        email: INITIAL_CONFIGURACION.contacto.email,
        email_cursos: INITIAL_CONFIGURACION.contacto.email_cursos,
        horario_atencion: INITIAL_CONFIGURACION.contacto.horario_atencion,
        redes_sociales: INITIAL_CONFIGURACION.redes_sociales,
        mision: 'Representar gremial, legal y científicamente a los instrumentadores quirúrgicos, velando por la excelencia y la seguridad del paciente.',
        vision: 'Ser el referente indiscutido en formación continua, investigación y regulación de la disciplina quirúrgica en el centro del país.',
        valores: 'Ética profesional, rigor científico, compromiso deontológico, trabajo interdisciplinario y solidaridad gremial.',
        logotipo_base64: '',
        updated_at: new Date().toISOString(),
      });
      results.settings = true;
    }

    // 2. Categories
    for (const cat of INITIAL_CATEGORIAS) {
      const catRef = doc(db, 'news_categories', cat.id);
      const snap = await getDoc(catRef);
      if (!snap.exists()) {
        await setDoc(catRef, cat);
        results.categoriesCount++;
      }
    }

    // 3. News
    for (const item of INITIAL_NOTICIAS) {
      const newsRef = doc(db, 'news', item.id);
      const snap = await getDoc(newsRef);
      if (!snap.exists()) {
        await setDoc(newsRef, {
          ...item,
          categoria_nombre: INITIAL_CATEGORIAS.find((c) => c.id === item.categoria_id)?.nombre || 'General',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        results.newsCount++;
      }
    }

    // 4. Courses
    for (const curso of INITIAL_CURSOS) {
      const courseRef = doc(db, 'courses', curso.id);
      const snap = await getDoc(courseRef);
      if (!snap.exists()) {
        await setDoc(courseRef, {
          ...curso,
          cupo_total: curso.cupos,
          vacantes_disponibles: curso.cupos_disponibles,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        results.coursesCount++;
      }
    }

    // 5. Events
    for (const ev of INITIAL_EVENTOS) {
      const evRef = doc(db, 'events', ev.id);
      const snap = await getDoc(evRef);
      if (!snap.exists()) {
        await setDoc(evRef, {
          ...ev,
          clasificacion: ev.fecha >= new Date().toISOString().split('T')[0] ? 'proximo' : 'historico',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        results.eventsCount++;
      }
    }

    // 6. Bootstrap Administrator Profile
    const adminUids = ['usr_admin_001', 'admin_bootstrap'];
    for (const id of adminUids) {
      const profRef = doc(db, 'profiles', id);
      const snap = await getDoc(profRef);
      if (!snap.exists()) {
        await setDoc(profRef, {
          uid: id,
          email: 'admin@ariq.org.ar',
          full_name: 'Lic. Claudia S. Morales',
          role: 'admin',
          cargo: 'Presidente - Comisión Directiva',
          activo: true,
          created_at: new Date().toISOString(),
        });
        results.profilesCount++;
      }
    }

    await logInternalActivity('SEED_FIRESTORE', 'system', 'ariq_main', 'Inicialización de datos en Firestore');
    return { ok: true, results };
  } catch (err) {
    console.error('Error al inicializar Firestore:', err);
    return { ok: false, error: err.message };
  }
}
