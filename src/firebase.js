// Firebase configuration file (Placeholder for Production)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace with your actual Firebase project config credentials
const firebaseConfig = {
  apiKey: "AIzaSyBFWLzQLf_TR4ullXg64MR_7L_rD1-9d3w",
  authDomain: "multi-vendor-food-a37b4.firebaseapp.com",
  projectId: "multi-vendor-food-a37b4",
  storageBucket: "multi-vendor-food-a37b4.firebasestorage.app",
  messagingSenderId: "614481254834",
  appId: "1:614481254834:web:1bc1f1e9d39b50e76a6cab",
  measurementId: "G-K3WCN397JR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
