import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCgXFfL4_emXVgje2bKyyIM5g6FlCoMxXA",
  authDomain: "e-comerce-data-e11c0.firebaseapp.com",
  projectId: "e-comerce-data-e11c0",
  storageBucket: "e-comerce-data-e11c0.firebasestorage.app",
  messagingSenderId: "793714910945",
  appId: "1:793714910945:web:1131fe6fdc8148ea2ef9a0",
  measurementId: "G-NEQ2YZX60B"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);