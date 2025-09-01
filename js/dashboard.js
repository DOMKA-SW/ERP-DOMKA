// dashboard.js
import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  const modulesSection = document.getElementById("modules-section");

  let currentUserData;

  // Verificar sesión
  onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = "login.html";

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) return alert("Usuario no registrado.");
    currentUserData = userDoc.data();
    userInfo.textContent = `Hola, ${currentUserData.email} (${currentUserData.role})`;

    renderMenu(currentUserData.role);
    renderWelcome();
  });

  // Logout
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // =========================
  // MENU DINÁMICO
  // =========================
  function renderMenu(role) {
    const menu = document.getElementById("dashboard-menu");
    menu.innerHTML = "";

    if (role === "superadmin" || role === "admin" || role === "user") {
      const clientesBtn = document.createElement("button");
      clientesBtn.textContent = "Clientes";
      clientesBtn.addEventListener("click", () => renderClientsModule());
      menu.appendChild(clientesBtn);

      const inventarioBtn = document.createElement("button");
      inventarioBtn.textContent = "Inventario";
      inventarioBtn.addEventListener("click", () => renderInventoryModule());
      menu.appendChild(inventarioBtn);
    }

    if (role === "superadmin") {
      const empresasBtn = document.createElement("button");
      empresasBtn.textContent = "Empresas";
      empresasBtn.addEventListener("click", () => renderSuperAdminPanel());
      menu.appendChild(empresasBtn);
    }
  }

  function renderWelcome() {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        <div class="module-card">
          <h3>Selecciona un módulo</h3>
          <p>Usa el menú de la izquierda para comenzar.</p>
        </div>
      </div>
    `;
  }

  // =========================
  // MÓDULO CLIENTES
  // =========================
  async function renderClientsModule() {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        <div class="module-card">
          <h3>Clientes</h3>
          <form id="add-client-form">
            <input type="text" id="client-name" placeholder="Nombre del cliente" required>
            <input type="email" id="client-email" placeholder="Email" required>
            <button type="submit">Agregar Cliente</button>
          </form>
          <ul id="clients-list"></ul>
        </div>
      </div>
    `;

    const form = document.getElementById("add-client-form");
    const list = document.getElementById("clients-list");

    async function loadClients() {
      list.innerHTML = "";
      const snapshot = await getDocs(collection(db, "clients"));
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const li = document.createElement("li");
        li.textContent = `${data.name} (${data.email}) `;
        const delBtn = document.createElement("button");
        delBtn.textContent = "Eliminar";
        delBtn.addEventListener("click", async () => {
          await deleteDoc(doc(db, "clients", docSnap.id));
          loadClients();
        });
        li.appendChild(delBtn);
        list.appendChild(li);
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("client-name").value;
      const email = document.getElementById("client-email").value;
      await addDoc(collection(db, "clients"), { name, email, createdAt: serverTimestamp() });
      form.reset();
      loadClients();
    });

    loadClients();
  }

  // =========================
  // MÓDULO INVENTARIO
  // =========================
  async function renderInventoryModule() {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        <div class="module-card">
          <h3>Inventario</h3>
          <form id="add-product-form">
            <input type="text" id="product-name" placeholder="Nombre del producto" required>
            <input type="number" id="product-stock" placeholder="Stock" required>
            <button type="submit">Agregar Producto</button>
          </form>
          <ul id="products-list"></ul>
        </div>
      </div>
    `;

    const form = document.getElementById("add-product-form");
    const list = document.getElementById("products-list");

    async function loadProducts() {
      list.innerHTML = "";
      const snapshot = await getDocs(collection(db, "inventory"));
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const li = document.createElement("li");
        li.textContent = `${data.name} (Stock: ${data.stock}) `;
        const delBtn = document.createElement("button");
        delBtn.textContent = "Eliminar";
        delBtn.addEventListener("click", async () => {
          await deleteDoc(doc(db, "inventory", docSnap.id));
          loadProducts();
        });
        li.appendChild(delBtn);
        list.appendChild(li);
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("product-name").value;
      const stock = parseInt(document.getElementById("product-stock").value);
      await addDoc(collection(db, "inventory"), { name, stock, createdAt: serverTimestamp() });
      form.reset();
      loadProducts();
    });

    loadProducts();
  }

  // =========================
  // MÓDULO SUPERADMIN (Empresas y usuarios)
  // =========================
  async function renderSuperAdminPanel() {
    modulesSection.innerHTML = `
      <div class="modules-grid">
        <div class="module-card">
          <h3>Gestión de Empresas</h3>
          <form id="create-company-form">
            <input type="text" id="company-name" placeholder="Nombre de la empresa" required>
            <button type="submit">➕ Crear Empresa</button>
          </form>
          <ul id="companies-list"></ul>
        </div>
      </div>
    `;

    const form = document.getElementById("create-company-form");
    const ul = document.getElementById("companies-list");

    async function loadCompanies() {
      ul.innerHTML = "";
      const snapshot = await getDocs(collection(db, "companies"));
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const li = document.createElement("li");
        li.textContent = data.name;
        ul.appendChild(li);
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("company-name").value;
      await addDoc(collection(db, "companies"), { name, createdAt: serverTimestamp() });
      form.reset();
      loadCompanies();
    });

    loadCompanies();
  }

});
