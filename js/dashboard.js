// dashboard.js
import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  const modulesSection = document.getElementById("modules-section");
  const sidebarLinks = document.querySelectorAll('.sidebar nav a');

  let currentUserData = null;

  // 🔹 Verificar sesión
  onAuthStateChanged(auth, async (user) => {
    if(!user) return window.location.href = "login.html";

    const userDoc = await getDoc(doc(db, "users", user.uid));
    currentUserData = userDoc.data();
    if(!currentUserData) return alert("Usuario no registrado en la base de datos.");

    userInfo.textContent = `Hola, ${currentUserData.email} (${currentUserData.role})`;

    // Render inicial según rol
    if(currentUserData.role === "superadmin") renderSuperAdminModules();
    else if(currentUserData.role === "admin") renderAdminModules();
    else renderUserModules();
  });

  // 🔹 Logout
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // 🔹 Sidebar dinámico
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const module = link.dataset.module;

      switch(module) {
        case 'clients': renderClientsModule(); break;
        case 'inventory': renderInventoryModule(); break;
        case 'quotes': renderQuotesModule(); break;
        case 'reports': renderReportsModule(); break;
        case 'settings': renderSettingsModule(); break;
        case 'superadmin': renderSuperAdminPanel(); break;
        default: modulesSection.innerHTML = "<p>Selecciona un módulo</p>";
      }
    });
  });

  // =========================
  // RENDER DE MÓDULOS POR ROL
  // =========================
  function renderUserModules() {
    modulesSection.innerHTML = `
      <h2>Bienvenido</h2>
      <p>Selecciona un módulo del sidebar.</p>
    `;
  }

  function renderAdminModules() {
    modulesSection.innerHTML = `
      <h2>Panel de Admin</h2>
      <p>Selecciona un módulo del sidebar.</p>
    `;
  }

  function renderSuperAdminModules() {
    modulesSection.innerHTML = `
      <h2>SuperAdmin</h2>
      <p>Gestión completa de empresas y usuarios.</p>
    `;
  }

  // =========================
  // CLIENTES
  // =========================
  async function renderClientsModule() {
    modulesSection.innerHTML = `
      <h2>Clientes</h2>
      <div id="clients-list"></div>
      <form id="add-client-form">
        <input type="text" id="client-name" placeholder="Nombre del cliente" required>
        <input type="email" id="client-email" placeholder="Email" required>
        <button type="submit">➕ Agregar Cliente</button>
      </form>
    `;

    const clientsList = document.getElementById("clients-list");
    const addClientForm = document.getElementById("add-client-form");

    async function loadClients() {
      clientsList.innerHTML = "";
      const snapshot = await getDocs(collection(db, "clients"));
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.textContent = `${data.name} (${data.email})`;
        clientsList.appendChild(div);
      });
    }

    addClientForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("client-name").value;
      const email = document.getElementById("client-email").value;
      try {
        await addDoc(collection(db, "clients"), { name, email, createdAt: serverTimestamp() });
        addClientForm.reset();
        loadClients();
      } catch(err) {
        console.error(err);
        alert("Error al agregar cliente");
      }
    });

    await loadClients();
  }

  // =========================
  // INVENTARIO
  // =========================
  async function renderInventoryModule() {
    modulesSection.innerHTML = `
      <h2>Inventario</h2>
      <div id="inventory-list"></div>
      <form id="add-inventory-form">
        <input type="text" id="item-name" placeholder="Nombre del producto" required>
        <input type="number" id="item-stock" placeholder="Stock" required>
        <button type="submit">➕ Agregar Producto</button>
      </form>
    `;

    const inventoryList = document.getElementById("inventory-list");
    const addInventoryForm = document.getElementById("add-inventory-form");

    async function loadInventory() {
      inventoryList.innerHTML = "";
      const snapshot = await getDocs(collection(db, "inventory"));
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.textContent = `${data.name} - Stock: ${data.stock}`;
        inventoryList.appendChild(div);
      });
    }

    addInventoryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("item-name").value;
      const stock = parseInt(document.getElementById("item-stock").value);
      try {
        await addDoc(collection(db, "inventory"), { name, stock, createdAt: serverTimestamp() });
        addInventoryForm.reset();
        loadInventory();
      } catch(err) {
        console.error(err);
        alert("Error al agregar producto");
      }
    });

    await loadInventory();
  }

  // =========================
  // COTIZACIONES, REPORTES, CONFIG
  // =========================
  function renderQuotesModule() { modulesSection.innerHTML = "<h2>Cotizaciones</h2><p>En construcción...</p>"; }
  function renderReportsModule() { modulesSection.innerHTML = "<h2>Reportes</h2><p>En construcción...</p>"; }
  function renderSettingsModule() { modulesSection.innerHTML = "<h2>Configuración</h2><p>En construcción...</p>"; }

  // =========================
  // SUPERADMIN PANEL
  // =========================
  async function renderSuperAdminPanel() {
    modulesSection.innerHTML = `
      <h2>SuperAdmin: Gestión de Empresas</h2>
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

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("company-name").value;
      try {
        await addDoc(collection(db, "companies"), { name, createdAt: serverTimestamp() });
        alert("Empresa creada ✅");
        form.reset();
        loadCompanies();
      } catch(err) { console.error(err); alert("Error al crear empresa"); }
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
      } catch(err) { console.error(err); alert("Error al asignar usuario"); }
    });

    await loadCompanies();
  }
});
