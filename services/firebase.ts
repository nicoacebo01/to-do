import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBIGOz7ePeaIj4GX1qRIgYwoY7f7LYhEVA",
  authDomain: "to-do-d3f44.firebaseapp.com",
  projectId: "to-do-d3f44",
  storageBucket: "to-do-d3f44.firebasestorage.app",
  messagingSenderId: "129310500858",
  appId: "1:129310500858:web:9e88f462002e0d5e3c2643",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
