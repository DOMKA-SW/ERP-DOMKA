// dashboard.js
import { auth, db } from "./firebase.js";
import { 
  signOut, onAuthStateChanged, createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
  collection, addDoc, getDocs, serverTimestamp, doc, setDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  const modulesSection = document.getElementById("modules-section");

  // 🔹 Verificar sesión activa
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (!userData) {
        alert("No tienes datos de usuario registrados.");
        window.location.href = "login.html";
        return;
      }

      userInfo.textContent = `Hola, ${userData.email} (${userData.role})`;

      // Render según rol
      if (userData.role === "superadmin") {
        renderSuperAdminModules();
      } else if (userData.role === "admin") {
        renderAdminModules();
      } else {
        renderUserModules();
      }
    } else {
      window.location.href = "login.html";
    }
  });

  // 🔹 Logout
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // =========================
  // RENDER MÓDULOS
  // =========================

  function renderUserModules() {
    modulesSection.innerHTML = `
      <section class="module">
        <h2>Módulos de Usuario</h2>
        <ul>
          <li><a href="#">📋 Cotizaciones</a></li>
          <li><a href="#">👥 Clientes</a></li>
          <li><a href="#">📦 Inventario</a></li>
          <li><a href="#">📒 Contabilidad</a></li>
        </ul>
      </section>
    `;
  }

  function renderAdminModules() {
    modulesSection.innerHTML = `
      <section class="module">
        <h2>Módulos de Admin</h2>
        <ul>
          <li><a href="#">📊 Reportes</a></li>
          <li><a href="#">⚙️ Configuración Empresa</a></li>
          <li><a href="#">👥 Gestión de Usuarios</a></li>
        </ul>
      </section>
    `;
  }

  function renderSuperAdminModules() {
    modulesSection.innerHTML = `
      <section class="module">
        <h2>Super Admin</h2>
        <p>Gestión de Empresas y Usuarios</p>
        <div id="superadmin-panel"></div>
      </section>
    `;

    initAdminModule();
  }

  // =========================
  // SUPERADMIN: Gestión de Empresas y Usuarios
  // =========================
  async function initAdminModule() {
    const panel = document.getElementById("superadmin-panel");

    panel.innerHTML = `
      <form id="create-company-form">
        <input type="text" id="company-name" placeholder="Nombre de la empresa" required>
        <button type="submit">➕ Crear Empresa</button>
      </form>

      <div class="companies-list">
        <h3>Empresas Registradas</h3>
        <ul id="companies-ul"></ul>
      </div>

      <div class="assign-user">
        <h3>Asignar Usuario a Empresa</h3>
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

    // 🔹 Crear empresa
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("company-name").value.trim();

      try {
        await addDoc(collection(db, "companies"), {
          name,
          createdAt: serverTimestamp()
        });

        alert("Empresa creada con éxito ✅");
        form.reset();
        await loadCompanies();
      } catch (err) {
        console.error("Error creando empresa:", err);
        alert("Error al crear empresa");
      }
    });

    // 🔹 Listar empresas y llenar select
    async function loadCompanies() {
      ul.innerHTML = "";
      companySelect.innerHTML = "";

      const snapshot = await getDocs(collection(db, "companies"));
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Lista
        const li = document.createElement("li");
        li.textContent = data.name;
        ul.appendChild(li);

        // Select
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = data.name;
        companySelect.appendChild(option);
      });
    }

    // 🔹 Asignar usuario a empresa
    assignForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("user-email").value.trim().toLowerCase();
      const role = document.getElementById("user-role").value;
      const companyId = companySelect.value;

      try {
        // Intentar crear usuario en Auth si no existe
        let uid;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, "Temporal123*");
          uid = userCredential.user.uid;
          console.log("Usuario creado en Auth:", uid);
        } catch (err) {
          console.log("Usuario ya existe en Auth:", err.message);
          // Buscar UID existente en Firestore
          const usersSnap = await getDocs(collection(db, "users"));
          const existingUser = usersSnap.docs.find(u => u.data().email === email);
          if (existingUser) uid = existingUser.id;
        }

        if (!uid) throw new Error("No se pudo obtener UID del usuario");

        // Guardar en users/{uid}
        await setDoc(doc(db, "users", uid), {
          email,
          role,
          companyId,
          createdAt: serverTimestamp()
        });

        // Guardar en subcolección companies/{companyId}/users/{uid}
        await setDoc(doc(db, "companies", companyId, "users", uid), {
          email,
          role,
          createdAt: serverTimestamp()
        });

        alert(`Usuario ${email} asignado correctamente ✅`);
        assignForm.reset();
      } catch (err) {
        console.error("Error asignando usuario:", err);
        alert("Error al asignar usuario");
      }
    });

    // Inicializar listado
    await loadCompanies();
  }
});
