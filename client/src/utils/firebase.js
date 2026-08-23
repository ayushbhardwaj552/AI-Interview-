// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,

  authDomain: "ai-interview-7c6cb.firebaseapp.com",
  projectId: "ai-interview-7c6cb",
  storageBucket: "ai-interview-7c6cb.firebasestorage.app",
  messagingSenderId: "822594206460",
  appId: "1:822594206460:web:ab10661c33e1c1952fb579",
  measurementId: "G-KEW89ZEDJJ"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
