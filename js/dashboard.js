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
  async function renderClientsModule(userData) {
    const module = document.getElementById("clients-module");
    module.innerHTML = `
      <form id="add-client-form">
        <input type="text" id="client-name" placeholder="Nombre del cliente" required>
        <input type="email" id="client-email" placeholder="Email del cliente" required>
        <button type="submit">➕ Agregar Cliente</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="clients-tbody"></tbody>
      </table>
    `;

    const form = document.getElementById("add-client-form");
    const tbody = document.getElementById("clients-tbody");
    const companyId = userData.companyId;

    // Función para listar clientes
    async function loadClients() {
      tbody.innerHTML = "";
      const snapshot = await getDocs(collection(db, `companies/${companyId}/clients`));
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${data.name}</td>
          <td>${data.email}</td>
          <td>
            <button class="delete-btn" data-id="${docSnap.id}">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Agregar eventos de eliminar
      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          await deleteDoc(doc(db, `companies/${companyId}/clients`, id));
          loadClients();
        });
      });
    }

    // Agregar cliente
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("client-name").value;
      const email = document.getElementById("client-email").value;
      try {
        await addDoc(collection(db, `companies/${companyId}/clients`), { name, email, createdAt: serverTimestamp() });
        form.reset();
        await loadClients();
      } catch (err) {
        console.error(err);
        alert("Error al agregar cliente");
      }
    });

    await loadClients();
  }
});
