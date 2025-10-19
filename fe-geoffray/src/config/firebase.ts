import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyABfOpj7WIW5sDDzny71_EpP4GQx0tH-Ak",
  authDomain: "geoffray-f341d.firebaseapp.com",
  projectId: "geoffray-f341d",
  storageBucket: "geoffray-f341d.firebasestorage.app",
  messagingSenderId: "507196746203",
  appId: "1:507196746203:web:885a24db71b712bb419ffe",
  measurementId: "G-SF6BSX7SWL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;