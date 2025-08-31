// js/firebase.js
// Configuración de Firebase DOMKA ERP

// Importar SDK (v9 modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ⚠️ config real de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDyvK3PJK5gwZBTD3R8vQl-TPK7jo66ET4",
  authDomain: "domka-erp.firebaseapp.com",
  projectId: "domka-erp",
  storageBucket: "domka-erp.firebasestorage.app",
  messagingSenderId: "610583027018",
  appId: "1:610583027018:web:46f6f25e532bec491e35b3"
};

// Inicializar
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportar
export { auth, db };
