import { auth, db } from "./firebase.js";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

/* -------------------- REGISTRO -------------------- */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const companyName = document.getElementById("companyName").value.trim();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorMsg = document.getElementById("errorMsg");

    if (password !== confirmPassword) {
      errorMsg.textContent = "Las contraseñas no coinciden.";
      return;
    }

    try {
      // Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generar un companyId único (ej: timestamp)
      const companyId = "C" + Date.now();

      // Crear documento de empresa
      await setDoc(doc(db, "companies", companyId), {
        name: companyName,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });

      // Guardar usuario en colección global
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        companyId: companyId,
        role: "admin",
        createdAt: serverTimestamp()
      });

      // También en subcolección de la empresa
      await setDoc(doc(db, "companies", companyId, "users", user.uid), {
        email: email,
        role: "admin",
        createdAt: serverTimestamp()
      });

      window.location.href = "dashboard.html";
    } catch (error) {
      errorMsg.textContent = "Error: " + error.message;
    }
  });
}

/* -------------------- LOGIN -------------------- */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const companyId = document.getElementById("companyId").value;
    const errorMsg = document.getElementById("errorMsg");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Validar que el usuario pertenezca a esa empresa
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().companyId === companyId) {
        window.location.href = "dashboard.html";
      } else {
        errorMsg.textContent = "El usuario no pertenece a esta empresa.";
        await signOut(auth);
      }
    } catch (error) {
      errorMsg.textContent = "Error: " + error.message;
    }
  });
}

/* -------------------- DASHBOARD -------------------- */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userInfo = document.getElementById("userInfo");
    if (userInfo) {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        let data = docSnap.data();
        userInfo.textContent = `Usuario: ${data.email} | Empresa: ${data.companyId} | Rol: ${data.role}`;
      }
    }
  } else {
    if (!window.location.href.includes("login.html") && 
        !window.location.href.includes("register.html")) {
      window.location.href = "login.html";
    }
  }
});

