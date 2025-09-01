// dashboard.js
import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { collection, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  const modulesSection = document.getElementById("modules-section");

  // 🔹 Verificar sesión activa
  onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = "login.html";

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    if (!userData) return alert("Usuario no registrado en la base de datos.");

    userInfo.textContent = `Hola, ${userData.email} (${userData.role})`;

    renderModules(userData);
  });

  // 🔹 Logout
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // =========================
  // RENDER DE MÓDULOS
  // =========================
  function renderModules(userData) {
    modulesSection.innerHTML = "";

    // Usuarios normales
    if (userData.role === "user") {
      renderUserModules(userData);
    }
    // Admin
    else if (userData.role === "admin") {
      renderAdminModules(userData);
    }
    // SuperAdmin
    else if (userData.role === "superadmin") {
      renderSuperAdminModules();
    }
  }

  // =========================
  // MÓDULOS USUARIO
  // =========================
  function renderUserModules(userData) {
    modulesSection.innerHTML = `
      <div class="module-card">
        <h3>👥 Clientes</h3>
        <div id="clients-module">Cargando...</div>
      </div>
      <div class="module-card">
        <h3>📦 Inventario</h3>
        <div id="inventory-module">Cargando...</div>
      </div>
    `;
    renderClientsModule(userData);
    renderInventoryModule(userData);
  }

  // =========================
  // MÓDULOS ADMIN
  // =========================
  function renderAdminModules(userData) {
    modulesSection.innerHTML = `
      <div class="module-card admin">
        <h3>📊 Reportes</h3>
        <p>Visualiza estadísticas y reportes de tu empresa.</p>
      </div>
      <div class="module-card admin">
        <h3>⚙️ Configuración Empresa</h3>
        <p>Actualiza la información de tu empresa.</p>
      </div>
      <div class="module-card admin">
        <h3>👥 Gestión de Usuarios</h3>
        <p>Agrega, elimina o modifica usuarios internos.</p>
      </div>
      <div class="module-card">
        <h3>👥 Clientes</h3>
        <div id="clients-module">Cargando...</div>
      </div>
      <div class="module-card">
        <h3>📦 Inventario</h3>
        <div id="inventory-module">Cargando...</div>
      </div>
    `;
    renderClientsModule(userData);
    renderInventoryModule(userData);
  }

  // =========================
  // MÓDULOS SUPERADMIN
  // =========================
  function renderSuperAdminModules() {
    modulesSection.innerHTML = `
      <div class="module-card superadmin">
        <h3>SuperAdmin</h3>
        <p>Gestión completa de empresas y usuarios.</p>
        <div id="superadmin-panel">Cargando panel...</div>
      </div>
    `;
    initSuperAdminPanel();
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

    form.addEventListener("submit", async e => {
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

    assignForm.addEventListener("submit", async e => {
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

  // =========================
  // MÓDULO CLIENTES
  // =========================
  async function renderClientsModule(userData) {
    const clientsContainer = document.getElementById("clients-module");
    clientsContainer.innerHTML = "";

    try {
      const snapshot = await getDocs(collection(db, "companies", userData.companyId, "clients"));
      if (snapshot.empty) {
        clientsContainer.innerHTML = "<p>No hay clientes registrados.</p>";
        return;
      }

      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr><th>Nombre</th><th>Email</th><th>Teléfono</th></tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector("tbody");

      snapshot.forEach(docSnap => {
        const client = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${client.name}</td><td>${client.email}</td><td>${client.phone || '-'}</td>`;
        tbody.appendChild(tr);
      });

      clientsContainer.appendChild(table);
    } catch(err) {
      console.error("Error cargando clientes:", err);
      clientsContainer.innerHTML = "<p>Error al cargar clientes.</p>";
    }
  }

  // =========================
  // MÓDULO INVENTARIO
  // =========================
  async function renderInventoryModule(userData) {
    const inventoryContainer = document.getElementById("inventory-module");
    inventoryContainer.innerHTML = "";

    try {
      const snapshot = await getDocs(collection(db, "companies", userData.companyId, "inventory"));
      if (snapshot.empty) {
        inventoryContainer.innerHTML = "<p>No hay productos en inventario.</p>";
        return;
      }

      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr><th>Producto</th><th>Cantidad</th><th>Precio</th></tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector("tbody");

      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${item.name}</td><td>${item.quantity}</td><td>${item.price}</td>`;
        tbody.appendChild(tr);
      });

      inventoryContainer.appendChild(table);
    } catch(err) {
      console.error("Error cargando inventario:", err);
      inventoryContainer.innerHTML = "<p>Error al cargar inventario.</p>";
    }
  }
});
