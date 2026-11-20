// URWA Firebase client setup
// Firebase web configuration is public by design. Never place service-account keys here.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmTZauBfe4UOWZsasOS4kwIxqjTOE3Bok",
  authDomain: "urwa-f3263.firebaseapp.com",
  projectId: "urwa-f3263",
  storageBucket: "urwa-f3263.firebasestorage.app",
  messagingSenderId: "64325595715",
  appId: "1:64325595715:web:ea5d07334d0c022dd1daf6",
  measurementId: "G-7YZEEL093M"
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// Analytics is optional and only initialized in supported browser environments.
export const analyticsPromise = isSupported()
  .then((supported) => supported ? getAnalytics(firebaseApp) : null)
  .catch(() => null);
