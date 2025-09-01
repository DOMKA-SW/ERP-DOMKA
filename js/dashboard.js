// dashboard.js
import { auth, db } from "./firebase.js";
import {
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  const modulesSection = document.getElementById("modules-section");

  // 🔹 Verificar sesión activa
  onAuthStateChanged(auth, async (user) => {
    if (!user) return (window.location.href = "login.html");

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    if (!userData) return alert("Usuario no registrado en la base de datos.");

    userInfo.textContent = `Hola, ${userData.email} (${userData.role})`;

    // Render según rol
    if (userData.role === "superadmin") renderSuperAdminModules(userData);
    else if (userData.role === "admin") renderAdminModules(userData);
    else renderUserModules(userData);
  });

  // 🔹 Logout
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // =========================
  // RENDER MÓDULOS
  // =========================
  function renderUserModules(userData) {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        <div class="module-card">
          <h3>👥 Clientes</h3>
          <div id="clients-module"></div>
        </div>
      </div>
    `;
    renderClientsModule(userData);
  }

  function renderAdminModules(userData) {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        <div class="module-card">
          <h3>👥 Clientes</h3>
          <div id="clients-module"></div>
        </div>
      </div>
    `;
    renderClientsModule(userData);
  }

  function renderSuperAdminModules(userData) {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        <div class="module-card superadmin">
          <h3>SuperAdmin</h3>
          <p>Gestión completa de empresas y usuarios.</p>
          <div id="superadmin-panel"></div>
        </div>
      </div>
    `;
    initSuperAdminPanel();
  }

  // =========================
  // SUPERADMIN: Gestión de Empresas
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
      } catch (err) {
        console.error(err);
        alert("Error al crear empresa");
      }
    });

    // Listar empresas
    async function loadCompanies() {
      ul.innerHTML = "";
      companySelect.innerHTML = "";
      const snapshot = await getDocs(collection(db, "companies"));
      snapshot.forEach((docSnap) => {
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
      } catch (err) {
        console.error(err);
        alert("Error al asignar usuario");
      }
    });

    await loadCompanies();
  }

// =========================
// MÓDULO CLIENTES
// =========================
async function renderClientsModule() {
  modulesSection.innerHTML = `
    <div class="module-card">
      <h3>👥 Clientes</h3>
      <p>Gestión completa de tus clientes.</p>
      <div id="clients-panel">
        <form id="add-client-form">
          <input type="text" id="client-name" placeholder="Nombre del cliente" required>
          <input type="email" id="client-email" placeholder="Email" required>
          <input type="text" id="client-phone" placeholder="Teléfono" required>
          <button type="submit">Agregar Cliente</button>
        </form>
        <table id="clients-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  const addForm = document.getElementById("add-client-form");
  const tableBody = document.querySelector("#clients-table tbody");

  // Función para cargar clientes
  async function loadClients() {
    tableBody.innerHTML = "";
    const snapshot = await getDocs(collection(db, "clients"));
    snapshot.forEach(docSnap => {
      const client = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${client.name}</td>
        <td>${client.email}</td>
        <td>${client.phone}</td>
        <td>
          <button class="edit-btn" data-id="${docSnap.id}">Editar</button>
          <button class="delete-btn" data-id="${docSnap.id}">Eliminar</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Editar cliente
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const docSnap = await getDoc(doc(db, "clients", id));
        const data = docSnap.data();
        const name = prompt("Nombre", data.name);
        const email = prompt("Email", data.email);
        const phone = prompt("Teléfono", data.phone);
        if (name && email && phone) {
          await setDoc(doc(db, "clients", id), { name, email, phone });
          loadClients();
        }
      });
    });

    // Eliminar cliente
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("¿Eliminar cliente?")) {
          await deleteDoc(doc(db, "clients", id));
          loadClients();
        }
      });
    });
  }

  // Agregar cliente
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("client-name").value;
    const email = document.getElementById("client-email").value;
    const phone = document.getElementById("client-phone").value;

    await addDoc(collection(db, "clients"), { name, email, phone });
    addForm.reset();
    loadClients();
  });

  loadClients();
}

