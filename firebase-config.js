import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "سنضع_هذا_الرقم_في_الخطوة_التالية",
  authDomain: "سنضع_هذا_في_الخطوة_التالية",
  projectId: "سنضع_هذا_في_الخطوة_التالية",
  storageBucket: "سنضع_هذا_في_الخطوة_التالية",
  messagingSenderId: "سنضع_هذا_في_الخطوة_التالية",
  appId: "سنضع_هذا_في_الخطوة_التالية"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, deleteDoc, doc };
