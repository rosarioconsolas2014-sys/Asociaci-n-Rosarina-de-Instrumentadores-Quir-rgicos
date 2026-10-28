# ARIQ — Asociación Rosarina de Instrumentadores Quirúrgicos
### *Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil*
**Personería Jurídica: Resolución I.G.P.J. N° 412/1988 — Rosario, Santa Fe, Argentina**

---

## 1. DESCRIPCIÓN DEL PROYECTO

Plataforma web institucional y sistema de administración integral para la **Asociación Rosarina de Instrumentadores Quirúrgicos (ARIQ)**, desarrollada con **React, JavaScript y JSX**, sin TypeScript, bajo un diseño responsive moderno, accesible y profesional adaptado a la identidad de la salud y la cirugía.

La aplicación consta de:
1. **Portal Público Institucional**:
   - Inicio (`/`): Presentación institucional, accesos rápidos, últimas noticias, cursos destacados y agenda.
   - Institucional (`/institucional`): Reseña histórica, personería jurídica, misión, visión, marco legal del ejercicio profesional quirúrgico y estatuto.
   - Noticias (`/noticias` y `/noticias/:slug`): Publicaciones científicas, comunicados oficiales, filtrado por categorías, buscador en tiempo real y lectura completa.
   - Cursos y Capacitaciones (`/cursos`): Catálogo de cursos, modalidades (presencial, virtual, híbrida), cupos disponibles y **formulario interactivo de inscripción oficial**.
   - Agenda de Eventos (`/eventos`): Jornadas rosarinas, congresos, talleres y asambleas con pestañas de próximos eventos y archivo histórico.
   - Contacto y Afiliaciones (`/contacto`): Formulario validado con protección anti-spam (honeypot) y límites de uso.
   - Acceso Administrativo (`/login`): Autenticación con soporte Supabase Auth y perfiles de demostración rápida por rol.

2. **Panel de Gestión Privado (`/admin`)**:
   - **Dashboard**: Métricas en tiempo real de noticias, cursos, postulaciones y consultas recibidas.
   - **Módulo de Noticias**: Creación, edición, generador automático de slug, cambio de estado (publicada/borrador) y eliminación con confirmación modal.
   - **Módulo de Cursos**: Control de cupos totales y disponibles, aranceles, modalidades y programas académicos.
   - **Módulo de Eventos**: Gestión de jornadas y congresos con fechas, horarios y sedes.
   - **Módulo de Inscripciones**: Padrón de aspirantes, aprobación/rechazo de vacantes, visualización de fichas y exportación a formato CSV.
   - **Módulo de Contacto**: Bandeja de mensajes, marcado de lectura, registro de notas administrativas y respuestas.
   - **Configuración Institucional**: Edición de datos legales, CUIT, personerías, autoridades y horarios.
   - **Consola de Seguridad y Supabase**: Visualización de scripts SQL, estado de conexión y restauración de datos.

---

## 2. TECNOLOGÍAS UTILIZADAS

- **React 19** con componentes funcionales y Hooks.
- **JavaScript y JSX puro** (sin TypeScript, cumpliendo las directivas del proyecto).
- **Vite 8** como herramienta de empaquetado y servidor de desarrollo ultra-rápido.
- **React Router 7** (`react-router-dom`) para navegación con rutas protegidas (`ProtectedRoute`).
- **Tailwind CSS 4** para diseño institucional con colores de marca ARIQ (#DC2626, blanco puro, grises neutros).
- **Lucide React** para iconografía médica y de instrumentación quirúrgica.
- **Supabase** (`@supabase/supabase-js`) para PostgreSQL, autenticación y almacenamiento con políticas RLS.

---

## 3. ESTRUCTURA DE ARCHIVOS

```text
src/
├── assets/
│   └── images/                 # Fotografías quirúrgicas de alta fidelidad
├── components/
│   ├── Button.jsx              # Botón accesible con variantes y estados de carga
│   ├── Card.jsx                # Tarjetas de elevación controlada y bordes hairline
│   ├── DataTable.jsx           # Tabla reusable con buscador, filtros y paginación
│   ├── Footer.jsx              # Pie de página institucional con datos legales
│   ├── Header.jsx              # Barra superior con contrato de 3 zonas y logotipo
│   ├── Modal.jsx               # Diálogo accesible con cierre por teclado (ESC)
│   └── ProtectedRoute.jsx      # Control de autenticación y permisos RBAC
├── layouts/
│   ├── AdminLayout.jsx         # Layout del panel privado con barra lateral y roles
│   └── PublicLayout.jsx        # Layout público con Header y Footer
├── pages/
│   ├── AdminConfiguracion.jsx  # Edición de datos institucionales
│   ├── AdminContacto.jsx       # Gestión de consultas y notas internas
│   ├── AdminCursos.jsx         # CRUD de capacitaciones y control de vacantes
│   ├── AdminEventos.jsx        # CRUD de congresos y agenda
│   ├── AdminInscripciones.jsx  # Padrón de inscriptos y exportación CSV
│   ├── AdminNoticias.jsx       # CRUD de artículos con auto-slug
│   ├── AdminSistema.jsx        # Monitor de Supabase y scripts SQL
│   ├── Contacto.jsx            # Formulario de contacto con anti-spam
│   ├── Cursos.jsx              # Catálogo público y modal de inscripción
│   ├── Dashboard.jsx           # Métricas operativas y accesos rápidos
│   ├── Eventos.jsx             # Agenda de congresos y jornadas
│   ├── Home.jsx                # Inicio institucional
│   ├── Institucional.jsx       # Reseña histórica y marco profesional
│   ├── Login.jsx               # Acceso privado con selector de roles demo
│   ├── NoticiaDetalle.jsx      # Lectura de artículo completo
│   └── Noticias.jsx            # Listado de noticias y buscador
├── services/
│   ├── authService.js          # Autenticación y permisos por rol
│   ├── configuracionService.js # Lectura/escritura de configuración
│   ├── contactoService.js      # Envío y gestión de consultas
│   ├── cursosService.js        # Gestión de cursos
│   ├── eventosService.js       # Gestión de eventos
│   ├── inscripcionesService.js # Registro y estado de inscripciones
│   ├── mockData.js             # Semilla inicial sincronizada con seed.sql
│   ├── noticiasService.js      # Gestión de noticias y slugify
│   └── supabase.js             # Cliente Supabase y fallback reactivo
├── styles/
│   ├── components.css          # Clases utilitarias de componentes
│   └── global.css              # Variables de color y tipografía
├── App.jsx                     # Enrutamiento general y jerarquía de vistas
├── index.css                   # Import de Tailwind y estilos globales
└── main.jsx                    # Punto de entrada de la aplicación
```

---

## 4. INSTRUCCIONES DE INSTALACIÓN Y DESARROLLO

### Requisitos Previos
- Node.js versión 18 o superior.
- Gestor de paquetes `npm`.

### Comandos de Ejecución

1. **Instalar Dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar Servidor de Desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000`.

3. **Compilar para Producción**:
   ```bash
   npm run build
   ```
   Genera el bundle optimizado en la carpeta `dist/`.

4. **Verificar Compilación y Linter**:
   ```bash
   npm run lint
   ```

---

## 5. CONFIGURACIÓN DE SUPABASE

### Paso 1: Crear Proyecto en Supabase
1. Ingresá a [supabase.com](https://supabase.com) y creá un nuevo proyecto.
2. Copiá la **Project URL** y la **anon public API Key** desde *Project Settings &rarr; API*.

### Paso 2: Configurar Variables de Entorno
Creá o editá el archivo `.env` en la raíz del proyecto tomando como base `.env.example`:

```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-clave-anon-publica-aqui"
```

*Nota: La aplicación cuenta con un motor de persistencia local reactivo que permite probar el 100% de las funciones incluso antes de configurar las credenciales de Supabase.*

### Paso 3: Ejecutar el Esquema de Base de Datos
1. En el panel de Supabase, abrí el **SQL Editor**.
2. Copiá el contenido del archivo `supabase/schema.sql` y hacé clic en **Run**.
   Esto creará:
   - Tablas: `profiles`, `roles`, `categorias`, `noticias`, `cursos`, `eventos`, `inscripciones`, `contactos`, `configuracion`.
   - Índices de rendimiento.
   - Triggers automáticos para `updated_at` y para vincular nuevos usuarios de `auth.users` con `profiles`.
   - Políticas RLS completas de seguridad.

### Paso 4: Cargar Datos de Demostración
En el **SQL Editor**, ejecutá el contenido del archivo `supabase/seed.sql` para poblar la base de datos con las categorías oficiales de ARIQ, noticias científicas, cursos de laparoscopía y esterilización, eventos y configuración institucional.

---

## 6. CREACIÓN SEGURA DEL PRIMER ADMINISTRADOR

Por razones de seguridad, ningún usuario puede autoasignarse privilegios de administrador desde el cliente web.

1. Creá la cuenta de usuario en **Supabase Dashboard &rarr; Authentication &rarr; Users &rarr; Add User**:
   - Email: `admin@ariq.org.ar` (o el correo oficial correspondiente).
   - Password: Tu contraseña segura.
   - Confirmar correo electrónico: activado.

2. En el **SQL Editor** de Supabase, ejecutá la siguiente consulta para promover al usuario a Administrador:

```sql
UPDATE public.profiles
SET role = 'admin', activo = true
WHERE email = 'admin@ariq.org.ar';
```

---

## 7. ROLES Y MATRIZ DE PERMISOS

| Módulo | Administrador (`admin`) | Editor (`editor`) | Operador (`operador`) |
| :--- | :---: | :---: | :---: |
| **Dashboard y Estadísticas** | ✅ Acceso Total | ✅ Acceso Total | ✅ Acceso Total |
| **Noticias y Artículos** | ✅ CRUD Completo | ✅ CRUD Completo | ❌ Solo lectura pública |
| **Cursos y Capacitaciones** | ✅ CRUD Completo | ✅ CRUD Completo | ❌ Solo lectura pública |
| **Agenda de Eventos** | ✅ CRUD Completo | ✅ CRUD Completo | ❌ Solo lectura pública |
| **Padrón de Inscripciones** | ✅ Gestionar / Exportar | ✅ Gestionar / Exportar | ✅ Gestionar / Exportar |
| **Consultas de Contacto** | ✅ Leer / Responder | ✅ Leer / Responder | ✅ Leer / Responder |
| **Configuración Institucional** | ✅ Modificar Datos | ❌ Denegado | ❌ Denegado |
| **Seguridad y Base de Datos** | ✅ Acceso y Scripts | ❌ Denegado | ❌ Denegado |
