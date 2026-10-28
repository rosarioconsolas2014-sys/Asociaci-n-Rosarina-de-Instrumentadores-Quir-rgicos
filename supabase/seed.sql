-- ==============================================================================
-- ARIQ: Asociación Rosarina de Instrumentadores Quirúrgicos
-- Datos de Inicialización y Demostración
-- Archivo: supabase/seed.sql
-- ==============================================================================

-- 1. Insertar Roles del Sistema
INSERT INTO public.roles (id, nombre, descripcion) VALUES
('admin', 'Administrador', 'Control total de la plataforma, usuarios, configuraciones y módulos'),
('editor', 'Editor de Contenidos', 'Gestión integral de noticias, notas editoriales, cursos y eventos'),
('operador', 'Operador de Gestión', 'Gestión y seguimiento de inscripciones y consultas de contacto')
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar Categorías
INSERT INTO public.categorias (id, nombre, slug, descripcion, color, orden) VALUES
('11111111-1111-1111-1111-111111111101', 'Capacitación Continua', 'capacitacion-continua', 'Cursos, actualizaciones científicas y técnicas quirúrgicas', '#dc2626', 1),
('11111111-1111-1111-1111-111111111102', 'Marco Profesional y Legal', 'marco-profesional-y-legal', 'Regulaciones, leyes de ejercicio profesional, incumbencias y matrículas', '#b91c1c', 2),
('11111111-1111-1111-1111-111111111103', 'Institucional', 'institucional', 'Comunicados oficiales de la Asociación, asambleas y convenios', '#4b5563', 3),
('11111111-1111-1111-1111-111111111104', 'Bioseguridad y Quirófano', 'bioseguridad-y-quirofano', 'Esterilización, protocolos de control de infecciones y seguridad del paciente', '#0284c7', 4)
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Noticias
INSERT INTO public.noticias (id, titulo, slug, resumen, contenido, imagen_url, categoria_id, autor, estado, destacada, fecha_publicacion) VALUES
(
    '22222222-2222-2222-2222-222222222201',
    'Convocatoria abierta para las Jornadas Rosarinas de Instrumentación Quirúrgica 2026',
    'convocatoria-jornadas-rosarinas-instrumentacion-quirurgica-2026',
    'Se encuentra abierto el llamado para la presentación de trabajos científicos y ponencias orientadas a las nuevas tecnologías en cirugía asistida y laparoscopía avanzada.',
    '<p>La <strong>Asociación Rosarina de Instrumentadores Quirúrgicos (ARIQ)</strong> anuncia con entusiasmo la apertura del período de inscripción y presentación de resúmenes de trabajos para las tradicionales <em>Jornadas Rosarinas de Instrumentación Quirúrgica 2026</em>.</p><p>Este encuentro congrega anualmente a profesionales, docentes y estudiantes de toda la región centro del país para debatir sobre los estándares de calidad en el quirófano contemporáneo, el rol del instrumentador en procedimientos mínimamente invasivos y las pautas actualizadas de bioseguridad.</p><h3>Ejes Temáticos Principales:</h3><ul><li>Instrumentación en procedimientos robóticos y videoendoscópicos.</li><li>Manejo y trazabilidad de cajas quirúrgicas complejas.</li><li>Seguridad del paciente quirúrgico y lista de verificación (Checklist OMS).</li><li>Aspectos ético-legales del ejercicio profesional.</li></ul><p>Los interesados en postular trabajos libres pueden enviar sus propuestas a través de los canales de la Asociación hasta el 30 de abril.</p>',
    '/images/evento-congreso.jpg',
    '11111111-1111-1111-1111-111111111101',
    'Comisión Directiva ARIQ',
    'publicada',
    true,
    '2026-03-15'
),
(
    '22222222-2222-2222-2222-222222222202',
    'Actualización sobre la Ley de Ejercicio Profesional de la Instrumentación Quirúrgica',
    'actualizacion-ley-ejercicio-profesional-instrumentacion-quirurgica',
    'Informe institucional sobre el estado de las gestiones gremiales y legislativas en la provincia de Santa Fe en defensa de la profesión y la jerarquización del rol.',
    '<p>Desde la Comisión Directiva de la Asociación informamos a todos los colegas sobre los avances sostenidos en las mesas de trabajo legislativas vinculadas con la jerarquización de nuestra carrera profesional.</p><p>La instrumentación quirúrgica es un pilar fundamental en la calidad asistencial perioperatoria. Velar por la delimitación de nuestras incumbencias profesionales y promover la colegiación obligatoria son pilares estatutarios de nuestra institución.</p><p>Invitamos a todos los profesionales matriculados y en formación a acercarse a la sede y participar activamente en las comisiones de trabajo permanentes.</p>',
    '/images/hero-suite.jpg',
    '11111111-1111-1111-1111-111111111102',
    'Subcomisión Asuntos Legales',
    'publicada',
    false,
    '2026-02-28'
),
(
    '22222222-2222-2222-2222-222222222203',
    'Nuevas directivas sobre trazabilidad y esterilización de instrumental hospitalario',
    'nuevas-directivas-trazabilidad-esterilizacion-instrumental',
    'Recomendaciones técnicas y pautas actualizadas para centrales de esterilización y verificación de barreras biológicas en quirófanos.',
    '<p>En consonancia con los últimos consensos internacionales, compartimos una guía de buenas prácticas respecto al reprocesamiento de dispositivos médicos e instrumental crítico en instituciones de salud.</p><p>Se destaca la obligatoriedad de controles biológicos diarios en autoclaves a vapor, el monitoreo físico-químico por lote y la digitalización de la trazabilidad desde la recepción hasta el campo estéril.</p>',
    '/images/curso-esterilizacion.jpg',
    '11111111-1111-1111-1111-111111111104',
    'Comité de Bioseguridad',
    'publicada',
    false,
    '2026-02-10'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar Cursos y Capacitaciones
INSERT INTO public.cursos (id, nombre, slug, descripcion, imagen_url, modalidad, lugar, fecha_inicio, fecha_fin, horario, duracion_horas, cupos, cupos_disponibles, requisitos, arancel, info_inscripcion, estado, destacado) VALUES
(
    '33333333-3333-3333-3333-333333333301',
    'Instrumentación Quirúrgica en Cirugía Laparoscópica y Robótica',
    'instrumentacion-cirugia-laparoscopica-y-robotica',
    'Programa teórico-práctico integral sobre montaje de torres de laparoscopía, calibración de óptica, manejo de instrumental articulado, energía monopolar/bipolar y asistencia en mesa quirúrgica avanzada.',
    '/images/curso-laparoscopia.jpg',
    'presencial',
    'Sede ARIQ & Quirófano de Simulación - Rosario',
    '2026-05-09',
    '2026-06-27',
    'Sábados de 09:00 a 13:00 hs',
    32,
    25,
    18,
    'Título de Instrumentador Quirúrgico o constancia de estudiante avanzado (último año).',
    'Socios ARIQ: Con bonificación del 40% · No socios: Consultar plan de cuotas',
    'Inscripción online mediante el formulario oficial. Vacantes limitadas asignadas por orden de inscripción.',
    'activo',
    true
),
(
    '33333333-3333-3333-3333-333333333302',
    'Gestión de Centrales de Esterilización y Control de Infecciones Quirúrgicas',
    'gestion-centrales-esterilizacion-control-infecciones',
    'Capacitación especializada sobre normativas IRAM, validación de ciclos de calor húmedo/seco, plasma de peróxido de hidrógeno, empaque y empaquetado hermético, indicadores y trazabilidad digital.',
    '/images/curso-esterilizacion.jpg',
    'hibrida',
    'Campus Virtual ARIQ con 2 jornadas prácticas en Rosario',
    '2026-06-06',
    '2026-07-18',
    'Jueves de 19:00 a 21:30 hs (Virtual) + Sábados Prácticos',
    40,
    35,
    26,
    'Profesionales y técnicos del área quirúrgica y de esterilización.',
    'Socios ARIQ: Arancel preferencial · No socios: Arancel estándar',
    'Requiere completar formulario y adjuntar comprobante de matrícula o estudio.',
    'activo',
    true
),
(
    '33333333-3333-3333-3333-333333333303',
    'Actualización en Ortopedia y Traumatología: Osteosíntesis y Artroplastias',
    'actualizacion-ortopedia-traumatologia-osteosintesis',
    'Revisión profunda de implantes, cajas de instrumental anatómico, prótesis de cadera y rodilla, técnica estéril y manejo de riesgos en quirófano traumatológico.',
    '/images/hero-suite.jpg',
    'presencial',
    'Auditorio Hospitalario Conveniado - Rosario',
    '2026-08-08',
    '2026-09-12',
    'Sábados de 09:00 a 14:00 hs',
    30,
    20,
    20,
    'Instrumentadores Quirúrgicos graduados con matrícula vigente.',
    'Consulte valores promocionales por inscripción temprana',
    'Inscripciones abiertas a partir del 1 de junio.',
    'proximamente',
    false
)
ON CONFLICT (id) DO NOTHING;

-- 5. Insertar Eventos
INSERT INTO public.eventos (id, titulo, slug, descripcion, imagen_url, tipo, fecha, horario, lugar, direccion, ciudad, estado, enlace_externo) VALUES
(
    '44444444-4444-4444-4444-444444444401',
    'XVII Jornadas Rosarinas de Instrumentación Quirúrgica',
    'xvii-jornadas-rosarinas-instrumentacion-quirurgica',
    'El encuentro académico más relevante de la región para la instrumentación quirúrgica, con paneles de expertos, mesas redondas, simulación en vivo y presentación de investigaciones científicas.',
    '/images/evento-congreso.jpg',
    'congreso',
    '2026-09-25',
    '08:30 a 18:30 hs',
    'Centro de Convenciones Metropolitano Rosario',
    'Av. Central Argentino 6102',
    'Rosario, Santa Fe',
    'publicado',
    '#'
),
(
    '44444444-4444-4444-4444-444444444402',
    'Asamblea General Ordinaria de Socios ARIQ',
    'asamblea-general-ordinaria-socios-ariq-2026',
    'Tratamiento de Memoria y Balance general correspondiente al ejercicio anterior, informe de la Comisión Revisora de Cuentas y renovación parcial de autoridades según estatuto.',
    '/images/hero-suite.jpg',
    'asamblea',
    '2026-04-18',
    '10:00 hs (Primer llamado)',
    'Sede Social ARIQ',
    'Rosario, Santa Fe',
    'Rosario, Santa Fe',
    'publicado',
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insertar Inscripciones de Demostración
INSERT INTO public.inscripciones (id, curso_id, nombre_completo, email, telefono, matricula_o_dni, institucion_laboral, es_socio_ariq, comentarios, estado) VALUES
(
    '55555555-5555-5555-5555-555555555501',
    '33333333-3333-3333-3333-333333333301',
    'Lic. Mariana Falcone',
    'mariana.falcone@demo-hospital.org.ar',
    '+54 341 456-7890',
    'Mat. Santa Fe 3412',
    'Hospital Provincial del Centenario',
    true,
    'Interés en técnicas de sutura laparoscópica.',
    'confirmada'
),
(
    '55555555-5555-5555-5555-555555555502',
    '33333333-3333-3333-3333-333333333301',
    'Tec. Ignacio Benítez',
    'ignacio.benitez@demo-salud.com.ar',
    '+54 341 512-3456',
    'DNI 38.124.567',
    'Sanatorio Parque Rosario',
    false,
    'Consulto por plan de financiación en cuotas.',
    'pendiente'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Insertar Consultas de Contacto de Demostración
INSERT INTO public.contactos (id, nombre_completo, email, telefono, motivo, mensaje, leido, respondido, notas_admin) VALUES
(
    '66666666-6666-6666-6666-666666666601',
    'Camila Rodríguez',
    'camila.rodriguez@demo-mail.com',
    '+54 341 620-1122',
    'afiliacion',
    'Buenas tardes, soy graduada de la carrera de Instrumentación Quirúrgica y deseo conocer los requisitos y el valor de la cuota societaria para afiliarme a la Asociación.',
    true,
    true,
    'Se envió instructivo de afiliación y formulario de adhesión al débito.'
),
(
    '66666666-6666-6666-6666-666666666602',
    'Dr. Martín Alvarez',
    'm.alvarez@demo-clinica.com.ar',
    '+54 341 789-4321',
    'cursos',
    'Hola, quisiéramos saber si disponen de cupos institucionales o convenios para capacitar a un equipo de 4 instrumentadoras en el curso de laparoscopía.',
    false,
    false,
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- 8. Insertar Configuración Institucional
INSERT INTO public.configuracion (key, value, descripcion) VALUES
('institucional', '{
    "nombre_oficial": "Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil",
    "sigla": "ARIQ",
    "lema": "Jerarquizando el ejercicio profesional y la seguridad del paciente quirúrgico",
    "personeria_juridica": "Resolución I.G.P.J. N° 412/1988",
    "cuit": "30-65487219-4",
    "sede": {
        "ciudad": "Rosario",
        "provincia": "Santa Fe",
        "pais": "Argentina"
    },
    "contacto": {
        "email": "contacto@ariq.org.ar",
        "email_cursos": "capacitacion@ariq.org.ar",
        "telefono": "+54 (341) 480-0000",
        "horario_atencion": "Lunes a Viernes de 14:00 a 19:00 hs"
    },
    "redes_sociales": {
        "instagram": "https://instagram.com/ariq_rosario",
        "facebook": "https://facebook.com/ariqrosario",
        "linkedin": "https://linkedin.com/company/ariq-rosario"
    }
}'::jsonb, 'Datos institucionales y de contacto de la Asociación')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
