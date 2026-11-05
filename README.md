# ARIQ — Asociación Rosarina de Instrumentadores Quirúrgicos
### *Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil*
**Personería Jurídica: Resolución I.G.P.J. N° 412/1988 — Rosario, Santa Fe, Argentina**

---

## 1. DESCRIPCIÓN DEL PROYECTO

Plataforma web institucional y sistema de administración integral para la **Asociación Rosarina de Instrumentadores Quirúrgicos (ARIQ)**, desarrollada con **React, JavaScript y JSX**, sin TypeScript, bajo un diseño responsive moderno, accesible y profesional adaptado a la identidad de la salud y la cirugía.

La infraestructura central de datos, autenticación y archivos se encuentra respaldada por **Firebase (Google Cloud Platform)**:
- **Cloud Firestore**: Base de datos NoSQL de alta escalabilidad con 9 colecciones estructuradas.
- **Firebase Authentication**: Autenticación para Administradores, Editores y Operadores con inicio de sesión por Google y credenciales de correo/contraseña.
- **Firebase Storage**: Almacenamiento seguro de fotografías quirúrgicas, portadas de cursos, imágenes de noticias y documentación oficial.
- **Firebase Hosting**: Preparado para despliegue en producción con reglas de reescritura SPA.

---

## 2. SERVICIOS FIREBASE IMPLEMENTADOS

| Servicio | Propósito en ARIQ | Archivo de Configuración |
| :--- | :--- | :--- |
| **Cloud Firestore** | Almacenamiento de configuraciones, noticias, cursos, eventos, inscripciones y auditoría | `src/firebase/firestore.js` & `firestore.rules` |
| **Firebase Auth** | Control de acceso seguro por roles (`admin`, `editor`, `operador`) con Google y Email | `src/firebase/auth.js` |
| **Firebase Storage** | Subida y validación de archivos e imágenes organizados en carpetas | `src/firebase/storage.js` & `storage.rules` |
| **Firebase Hosting** | Servir el sitio estático optimizado con soporte para rutas de React Router | `firebase.json` |

---

## 3. ESTRUCTURA DE COLECCIONES EN FIRESTORE

1. `institutional_settings`: Datos legales oficiales, CUIT, personerías, autoridades, misión, visión y canales de atención.
2. `news`: Publicaciones institucionales, notas científicas, slug único, estado (`publicada`/`borrador`), copete y autor.
3. `news_categories`: Categorías temáticas (Capacitación Continua, Marco Profesional, Bioseguridad, Institucional).
4. `courses`: Programas de formación quirúrgica, cupo total, vacantes disponibles sincronizadas, aranceles y modalidades.
5. `course_registrations`: Inscripciones oficiales con DNI, matrícula, institución laboral y estados (`pendiente`, `confirmada`, `rechazada`, `cancelada`). Protegidas contra lectura pública no autorizada.
6. `events`: Congresos, jornadas rosarinas y asambleas con fechas, horarios, ubicaciones y enlaces.
7. `contact_messages`: Mensajes recibidos a través del formulario con notas internas de secretaría.
8. `profiles`: Perfiles de usuario vinculados al UID de Firebase Auth con control de roles inmutable desde el cliente.
9. `internal_logs`: Registro inmutable de auditoría para cada operación de creación, actualización o baja administrativa.

---

## 4. INSTRUCCIONES DE INSTALACIÓN Y DESARROLLO

### Requisitos
- Node.js 18+ y npm.

### Comandos

1. **Instalar Dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar Entorno Local**:
   ```bash
   npm run dev
   ```
   Disponible en `http://localhost:3000`.

3. **Compilar para Producción**:
   ```bash
   npm run build
   ```

4. **Verificar Código y Linter**:
   ```bash
   npm run lint
   ```

---

## 5. CONFIGURACIÓN Y DESPLIEGUE EN FIREBASE

### Paso 1: Configurar Variables de Entorno
La aplicación carga la configuración directamente desde `firebase-applet-config.json` o desde variables de entorno en `.env`:

```env
VITE_FIREBASE_PROJECT_ID="curious-bazaar-q0z9n"
VITE_FIREBASE_APP_ID="1:980616264682:web:9aa193b9d611dd72fcd093"
VITE_FIREBASE_API_KEY="AIzaSyBcuX4ybg4yyBdGQxotHStNDuGebMD2KeU"
VITE_FIREBASE_AUTH_DOMAIN="curious-bazaar-q0z9n.firebaseapp.com"
VITE_FIREBASE_DATABASE_ID="ai-studio-ariqasociacinros-ea70044b-60b7-45ad-9890-b5aea91d134a"
VITE_FIREBASE_STORAGE_BUCKET="curious-bazaar-q0z9n.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="980616264682"
```

### Paso 2: Desplegar Reglas de Seguridad
Las reglas de seguridad se encuentran auditadas en `firestore.rules` y `storage.rules`.
Para publicarlas con Firebase CLI:

```bash
firebase deploy --only firestore:rules,storage
```

### Paso 3: Inicializar Colecciones y Datos de ARIQ
Desde el panel administrativo en `/admin/sistema`, hacer clic en **"Cargar Datos Iniciales a Firestore"**.
El sistema creará las categorías, los cursos de laparoscopía y esterilización, las jornadas rosarinas y la configuración estatutaria de ARIQ sin sobrescribir información existente.

### Paso 4: Creación Segura del Primer Administrador
1. Crear el usuario en **Firebase Console &rarr; Authentication &rarr; Users &rarr; Add User** con el email deseado (ej. `admin@ariq.org.ar`).
2. En Cloud Firestore, crear o editar el documento `/profiles/{UID}` con:
   ```json
   {
     "uid": "<UID_DEL_USUARIO>",
     "email": "admin@ariq.org.ar",
     "full_name": "Administrador Principal ARIQ",
     "role": "admin",
     "activo": true,
     "created_at": "2026-11-05T00:00:00.000Z"
   }
   ```
*(Nota: El usuario con correo `rosarioconsolas2014@gmail.com` cuenta con elevación directa de administrador concedida por las reglas de Firestore).*

---

## 6. ROLES Y MATRIZ DE PERMISOS (RBAC)

| Módulo | Administrador (`admin`) | Editor (`editor`) | Operador (`operador`) |
| :--- | :---: | :---: | :---: |
| **Dashboard y Estadísticas** | ✅ Acceso Total | ✅ Acceso Total | ✅ Acceso Total |
| **Noticias y Artículos** | ✅ CRUD Completo + Storage | ✅ CRUD Completo + Storage | ❌ Solo lectura |
| **Cursos y Capacitaciones** | ✅ CRUD Completo + Storage | ✅ CRUD Completo + Storage | ❌ Solo lectura |
| **Agenda de Eventos** | ✅ CRUD Completo + Storage | ✅ CRUD Completo + Storage | ❌ Solo lectura |
| **Padrón de Inscripciones** | ✅ Gestionar / Exportar CSV | ✅ Gestionar / Exportar CSV | ✅ Gestionar / Exportar CSV |
| **Consultas de Contacto** | ✅ Leer / Responder / Notas | ✅ Leer / Responder / Notas | ✅ Leer / Responder / Notas |
| **Configuración Institucional** | ✅ Modificar Datos Legales | ❌ Denegado | ❌ Denegado |
| **Firebase & Auditoría** | ✅ Ver logs y sincronizar | ❌ Denegado | ❌ Denegado |
