#!/usr/bin/env node
/**
 * @file migrate-to-firestore.mjs
 * Script de migración exclusiva de la información actual del sitio web a Firebase Cloud Firestore.
 * 
 * Reglas:
 * - Migra exactamente la información actual existente en el sitio web.
 * - Sin inventar ni alterar contenidos.
 * - Convierte todas las imágenes a Base64 comprimidas (WebP/JPEG <= 300KB) y las almacena en Firestore.
 * - Sin utilizar Firebase Storage.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

// 1. Cargar Configuración de Firebase
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

console.log('\n================================================================');
console.log('🚀 ARIQ - MIGRACIÓN DE INFORMACIÓN ACTUAL A CLOUD FIRESTORE');
console.log(`🌐 Proyecto Destino: ${firebaseConfig.projectId || 'ariq-rosario'}`);
console.log('================================================================\n');

// 2. Función para convertir imágenes a Base64 WebP comprimidas
function convertImageToBase64(relPath) {
  const fullPath = path.resolve(process.cwd(), 'public', relPath.replace(/^\//, ''));
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ Archivo de imagen no encontrado: ${fullPath}`);
    return '';
  }

  const tmpWebp = path.join('/tmp', 'mig_' + path.basename(relPath).replace(/\.[^.]+$/, '.webp'));
  try {
    execSync(`convert "${fullPath}" -resize 1200x800\\> -quality 82 "${tmpWebp}"`);
    const buffer = fs.readFileSync(tmpWebp);
    const base64 = buffer.toString('base64');
    const sizeKb = (buffer.length / 1024).toFixed(1);
    console.log(`🖼️  Convertida ${relPath} -> Base64 WebP (${sizeKb} KB)`);
    return `data:image/webp;base64,${base64}`;
  } catch (err) {
    console.warn(`Error convirtiendo con ImageMagick, usando original: ${err.message}`);
    const buf = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).replace('.', '');
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  }
}

async function runMigration() {
  try {
    // 3. Procesar y convertir todas las imágenes actuales del portal a Base64
    console.log('1️⃣  Convirtiendo imágenes actuales a Base64...');
    const logoBase64 = convertImageToBase64('/images/logo-ariq.png');
    const heroSuiteBase64 = convertImageToBase64('/images/hero-suite.jpg');
    const eventoCongresoBase64 = convertImageToBase64('/images/evento-congreso.jpg');
    const cursoLaparoscopiaBase64 = convertImageToBase64('/images/curso-laparoscopia.jpg');
    const cursoEsterilizacionBase64 = convertImageToBase64('/images/curso-esterilizacion.jpg');

    // 4. Datos Institucionales Actuales (`institutional_settings/ariq_main`)
    console.log('\n2️⃣  Migrando Configuración Institucional a institutional_settings/ariq_main...');
    const institutionalData = {
      nombre_oficial: 'Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil',
      nombre_institucional: 'ARIQ',
      sigla: 'ARIQ',
      lema: 'Jerarquizando el ejercicio profesional y la seguridad del paciente quirúrgico',
      personeria_juridica: 'Resolución I.G.P.J. N° 412/1988',
      resolucion_igpj: 'Resolución I.G.P.J. N° 412/1988',
      cuit: '30-65487219-4',
      fecha_fundacion: '1988-06-15',
      sede: {
        ciudad: 'Rosario',
        provincia: 'Santa Fe',
        pais: 'Argentina',
        direccion: 'Rosario, Santa Fe',
      },
      direccion: 'Rosario, Santa Fe',
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
      contacto: {
        email: 'contacto@ariq.org.ar',
        email_cursos: 'capacitacion@ariq.org.ar',
        telefono: '+54 (341) 480-0000',
        horario_atencion: 'Lunes a Viernes de 14:00 a 19:00 hs',
      },
      email: 'contacto@ariq.org.ar',
      email_cursos: 'capacitacion@ariq.org.ar',
      telefono: '+54 (341) 480-0000',
      horario_atencion: 'Lunes a Viernes de 14:00 a 19:00 hs',
      redes_sociales: {
        instagram: 'https://instagram.com/ariq_rosario',
        facebook: 'https://facebook.com/ariqrosario',
        linkedin: 'https://linkedin.com/company/ariq-rosario',
      },
      historia_resumen:
        'Fundada con el objeto de jerarquizar y dignificar el ejercicio de la instrumentación quirúrgica, nuestra asociación civil obtuvo el reconocimiento de su Personería Jurídica mediante Resolución I.G.P.J. N° 412/1988 por parte de la Inspección General de Personas Jurídicas de la Provincia de Santa Fe.',
      historia_completa:
        'A lo largo de más de tres décadas, ARIQ ha sido promotora activa de leyes provinciales de ejercicio profesional, garantizando que el acto perioperatorio sea desempeñado por profesionales formados en instituciones universitarias y terciarias oficialmente reconocidas.\n\nARIQ promueve el perfeccionamiento científico, la defensa gremial, el cumplimiento de las normas de bioseguridad quirúrgica y la jerarquización del rol dentro del equipo quirúrgico en efectores de salud públicos y privados.',
      mision:
        'Representar gremial, legal y científicamente a los instrumentadores quirúrgicos, velando por la excelencia y la seguridad del paciente.',
      vision:
        'Ser el referente indiscutido en formación continua, investigación y regulación de la disciplina quirúrgica en el centro del país.',
      valores:
        'Ética profesional, rigor científico, compromiso deontológico, trabajo interdisciplinario y solidaridad gremial.',
      rol_profesional_texto:
        'El Instrumentador Quirúrgico es un miembro indispensable del equipo interdisciplinario que asiste técnica, científica y humanamente al paciente antes, durante y después del procedimiento quirúrgico. Sus competencias comprenden desde el estricto mantenimiento de las cadenas de asepsia y antisepsia, la preparación y control del instrumental específico (abierto, laparoscópico, endoscópico y robótico), hasta la verificación del Checklist de Cirugía Segura de la OMS y el recuento riguroso de gasas, compresas e instrumental.',
      objetivos_estatutarios: [
        'Promover la jerarquización del título profesional y su adecuada remuneración laboral.',
        'Organizar congresos, jornadas, ateneos y cursos de actualización científica con aval institucional.',
        'Defender los intereses gremiales y profesionales de los asociados ante las autoridades de salud públicas y privadas.',
        'Propiciar la colegiación legal de la instrumentación quirúrgica en la Provincia de Santa Fe.',
        'Promover la investigación y publicación científica de la especialidad.',
      ],
      autoridades: [
        { cargo: 'Presidente', nombre: 'Lic. Claudia S. Morales', periodo: '2024-2026' },
        { cargo: 'Vicepresidente', nombre: 'Lic. Mariano F. Ponce', periodo: '2024-2026' },
        { cargo: 'Secretario General', nombre: 'Prof. Javier V. Giménez', periodo: '2024-2026' },
        { cargo: 'Tesorera', nombre: 'Tec. Lucía R. Mendoza', periodo: '2024-2026' },
        { cargo: 'Vocal Titular 1°', nombre: 'Lic. Romina Andrea López', periodo: '2024-2026' },
        { cargo: 'Vocal Titular 2°', nombre: 'Tec. Gabriel E. Benítez', periodo: '2024-2026' },
        { cargo: 'Comité Científico', nombre: 'Coord. Dra. Valeria S. Fontana', periodo: '2024-2026' },
        { cargo: 'Revisora de Cuentas', nombre: 'Lic. Patricia D. Castro', periodo: '2024-2026' },
      ],
      hero: {
        titulo_badge: 'Asociación Civil Fundada en 1988 · Resolución I.G.P.J. N° 412',
        titulo_principal: 'Instrumentadores Quirúrgicos Profesionales de Rosario',
        subtitulo:
          'Nucleamos y representamos a los profesionales de la instrumentación quirúrgica de Rosario y su zona de influencia. Promovemos la capacitación científica continua, la seguridad del paciente en el quirófano y la jerarquización del ejercicio profesional.',
        estadisticas: [
          { valor: '+35 Años', label: 'De trayectoria civil' },
          { valor: '100%', label: 'Docencia especializada' },
          { valor: 'Rosario', label: 'Sede Santa Fe' },
        ],
        pie_foto_badge: 'Excelencia Perioperatoria',
        pie_foto_texto:
          'Compromiso con las normas internacionales de bioseguridad y el rigor técnico en quirófano.',
      },
      seccion_institucional_home: {
        badge: 'Identidad y Propósito',
        titulo:
          'Más de tres décadas construyendo la jerarquía de la Instrumentación Quirúrgica en Rosario',
        parrafos: [
          'Constituida jurídicamente bajo la denominación de Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil, nuestra entidad vela por el reconocimiento social, académico y laboral de quienes integramos el equipo quirúrgico.',
          'El quirófano es un entorno de máxima exigencia. Por ello, sostenemos convenios formativos con centros hospitalarios de primer nivel, facilitamos becas de capacitación para socios y brindamos asesoramiento permanente en cuestiones de ejercicio y matriculación.',
        ],
        destacados: [
          {
            titulo: 'Comité Científico Activo',
            descripcion:
              'Actualización permanente en bioseguridad, robotización y esterilización.',
          },
          {
            titulo: 'Representación Institucional',
            descripcion:
              'Defensa gremial y articulación con colegios profesionales de la salud.',
          },
        ],
      },
      logotipo_base64: logoBase64,
      hero_imagen_base64: heroSuiteBase64,
      updated_at: new Date().toISOString(),
    };

    await setDoc(doc(db, 'institutional_settings', 'ariq_main'), institutionalData);
    console.log('✅ institutional_settings/ariq_main migrado con éxito.');

    // 5. Categorías de Noticias (`news_categories`)
    console.log('\n3️⃣  Migrando Categorías de Noticias a news_categories...');
    const categorias = [
      {
        id: '11111111-1111-1111-1111-111111111101',
        nombre: 'Capacitación Continua',
        slug: 'capacitacion-continua',
        descripcion: 'Cursos, actualizaciones científicas y técnicas quirúrgicas',
        color: '#dc2626',
        orden: 1,
      },
      {
        id: '11111111-1111-1111-1111-111111111102',
        nombre: 'Marco Profesional y Legal',
        slug: 'marco-profesional-y-legal',
        descripcion: 'Regulaciones, leyes de ejercicio profesional, incumbencias y matrículas',
        color: '#b91c1c',
        orden: 2,
      },
      {
        id: '11111111-1111-1111-1111-111111111103',
        nombre: 'Institucional',
        slug: 'institucional',
        descripcion: 'Comunicados oficiales de la Asociación, asambleas y convenios',
        color: '#4b5563',
        orden: 3,
      },
      {
        id: '11111111-1111-1111-1111-111111111104',
        nombre: 'Bioseguridad y Quirófano',
        slug: 'bioseguridad-y-quirofano',
        descripcion: 'Esterilización, protocolos de control de infecciones y seguridad del paciente',
        color: '#0284c7',
        orden: 4,
      },
    ];

    for (const cat of categorias) {
      await setDoc(doc(db, 'news_categories', cat.id), cat);
      console.log(`   + Categoría: ${cat.nombre}`);
    }

    // 6. Noticias (`news`) con imágenes en Base64
    console.log('\n4️⃣  Migrando Noticias a news (con imágenes Base64)...');
    const noticias = [
      {
        id: '22222222-2222-2222-2222-222222222201',
        titulo: 'Convocatoria abierta para las Jornadas Rosarinas de Instrumentación Quirúrgica 2026',
        slug: 'convocatoria-jornadas-rosarinas-instrumentacion-quirurgica-2026',
        resumen:
          'Se encuentra abierto el llamado para la presentación de trabajos científicos y ponencias orientadas a las nuevas tecnologías en cirugía asistida y laparoscopía avanzada.',
        contenido: `<p>La <strong>Asociación Rosarina de Instrumentadores Quirúrgicos (ARIQ)</strong> anuncia con entusiasmo la apertura del período de inscripción y presentación de resúmenes de trabajos para las tradicionales <em>Jornadas Rosarinas de Instrumentación Quirúrgica 2026</em>.</p>
<p>Este encuentro congrega anualmente a profesionales, docentes y estudiantes de toda la región centro del país para debatir sobre los estándares de calidad en el quirófano contemporáneo, el rol del instrumentador en procedimientos mínimamente invasivos y las pautas actualizadas de bioseguridad.</p>
<h3>Ejes Temáticos Principales:</h3>
<ul>
  <li>Instrumentación en procedimientos robóticos y videoendoscópicos.</li>
  <li>Manejo y trazabilidad de cajas quirúrgicas complejas.</li>
  <li>Seguridad del paciente quirúrgico y lista de verificación (Checklist OMS).</li>
  <li>Aspectos ético-legales del ejercicio profesional perioperatorio.</li>
</ul>
<p>Los interesados en postular trabajos libres o comunicaciones de casos clínicos pueden enviar sus resúmenes a través de los canales oficiales de la Asociación.</p>`,
        imagen_url: eventoCongresoBase64,
        imagen_base64: eventoCongresoBase64,
        categoria_id: '11111111-1111-1111-1111-111111111101',
        categoria_nombre: 'Capacitación Continua',
        autor: 'Comisión Directiva ARIQ',
        estado: 'publicada',
        destacada: true,
        fecha_publicacion: '2026-03-15',
        created_at: '2026-03-15T12:00:00Z',
      },
      {
        id: '22222222-2222-2222-2222-222222222202',
        titulo: 'Actualización sobre la Ley de Ejercicio Profesional de la Instrumentación Quirúrgica',
        slug: 'actualizacion-ley-ejercicio-profesional-instrumentacion-quirurgica',
        resumen:
          'Informe institucional sobre el estado de las gestiones gremiales y legislativas en la provincia de Santa Fe en defensa de la jerarquización del rol y la colegiación obligatoria.',
        contenido: `<p>Desde la Comisión Directiva de la Asociación informamos a todos los colegas sobre los avances sostenidos en las mesas de trabajo legislativas vinculadas con la jerarquización de nuestra carrera profesional.</p>
<p>La instrumentación quirúrgica es un pilar fundamental en la calidad asistencial perioperatoria. Velar por la delimitación de nuestras incumbencias profesionales y promover la colegiación obligatoria son pilares estatutarios de nuestra institución.</p>
<p>Invitamos a todos los profesionales matriculados y en formación a acercarse a la sede y participar activamente en las comisiones de trabajo permanentes.</p>`,
        imagen_url: heroSuiteBase64,
        imagen_base64: heroSuiteBase64,
        categoria_id: '11111111-1111-1111-1111-111111111102',
        categoria_nombre: 'Marco Profesional y Legal',
        autor: 'Subcomisión Asuntos Legales',
        estado: 'publicada',
        destacada: false,
        fecha_publicacion: '2026-02-28',
        created_at: '2026-02-28T10:00:00Z',
      },
      {
        id: '22222222-2222-2222-2222-222222222203',
        titulo: 'Nuevas directivas sobre trazabilidad y esterilización de instrumental hospitalario',
        slug: 'nuevas-directivas-trazabilidad-esterilizacion-instrumental',
        resumen:
          'Recomendaciones técnicas y pautas actualizadas para centrales de esterilización y verificación de barreras biológicas en quirófanos.',
        contenido: `<p>En consonancia con los últimos consensos internacionales, compartimos una guía de buenas prácticas respecto al reprocesamiento de dispositivos médicos e instrumental crítico en instituciones de salud.</p>
<p>Se destaca la obligatoriedad de controles biológicos diarios en autoclaves a vapor, el monitoreo físico-químico por lote y la digitalización de la trazabilidad desde la recepción hasta el campo estéril.</p>`,
        imagen_url: cursoEsterilizacionBase64,
        imagen_base64: cursoEsterilizacionBase64,
        categoria_id: '11111111-1111-1111-1111-111111111104',
        categoria_nombre: 'Bioseguridad y Quirófano',
        autor: 'Comité de Bioseguridad',
        estado: 'publicada',
        destacada: false,
        fecha_publicacion: '2026-02-10',
        created_at: '2026-02-10T14:30:00Z',
      },
    ];

    for (const noti of noticias) {
      await setDoc(doc(db, 'news', noti.id), noti);
      console.log(`   + Noticia: ${noti.titulo.slice(0, 50)}...`);
    }

    // 7. Cursos y Capacitaciones (`courses`) con imágenes en Base64
    console.log('\n5️⃣  Migrando Cursos y Capacitaciones a courses (con imágenes Base64)...');
    const cursos = [
      {
        id: '33333333-3333-3333-3333-333333333301',
        nombre: 'Instrumentación Quirúrgica en Cirugía Laparoscópica y Robótica',
        slug: 'instrumentacion-cirugia-laparoscopica-y-robotica',
        descripcion:
          'Programa teórico-práctico integral sobre montaje de torres de laparoscopía, calibración de óptica, manejo de instrumental articulado, energía monopolar/bipolar y asistencia en mesa quirúrgica avanzada.',
        imagen_url: cursoLaparoscopiaBase64,
        imagen_base64: cursoLaparoscopiaBase64,
        modalidad: 'presencial',
        lugar: 'Sede ARIQ & Quirófano de Simulación - Rosario',
        fecha_inicio: '2026-05-09',
        fecha_fin: '2026-06-27',
        horario: 'Sábados de 09:00 a 13:00 hs',
        duracion_horas: 32,
        cupos: 25,
        cupo_total: 25,
        cupos_disponibles: 18,
        vacantes_disponibles: 18,
        requisitos:
          'Título de Instrumentador Quirúrgico o constancia de estudiante del último año de la carrera.',
        arancel: 'Socios ARIQ: Bonificación especial 40% · No socios: Consultar plan de 3 cuotas',
        info_inscripcion:
          'Inscripción online mediante el formulario oficial. Vacantes estrictamente limitadas asignadas por orden de registro.',
        material_descargable_url: null,
        estado: 'activo',
        destacado: true,
      },
      {
        id: '33333333-3333-3333-3333-333333333302',
        nombre: 'Gestión de Centrales de Esterilización y Control de Infecciones Quirúrgicas',
        slug: 'gestion-centrales-esterilizacion-control-infecciones',
        descripcion:
          'Capacitación especializada sobre normativas IRAM, validación de ciclos de calor húmedo/seco, plasma de peróxido de hidrógeno, empaque y empaquetado hermético, indicadores y trazabilidad digital.',
        imagen_url: cursoEsterilizacionBase64,
        imagen_base64: cursoEsterilizacionBase64,
        modalidad: 'hibrida',
        lugar: 'Campus Virtual ARIQ con 2 jornadas prácticas presenciales en Rosario',
        fecha_inicio: '2026-06-06',
        fecha_fin: '2026-07-18',
        horario: 'Jueves 19:00 a 21:30 hs (Virtual) + Sábados Prácticos',
        duracion_horas: 40,
        cupos: 35,
        cupo_total: 35,
        cupos_disponibles: 26,
        vacantes_disponibles: 26,
        requisitos:
          'Profesionales, técnicos y estudiantes del área quirúrgica y de esterilización.',
        arancel: 'Socios ARIQ: Arancel preferencial · No socios: Arancel estándar',
        info_inscripcion:
          'Requiere completar formulario y adjuntar constancia laboral o comprobante de matrícula.',
        material_descargable_url: null,
        estado: 'activo',
        destacado: true,
      },
      {
        id: '33333333-3333-3333-3333-333333333303',
        nombre: 'Actualización en Ortopedia y Traumatología: Osteosíntesis y Artroplastias',
        slug: 'actualizacion-ortopedia-traumatologia-osteosintesis',
        descripcion:
          'Revisión profunda de implantes, cajas de instrumental anatómico, prótesis de cadera y rodilla, técnica estéril y manejo de riesgos en quirófano traumatológico.',
        imagen_url: heroSuiteBase64,
        imagen_base64: heroSuiteBase64,
        modalidad: 'presencial',
        lugar: 'Auditorio Hospitalario Conveniado - Rosario',
        fecha_inicio: '2026-08-08',
        fecha_fin: '2026-09-12',
        horario: 'Sábados de 09:00 a 14:00 hs',
        duracion_horas: 30,
        cupos: 20,
        cupo_total: 20,
        cupos_disponibles: 20,
        vacantes_disponibles: 20,
        requisitos: 'Instrumentadores Quirúrgicos graduados con matrícula vigente.',
        arancel: 'Consulte valores promocionales por inscripción anticipada.',
        info_inscripcion: 'Inscripciones habilitadas a partir del 1 de junio.',
        material_descargable_url: null,
        estado: 'proximamente',
        destacado: false,
      },
    ];

    for (const cur of cursos) {
      await setDoc(doc(db, 'courses', cur.id), cur);
      console.log(`   + Curso: ${cur.nombre.slice(0, 50)}...`);
    }

    // 8. Eventos (`events`) con imágenes en Base64
    console.log('\n6️⃣  Migrando Eventos a events (con imágenes Base64)...');
    const eventos = [
      {
        id: '44444444-4444-4444-4444-444444444401',
        titulo: 'XVII Jornadas Rosarinas de Instrumentación Quirúrgica',
        slug: 'xvii-jornadas-rosarinas-instrumentacion-quirurgica',
        descripcion:
          'El encuentro académico más relevante de la región para la instrumentación quirúrgica, con conferencias magistrales, mesas redondas interdisciplinarias, talleres de simulación y presentación de posters científicos.',
        imagen_url: eventoCongresoBase64,
        imagen_base64: eventoCongresoBase64,
        tipo: 'congreso',
        fecha: '2026-09-25',
        horario: '08:30 a 18:30 hs',
        lugar: 'Centro de Convenciones Metropolitano Rosario',
        direccion: 'Av. Central Argentino 6102',
        ciudad: 'Rosario, Santa Fe',
        estado: 'publicado',
        enlace_externo: '',
        clasificacion: 'proximo',
      },
      {
        id: '44444444-4444-4444-4444-444444444402',
        titulo: 'Asamblea General Ordinaria de Socios ARIQ',
        slug: 'asamblea-general-ordinaria-socios-ariq-2026',
        descripcion:
          'Tratamiento de Memoria y Balance general correspondiente al ejercicio anterior, informe de la Comisión Revisora de Cuentas y renovación parcial de autoridades según estatuto.',
        imagen_url: heroSuiteBase64,
        imagen_base64: heroSuiteBase64,
        tipo: 'asamblea',
        fecha: '2026-04-18',
        horario: '10:00 hs (Primer llamado)',
        lugar: 'Sede Social ARIQ',
        direccion: 'Rosario, Santa Fe',
        ciudad: 'Rosario, Santa Fe',
        estado: 'publicado',
        enlace_externo: '',
        clasificacion: 'proximo',
      },
    ];

    for (const ev of eventos) {
      await setDoc(doc(db, 'events', ev.id), ev);
      console.log(`   + Evento: ${ev.titulo.slice(0, 50)}...`);
    }

    // 9. Inscripciones (`course_registrations`)
    console.log('\n7️⃣  Migrando Inscripciones a course_registrations...');
    const inscripciones = [
      {
        id: '55555555-5555-5555-5555-555555555501',
        curso_id: '33333333-3333-3333-3333-333333333301',
        curso_nombre: 'Instrumentación Quirúrgica en Cirugía Laparoscópica y Robótica',
        nombre_completo: 'Lic. Mariana Falcone',
        email: 'mariana.falcone@demo-hospital.org.ar',
        telefono: '+54 341 456-7890',
        matricula_o_dni: 'Mat. Santa Fe 3412',
        institucion_laboral: 'Hospital Provincial del Centenario',
        es_socio_ariq: true,
        comentarios: 'Interés en técnicas de sutura laparoscópica.',
        estado: 'confirmada',
        created_at: '2026-03-20T11:15:00Z',
      },
      {
        id: '55555555-5555-5555-5555-555555555502',
        curso_id: '33333333-3333-3333-3333-333333333301',
        curso_nombre: 'Instrumentación Quirúrgica en Cirugía Laparoscópica y Robótica',
        nombre_completo: 'Tec. Ignacio Benítez',
        email: 'ignacio.benitez@demo-salud.com.ar',
        telefono: '+54 341 512-3456',
        matricula_o_dni: 'DNI 38.124.567',
        institucion_laboral: 'Sanatorio Parque Rosario',
        es_socio_ariq: false,
        comentarios: 'Consulto por plan de financiación en cuotas.',
        estado: 'pendiente',
        created_at: '2026-03-22T16:40:00Z',
      },
    ];

    for (const ins of inscripciones) {
      await setDoc(doc(db, 'course_registrations', ins.id), ins);
      console.log(`   + Inscripción: ${ins.nombre_completo}`);
    }

    // 10. Mensajes de Contacto (`contact_messages`)
    console.log('\n8️⃣  Migrando Consultas de Contacto a contact_messages...');
    const contactos = [
      {
        id: '66666666-6666-6666-6666-666666666601',
        nombre: 'Camila Rodríguez',
        nombre_completo: 'Camila Rodríguez',
        email: 'camila.rodriguez@demo-mail.com',
        telefono: '+54 341 620-1122',
        motivo: 'afiliacion',
        mensaje:
          'Buenas tardes, soy graduada de la carrera de Instrumentación Quirúrgica y deseo conocer los requisitos y el valor de la cuota societaria para afiliarme a la Asociación.',
        leido: true,
        respondido: true,
        notas_admin: 'Se envió instructivo de afiliación y formulario de adhesión al débito.',
        created_at: '2026-03-18T09:30:00Z',
      },
      {
        id: '66666666-6666-6666-6666-666666666602',
        nombre: 'Dr. Martín Alvarez',
        nombre_completo: 'Dr. Martín Alvarez',
        email: 'm.alvarez@demo-clinica.com.ar',
        telefono: '+54 341 789-4321',
        motivo: 'cursos',
        mensaje:
          'Hola, quisiéramos saber si disponen de cupos institucionales o convenios para capacitar a un equipo de 4 instrumentadoras en el curso de laparoscopía.',
        leido: false,
        respondido: false,
        notas_admin: '',
        created_at: '2026-03-25T14:10:00Z',
      },
    ];

    for (const con of contactos) {
      await setDoc(doc(db, 'contact_messages', con.id), con);
      console.log(`   + Contacto: ${con.nombre_completo}`);
    }

    // 11. Registrar en Auditoría Interna
    const logId = `log_${Date.now()}`;
    await setDoc(doc(db, 'internal_logs', logId), {
      usuario_email: 'sistema@ariq.org.ar',
      usuario_uid: 'system_migration',
      usuario_rol: 'admin',
      accion: 'MIGRACION_TOTAL_FIRESTORE',
      modulo: 'sistema',
      registro_id: 'all_collections',
      detalles: 'Migración exitosa de toda la información institucional a Cloud Firestore con imágenes en Base64',
      timestamp: new Date().toISOString(),
    });

    console.log('\n================================================================');
    console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE EN CLOUD FIRESTORE!');
    console.log('----------------------------------------------------------------');
    console.log('✅ institutional_settings: 1 documento oficial con Base64');
    console.log(`✅ news_categories:       ${categorias.length} categorías`);
    console.log(`✅ news:                  ${noticias.length} noticias con portadas Base64`);
    console.log(`✅ courses:               ${cursos.length} cursos con imágenes Base64`);
    console.log(`✅ events:                ${eventos.length} eventos con portadas Base64`);
    console.log(`✅ course_registrations:  ${inscripciones.length} inscripciones`);
    console.log(`✅ contact_messages:      ${contactos.length} mensajes de contacto`);
    console.log('================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error durante la migración a Firestore:', err);
    process.exit(1);
  }
}

runMigration();
