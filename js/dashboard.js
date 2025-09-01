// dashboard.js
import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { collection, addDoc, getDocs, serverTimestamp, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

let currentUserData = null;

document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  const modulesSection = document.getElementById("modules-section");

  // 🔹 Verificar sesión
  onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = "login.html";

    const userDoc = await getDoc(doc(db, "users", user.uid));
    currentUserData = userDoc.data();
    if (!currentUserData) return alert("Usuario no registrado en la base de datos.");

    userInfo.textContent = `Hola, ${currentUserData.email} (${currentUserData.role})`;

    // Render inicial según rol
    if (currentUserData.role === "superadmin") renderSuperAdminModules();
    else if (currentUserData.role === "admin") renderAdminModules();
    else renderUserModules();
  });

  // 🔹 Logout
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // 🔹 Sidebar clicks para cambiar módulo
  document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const module = link.dataset.module;
      if (!currentUserData) return;

      switch(module) {
        case 'clients':
          renderClientsModule(currentUserData);
          break;
        case 'inventory':
          renderInventoryModule(currentUserData);
          break;
        case 'quotes':
          renderQuotesModule(currentUserData);
          break;
        case 'reports':
          renderReportsModule(currentUserData);
          break;
        case 'settings':
          renderSettingsModule(currentUserData);
          break;
        default:
          modulesSection.innerHTML = "<p>Selecciona un módulo</p>";
      }
    });
  });

  // =========================
  // RENDER MÓDULOS
  // =========================

  function renderUserModules(userData) {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        <div class="module-card" data-module="clients">
          <h3>👥 Clientes</h3>
          <div id="clients-module"></div>
        </div>
        <div class="module-card" data-module="inventory">
          <h3>📦 Inventario</h3>
          <div id="inventory-module"></div>
        </div>
        <div class="module-card" data-module="quotes">
          <h3>📋 Cotizaciones</h3>
          <div id="quotes-module"></div>
        </div>
      </div>
    `;
    renderClientsModule(userData);
    renderInventoryModule(userData);
  }

  function renderAdminModules() {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        <div class="module-card admin" data-module="reports">
          <h3>📊 Reportes</h3>
          <div id="reports-module"></div>
        </div>
        <div class="module-card admin" data-module="settings">
          <h3>⚙️ Configuración Empresa</h3>
          <div id="settings-module"></div>
        </div>
        <div class="module-card admin" data-module="clients">
          <h3>👥 Gestión de Usuarios</h3>
          <div id="clients-module"></div>
        </div>
      </div>
    `;
  }

  function renderSuperAdminModules() {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        <div class="module-card superadmin" data-module="superadmin-panel">
          <h3>SuperAdmin</h3>
          <div id="superadmin-panel"></div>
        </div>
      </div>
    `;
    initSuperAdminPanel();
  }

  // =========================
  // CLIENTES
  // =========================
  function renderClientsModule(userData) {
    const container = document.getElementById("clients-module");
    if(!container) return;
    container.innerHTML = `<p>Lista de clientes para la empresa: ${userData.companyId || 'N/A'}</p>`;
    // Aquí se puede agregar la lógica para listar clientes desde Firebase
  }

  // =========================
  // INVENTARIO
  // =========================
  function renderInventoryModule(userData) {
    const container = document.getElementById("inventory-module");
    if(!container) return;
    container.innerHTML = `<p>Inventario de la empresa: ${userData.companyId || 'N/A'}</p>`;
    // Lógica de inventario
  }

  // =========================
  // COTIZACIONES
  // =========================
  function renderQuotesModule(userData) {
    const container = document.getElementById("quotes-module");
    if(!container) return;
    container.innerHTML = `<p>Módulo de cotizaciones.</p>`;
  }

  // =========================
  // REPORTES
  // =========================
  function renderReportsModule(userData) {
    const container = document.getElementById("reports-module");
    if(!container) return;
    container.innerHTML = `<p>Módulo de reportes.</p>`;
  }

  // =========================
  // CONFIGURACIÓN
  // =========================
  function renderSettingsModule(userData) {
    const container = document.getElementById("settings-module");
    if(!container) return;
    container.innerHTML = `<p>Configuración de la empresa.</p>`;
  }

  // =========================
  // SUPERADMIN PANEL
  // =========================
  async function initSuperAdminPanel() {
    const panel = document.getElementById("superadmin-panel");
    panel.innerHTML = `
      <form id="create-company-form">
        <input type="text" id="company-name" placeholder="Nombre de la empresa" required>
        <button type="submit">➕ Crear Empresa</button>
      </form>
      <div class="companies-list">
        <h4>Empresas Registradas</h4>
        <ul id="companies-ul"></ul>
      </div>
      <div class="assign-user">
        <h4>Asignar Usuario</h4>
        <form id="assign-user-form">
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

    // Crear empresa
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

    // Asignar usuario
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
