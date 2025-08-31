// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc,
    query,
    where,
    getDocs,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyvK3PJK5gwZBTD3R8vQl-TPK7jo66ET4",
  authDomain: "domka-erp.firebaseapp.com",
  projectId: "domka-erp",
  storageBucket: "domka-erp.firebasestorage.app",
  messagingSenderId: "610583027018",
  appId: "1:610583027018:web:46f6f25e532bec491e35b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { 
    auth, 
    db, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    onAuthStateChanged,
    signOut,
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc,
    query,
    where,
    getDocs,
    updateDoc
};

