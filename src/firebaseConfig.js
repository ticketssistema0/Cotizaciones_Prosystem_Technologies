import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB6sbP1NsnFNnKVi3akIuIgcaS3S9keaIg",
  authDomain: "gestor-de-cotizaciones-4b4ad.firebaseapp.com",
  projectId: "gestor-de-cotizaciones-4b4ad",
  storageBucket: "gs://gestor-de-cotizaciones-4b4ad.firebasestorage.app", // 👈 ojo aquí
  messagingSenderId: "1003009384366",
  appId: "1:1003009384366:web:ce3dbbc594de7840d2b23f"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
