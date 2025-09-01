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

    const emailInput = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const companyId = companyIdInput?.value.trim() || null;

    errorMsg.textContent = "";

    try {
      // 🔹 Login en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, emailInput, password);
      const user = userCredential.user;

      // 🔹 Obtener datos del usuario
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error("Usuario no registrado en la base de datos.");
      }

      const userData = userDoc.data();

      // 🔹 Validar email en Firestore (evita espacios/mayúsculas)
      if (userData.email.trim().toLowerCase() !== emailInput) {
        await signOut(auth);
        throw new Error("Email no coincide con la base de datos.");
      }

      // 🔹 Validar companyId solo si NO es SuperAdmin
     if (userData.role !== "superadmin" && userData.companyId !== companyId) {
       await signOut(auth);
       throw new Error("El usuario no pertenece a esta empresa o ID incorrecto.");
}

      // 🔹 Login exitoso → Dashboard
      window.location.href = "dashboard.html";

    } catch (err) {
      console.error("Error login:", err);
      errorMsg.textContent = "Error: " + err.message;
    }
  });
});
