// js/dashboard.js
import { auth, db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Verificar sesión de usuario
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    // Obtener datos del usuario en Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("Usuario no encontrado en base de datos");
      await auth.signOut();
      window.location.href = "login.html";
      return;
    }

    const userData = userSnap.data();

    // Mostrar datos básicos en topbar + sidebar
    document.getElementById("welcome-text").textContent = `Bienvenido, ${user.email}`;
    document.getElementById("company-name").textContent = userData.companyId || "Super Admin";

    // Si es superadmin, agregar link a Admin Empresas
    if (userData.role === "superadmin") {
      const sidebar = document.querySelector(".sidebar-nav");
      const adminLink = document.createElement("a");
      adminLink.href = "#";
      adminLink.textContent = "🛠️ Admin Empresas";
      adminLink.dataset.module = "admin";
      sidebar.appendChild(adminLink);
    }

    // Cargar Home por defecto
    loadModule("home");

    // Manejo de navegación del sidebar
    document.querySelectorAll(".sidebar-nav a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        // Quitar clase active y marcar el link actual
        document.querySelectorAll(".sidebar-nav a").forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        const moduleName = link.dataset.module;
        if (moduleName) {
          loadModule(moduleName);
        }
      });
    });

    // Botón logout
    document.getElementById("logout-btn").addEventListener("click", async () => {
      await auth.signOut();
      window.location.href = "login.html";
    });

  } catch (err) {
    console.error("Error cargando usuario:", err);
    alert("Error al cargar la sesión. Intenta de nuevo.");
    await auth.signOut();
    window.location.href = "login.html";
  }
});

// Función para cargar módulos dinámicamente
async function loadModule(moduleName) {
  try {
    const res = await fetch(`modules/${moduleName}.html`);
    if (!res.ok) throw new Error("No se pudo cargar el módulo");

    const html = await res.text();
    document.getElementById("module-container").innerHTML = html;
  } catch (err) {
    console.error("Error cargando módulo:", err);
    document.getElementById("module-container").innerHTML = `<p>Error al cargar el módulo ${moduleName}</p>`;
  }
}

