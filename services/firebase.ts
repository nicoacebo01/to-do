import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuración del proyecto Firebase (mismo proyecto que app-condiciones).
// Para un proyecto dedicado, crear uno nuevo en console.firebase.google.com
// y reemplazar estos valores con los del nuevo proyecto.
const firebaseConfig = {
  apiKey: "AIzaSyBnFGWhvBLOaUo78z1PZfQEnL7kHU9Eu1M",
  authDomain: "condiciones-online.firebaseapp.com",
  projectId: "condiciones-online",
  storageBucket: "condiciones-online.firebasestorage.app",
  messagingSenderId: "740589522301",
  appId: "1:740589522301:web:b18ad7641d9905dd251014",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
