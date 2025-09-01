// dashboard.js
import { auth, db } from "./firebase.js";
import {
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  const modulesSection = document.getElementById("modules-section");

  // -----------------------
  // VERIFICAR SESIÓN ACTIVA
  // -----------------------
  onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = "login.html";

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    if (!userData) {
      alert("Usuario no registrado en la base de datos.");
      return;
    }

    userInfo.textContent = `Hola, ${userData.email} (${userData.role})`;

    // Mostrar módulos según rol
    if (userData.role === "superadmin") renderSuperAdminModules();
    else if (userData.role === "admin") renderAdminModules();
    else renderUserModules();
  });

  // -----------------------
  // LOGOUT
  // -----------------------
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // =======================
  // FUNCIONES DE RENDER
  // =======================

  function renderUserModules() {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        ${createModuleCard("📋 Cotizaciones", "Gestiona tus cotizaciones de manera simple y rápida.")}
        ${createModuleCard("👥 Clientes", "Visualiza y administra tu base de clientes.")}
        ${createModuleCard("📦 Inventario", "Controla el stock de tus productos.")}
        ${createModuleCard("📒 Contabilidad", "Registra y consulta movimientos contables.")}
      </div>
    `;
    animateModules();
  }

  function renderAdminModules() {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        ${createModuleCard("📊 Reportes", "Visualiza estadísticas y reportes de tu empresa.")}
        ${createModuleCard("⚙️ Configuración Empresa", "Actualiza la información de tu empresa.")}
        ${createModuleCard("👥 Gestión de Usuarios", "Agrega, elimina o modifica usuarios internos.")}
      </div>
    `;
    animateModules();
  }

  function renderSuperAdminModules() {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        ${createModuleCard("SuperAdmin", "Gestión completa de empresas y usuarios.", "superadmin-panel")}
      </div>
    `;
    initSuperAdminPanel();
    animateModules();
  }

  // -----------------------
  // FUNCIONES UTILES
  // -----------------------
  function createModuleCard(title, description, panelId = null) {
    return `
      <div class="module-card" ${panelId ? 'id="'+panelId+'"' : ''}>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    `;
  }

  function animateModules() {
    const cards = document.querySelectorAll(".module-card");
    cards.forEach((card, index) => {
      card.style.opacity = 0;
      card.style.transform = "translateY(20px)";
      setTimeout(() => {
        card.style.transition = "all 0.5s ease-out";
        card.style.opacity = 1;
        card.style.transform = "translateY(0)";
      }, index * 100);
    });
  }

  // =======================
  // PANEL SUPERADMIN
  // =======================
  async function initSuperAdminPanel() {
    const panel = document.getElementById("superadmin-panel");
    panel.innerHTML = `
      <form id="create-company-form" class="superadmin-form">
        <input type="text" id="company-name" placeholder="Nombre de la empresa" required>
        <button type="submit">➕ Crear Empresa</button>
      </form>

      <div class="companies-list">
        <h4>Empresas Registradas</h4>
        <ul id="companies-ul"></ul>
      </div>

      <div class="assign-user">
        <h4>Asignar Usuario</h4>
        <form id="assign-user-form" class="superadmin-form">
          <select id="company-select" required></select>
          <input type="email" id="user-email" placeholder="Email del usuario" required>
          <select id="user-role">
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit">Asignar</button>
        </form>
      </div>
    `;

    const form = document.getElementById("create-company-form");
    const ul = document.getElementById("companies-ul");
    const assignForm = document.getElementById("assign-user-form");
    const companySelect = document.getElementById("company-select");

    // CREAR EMPRESA
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("company-name").value;
      try {
        await addDoc(collection(db, "companies"), { name, createdAt: serverTimestamp() });
        alert("Empresa creada ✅");
        form.reset();
        await loadCompanies();
      } catch(err) {
        console.error(err);
        alert("Error al crear empresa");
      }
    });

    // LISTAR EMPRESAS
    async function loadCompanies() {
      ul.innerHTML = "";
      companySelect.innerHTML = "";
      const snapshot = await getDocs(collection(db, "companies"));
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const li = document.createElement("li");
        li.textContent = data.name;
        ul.appendChild(li);

        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = data.name;
        companySelect.appendChild(option);
      });
    }

    // ASIGNAR USUARIO
    assignForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("user-email").value;
      const role = document.getElementById("user-role").value;
      const companyId = companySelect.value;

      try {
        let userRecord = await createUserWithEmailAndPassword(auth, email, "Temporal123*").catch(() => null);
        const uid = userRecord?.user?.uid || email;
        await setDoc(doc(db, "users", uid), { email, role, companyId });
        assignForm.reset();
        alert("Usuario asignado ✅");
      } catch(err) {
        console.error(err);
        alert("Error al asignar usuario");
      }
    });

    await loadCompanies();
  }
});
