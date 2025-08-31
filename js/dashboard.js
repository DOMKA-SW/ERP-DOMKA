// js/dashboard.js
import { auth, db } from "./firebase.js";
import { logoutUser, protectRoute } from "./auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// === Proteger la ruta ===
protectRoute();

// === Obtener datos del usuario ===
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      document.getElementById("welcome-text").innerText = `Bienvenido, ${data.name}`;
      document.getElementById("company-name").innerText = data.companyId;
    }
  }
});

// === Logout ===
document.getElementById("logout-btn").addEventListener("click", async () => {
  await logoutUser();
});
