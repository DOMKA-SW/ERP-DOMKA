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

// === Cargar módulos dinámicamente ===
const moduleContainer = document.getElementById("module-container");
const navLinks = document.querySelectorAll(".sidebar-nav a");

navLinks.forEach(link => {
  link.addEventListener("click", async (e) => {
    e.preventDefault();
    const moduleName = link.getAttribute("data-module");
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    try {
      const res = await fetch(`modules/${moduleName}.html`);
      const html = await res.text();
      moduleContainer.innerHTML = html;
      if (moduleName === "clientes") {
        import("./modules/clientes.js").then(mod => mod.initClientes());
      }
    } catch (err) {
      moduleContainer.innerHTML = `<p>Error al cargar módulo ${moduleName}</p>`;
    }
  });
});
