// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Teri asli Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBqcTHybN5w1lIY01dy9xzYrbx2ame_8XY",
  authDomain: "strangerlink-daf1e.firebaseapp.com",
  projectId: "strangerlink-daf1e",
  storageBucket: "strangerlink-daf1e.firebasestorage.app",
  messagingSenderId: "433289311135",
  appId: "1:433289311135:web:e9272bbc90817952f383aa",
  measurementId: "G-J3H3KJ13M2"
};

// Firebase ko initialize kiya
const app = initializeApp(firebaseConfig);

// Auth aur Provider ko export kar rahe hain taaki Layout.jsx mein use kar sakein
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup };