import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  doc, 
  onSnapshot, 
  setDoc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
// persistentLocalCache enables offline "offline-first" sync capability
const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

// A unique document reference for your personal finance data
const USER_DOC_ID = "personal_finances";
const docRef = doc(db, "sync_data", USER_DOC_ID);

export { db, docRef, onSnapshot, setDoc };
