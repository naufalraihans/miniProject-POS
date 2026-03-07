import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-witnGml79dzWRY4JZMc6d_7O1wzO6vE",
  authDomain: "dcelup-zora.firebaseapp.com",
  projectId: "dcelup-zora",
  storageBucket: "dcelup-zora.firebasestorage.app",
  messagingSenderId: "248273070016",
  appId: "1:248273070016:web:4dba2449ee1a84617a8a25",
  measurementId: "G-GK9Y6085NE",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
};
