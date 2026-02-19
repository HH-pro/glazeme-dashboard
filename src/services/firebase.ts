// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCqlkbr-PeJIMv5SgvadI5eazN1ztRS6ac",
  authDomain: "glazeme-46406.firebaseapp.com",
  projectId: "glazeme-46406",
  storageBucket: "glazeme-46406.firebasestorage.app",
  messagingSenderId: "885518291591",
  appId: "1:885518291591:web:69097ce591d5b81d939e22",
  measurementId: "G-325LJXD1YK"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);