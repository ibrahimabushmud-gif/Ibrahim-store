import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyApaTlq9Dg8VrHyu3q3gfKQAPGZnb26tAM",
  authDomain: "my-store-db-332db.firebaseapp.com",
  projectId: "my-store-db-332db",
  storageBucket: "my-store-db-332db.firebasestorage.app",
  messagingSenderId: "742544976621",
  appId: "1:742544976621:web:5f07e5b782c67a614f7ae4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, deleteDoc, doc };
