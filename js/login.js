import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");
  const companyIdInput = document.getElementById("companyId");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const companyId = companyIdInput?.value.trim() || null;

    errorMsg.textContent = "";

    try {
      // 🔹 Login en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔹 Obtener datos del usuario
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error("Usuario no registrado en la base de datos.");
      }

      const userData = userDoc.data();

      // 🔹 Validar companyId para Admin/User
      if (userData.role !== "superadmin" && userData.companyId !== companyId) {
        await signOut(auth);
        throw new Error("El usuario no pertenece a esta empresa o ID incorrecto.");
      }

      // 🔹 Redirigir al dashboard
      window.location.href = "dashboard.html";

    } catch (err) {
      console.error("Error login:", err);
      errorMsg.textContent = "Error: " + err.message;
    }
  });
});
