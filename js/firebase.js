// URWA Firebase client setup
// Firebase web configuration is public by design. Never place service-account keys here.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBL0dIDVQbxEf24KBx5Xjf32_4HBTena5I",
  authDomain: "urwa-9ac38.firebaseapp.com",
  projectId: "urwa-9ac38",
  storageBucket: "urwa-9ac38.firebasestorage.app",
  messagingSenderId: "292537917258",
  appId: "1:292537917258:web:537f76142a7e405398abb3",
  measurementId: "G-ZP1Z0KYLV4"
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
