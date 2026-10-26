import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAI4fAagriprOxRJ0C5xY54JOPr0PrcXsg",
  authDomain: "sri-viswa-connect-4bd32.firebaseapp.com",
  projectId: "sri-viswa-connect-4bd32",
  storageBucket: "sri-viswa-connect-4bd32.firebasestorage.app",
  messagingSenderId: "811909722321",
  appId: "1:811909722321:web:3f0aa866afc2ab3b09d5f0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
