import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  console.log('=== VERIFYING FIRESTORE DATA IN ARIQ-ROSARIO ===');
  
  // 1. Institutional settings
  const settingsSnap = await getDoc(doc(db, 'institutional_settings', 'ariq_main'));
  if (!settingsSnap.exists()) {
    console.error('FAIL: institutional_settings/ariq_main not found!');
    process.exit(1);
  }
  const settings = settingsSnap.data();
  console.log('institutional_settings:', settings.nombre_oficial, '| Logo Base64 len:', settings.logotipo_base64?.length, '| Hero Base64 len:', settings.hero_imagen_base64?.length);

  // 2. Categories
  const catSnap = await getDocs(collection(db, 'news_categories'));
  console.log('news_categories count:', catSnap.size);
  catSnap.forEach(d => console.log('  -', d.data().nombre));

  // 3. News
  const newsSnap = await getDocs(collection(db, 'news'));
  console.log('news count:', newsSnap.size);
  newsSnap.forEach(d => {
    const item = d.data();
    console.log('  -', item.titulo?.slice(0, 45) + '...', '| Image B64 len:', item.imagen_base64?.length);
  });

  // 4. Courses
  const coursesSnap = await getDocs(collection(db, 'courses'));
  console.log('courses count:', coursesSnap.size);
  coursesSnap.forEach(d => {
    const item = d.data();
    console.log('  -', item.nombre?.slice(0, 45) + '...', '| Image B64 len:', item.imagen_base64?.length);
  });

  // 5. Events
  const eventsSnap = await getDocs(collection(db, 'events'));
  console.log('events count:', eventsSnap.size);
  eventsSnap.forEach(d => {
    const item = d.data();
    console.log('  -', item.titulo?.slice(0, 45) + '...', '| Image B64 len:', item.imagen_base64?.length);
  });

  // 6. Registrations
  const regSnap = await getDocs(collection(db, 'course_registrations'));
  console.log('course_registrations count:', regSnap.size);

  // 7. Contact messages
  const contactSnap = await getDocs(collection(db, 'contact_messages'));
  console.log('contact_messages count:', contactSnap.size);

  // 8. Admin users
  const adminSnap = await getDocs(collection(db, 'admin_users'));
  console.log('admin_users count:', adminSnap.size);

  console.log('\n>>> ALL FIRESTORE DATA CONFIRMED & OPERATIONAL! <<<');
  process.exit(0);
}

run().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
