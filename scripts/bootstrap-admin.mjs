#!/usr/bin/env node
/**
 * @file bootstrap-admin.mjs
 * Script seguro de inicialización del primer Administrador del sistema institucional ARIQ.
 * 
 * Reglas de seguridad:
 * - Se ejecuta en entorno de servidor / terminal (nunca en el navegador).
 * - Hashea la contraseña con bcryptjs (cost factor 12) antes de persistir.
 * - No incluye contraseñas fijas en el código.
 * - Valida la existencia previa de administradores para evitar sobrescrituras accidentales.
 * 
 * Uso:
 *   node scripts/bootstrap-admin.mjs
 *   O con variables de entorno:
 *   ADMIN_USERNAME="admin" ADMIN_EMAIL="admin@ariq.org.ar" ADMIN_PASSWORD="MiPasswordSegura123!" node scripts/bootstrap-admin.mjs
 */

import readline from 'readline';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Cargar configuración de Firebase
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig = {};
if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

console.log('\n===============================================================');
console.log('🛡️  ARIQ - INICIALIZACIÓN SEGURA DEL PRIMER ADMINISTRADOR');
console.log(`🌐 Proyecto Firebase: ${firebaseConfig.projectId || 'ariq-rosario'}`);
console.log('===============================================================\n');

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function run() {
  try {
    // 1. Obtener parámetros (desde variables de entorno o interacción por consola)
    let username = process.env.ADMIN_USERNAME;
    let email = process.env.ADMIN_EMAIL;
    let password = process.env.ADMIN_PASSWORD;

    if (!username) {
      username = await prompt('Ingrese el nombre de usuario administrativo (ej. admin_ariq): ');
    }
    if (!username || username.length < 3) {
      console.error('❌ Error: El nombre de usuario debe contener al menos 3 caracteres.');
      process.exit(1);
    }

    if (!email) {
      email = await prompt('Ingrese el correo electrónico oficial (ej. admin@ariq.org.ar): ');
    }
    if (!email || !email.includes('@')) {
      console.error('❌ Error: El correo electrónico proporcionado no es válido.');
      process.exit(1);
    }

    if (!password) {
      password = await prompt('Ingrese la contraseña para el Administrador (mínimo 8 caracteres): ');
    }
    if (!password || password.length < 8) {
      console.error('❌ Error: La contraseña debe tener como mínimo 8 caracteres.');
      process.exit(1);
    }

    // 2. Verificar si ya existe un usuario con este username o email
    console.log('\n🔍 Verificando existencia en la colección privada admin_users...');
    const usersCol = collection(db, 'admin_users');
    
    // Check by username
    const qUsername = query(usersCol, where('username', '==', username.toLowerCase()), limit(1));
    const snapUsername = await getDocs(qUsername);
    if (!snapUsername.empty) {
      console.warn(`⚠️  Ya existe un usuario con el nombre de usuario "${username}".`);
      const overwrite = await prompt('¿Desea actualizar su contraseña y asegurar rol admin? (s/N): ');
      if (overwrite.toLowerCase() !== 's') {
        console.log('Operación cancelada por el usuario.');
        process.exit(0);
      }
    }

    // Check by email
    const qEmail = query(usersCol, where('email', '==', email.toLowerCase()), limit(1));
    const snapEmail = await getDocs(qEmail);

    let userId;
    if (!snapUsername.empty) {
      userId = snapUsername.docs[0].id;
    } else if (!snapEmail.empty) {
      userId = snapEmail.docs[0].id;
    } else {
      userId = `admin_${crypto.randomBytes(8).toString('hex')}`;
    }

    // 3. Generar Hash con Salt Bcrypt (Factor de costo 12)
    console.log('🔒 Generando hash criptográfico de contraseña con bcrypt (cost factor 12)...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Preparar el documento de usuario según el esquema estricto
    const now = new Date().toISOString();
    const adminUserDoc = {
      id: userId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      active: true,
      createdAt: snapUsername.empty && snapEmail.empty ? now : snapUsername.docs?.[0]?.data()?.createdAt || now,
      updatedAt: now,
      lastLogin: null,
      failedAttempts: 0,
      lockedUntil: null,
    };

    // 5. Guardar en Cloud Firestore en la colección privada admin_users
    console.log(`💾 Guardando en Firestore (/admin_users/${userId})...`);
    await setDoc(doc(db, 'admin_users', userId), adminUserDoc);

    // 6. Registrar en auditoría interna
    try {
      const logId = `log_${Date.now()}`;
      await setDoc(doc(db, 'internal_logs', logId), {
        usuario_email: email.toLowerCase(),
        usuario_uid: userId,
        usuario_rol: 'admin',
        accion: 'BOOTSTRAP_ADMIN',
        modulo: 'auth_propia',
        registro_id: userId,
        detalles: `Inicialización de cuenta de Administrador: ${username}`,
        timestamp: now,
      });
    } catch {
      // Continuar si los logs tienen reglas adicionales
    }

    console.log('\n===============================================================');
    console.log('✅ ¡ADMINISTRADOR INICIALIZADO EXITOSAMENTE!');
    console.log('---------------------------------------------------------------');
    console.log(`👤 ID de Usuario:   ${userId}`);
    console.log(`🔑 Nombre Usuario:  ${username.toLowerCase()}`);
    console.log(`📧 Correo Oficial:  ${email.toLowerCase()}`);
    console.log(`🛡️  Rol Asignado:   ADMINISTRADOR (Acceso Total)`);
    console.log(`🔒 Contraseña:      [ALMACENADA CON HASH BCRYPT SEGURO]`);
    console.log(`📅 Fecha Creación:  ${now}`);
    console.log('===============================================================\n');
    console.log('Ya puede iniciar sesión en /login utilizando estas credenciales.');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error durante la inicialización del Administrador:', err.message);
    process.exit(1);
  }
}

run();
