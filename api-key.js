// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB-witnGml79dzWRY4JZMc6d_7O1wzO6vE",
  authDomain: "dcelup-zora.firebaseapp.com",
  projectId: "dcelup-zora",
  storageBucket: "dcelup-zora.firebasestorage.app",
  messagingSenderId: "248273070016",
  appId: "1:248273070016:web:4dba2449ee1a84617a8a25",
  measurementId: "G-GK9Y6085NE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);