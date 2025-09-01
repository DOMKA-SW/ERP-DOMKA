import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ==================================
// INICIO
// ==================================
document.addEventListener("DOMContentLoaded", () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  const modulesSection = document.getElementById("modules-section");
  const sidebarLinks = document.querySelectorAll(".sidebar nav a");

  let currentUserData;

  // 🔹 Verificar sesión activa
  onAuthStateChanged(auth, async user => {
    if (!user) return window.location.href = "login.html";
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    if (!userData) return alert("Usuario no registrado en la base de datos.");
    currentUserData = userData;
    userInfo.textContent = `Hola, ${userData.email} (${userData.role})`;
  });

  // 🔹 Logout
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // 🔹 Sidebar click
  sidebarLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const module = link.dataset.module;
      if (!currentUserData) return alert("No hay usuario cargado");
      switch(module){
        case "clients": renderClientsModule(currentUserData); break;
        case "inventory": renderInventoryModule(currentUserData); break;
        case "quotes": renderQuotesModule(currentUserData); break;
        default: modulesSection.innerHTML = "<p>Selecciona un módulo</p>";
      }
    });
  });

  // =========================
  // CLIENTES
  // =========================
  async function renderClientsModule(userData){
    modulesSection.innerHTML = `
      <div class="module-card">
        <h3>👥 Clientes</h3>
        <form id="create-client-form">
          <input type="text" id="client-name" placeholder="Nombre cliente" required>
          <input type="email" id="client-email" placeholder="Email" required>
          <button type="submit">➕ Crear Cliente</button>
        </form>
        <ul id="clients-list"></ul>
      </div>
    `;
    const form = document.getElementById("create-client-form");
    const clientsList = document.getElementById("clients-list");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const name = document.getElementById("client-name").value;
      const email = document.getElementById("client-email").value;
      try {
        await addDoc(collection(db, "users"), {
          name, email, role: "user", companyId: userData.companyId
        });
        alert("Cliente creado ✅");
        form.reset();
        loadClients();
      } catch(err){ console.error(err); alert("Error al crear cliente"); }
    });

    async function loadClients(){
      clientsList.innerHTML = "";
      const snapshot = await getDocs(collection(db, "users"));
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if(data.role === "user" && data.companyId === userData.companyId){
          const li = document.createElement("li");
          li.textContent = `${data.name} - ${data.email}`;
          clientsList.appendChild(li);
        }
      });
    }
    loadClients();
  }

  // =========================
  // INVENTARIO
  // =========================
  async function renderInventoryModule(userData){
    modulesSection.innerHTML = `
      <div class="module-card">
        <h3>📦 Inventario</h3>
        <form id="create-product-form">
          <input type="text" id="product-name" placeholder="Nombre producto" required>
          <input type="number" id="product-stock" placeholder="Stock" required>
          <input type="number" id="product-price" placeholder="Precio" required>
          <button type="submit">➕ Crear Producto</button>
        </form>
        <ul id="products-list"></ul>
      </div>
    `;
    const form = document.getElementById("create-product-form");
    const productsList = document.getElementById("products-list");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const name = document.getElementById("product-name").value;
      const stock = parseInt(document.getElementById("product-stock").value);
      const price = parseFloat(document.getElementById("product-price").value);
      try {
        await addDoc(collection(db, "products"), { name, stock, price, companyId: userData.companyId });
        alert("Producto creado ✅");
        form.reset();
        loadProducts();
      } catch(err){ console.error(err); alert("Error al crear producto"); }
    });

    async function loadProducts(){
      productsList.innerHTML = "";
      const snapshot = await getDocs(collection(db, "products"));
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if(data.companyId === userData.companyId){
          const li = document.createElement("li");
          li.textContent = `${data.name} - Stock: ${data.stock} - $${data.price.toFixed(2)}`;
          productsList.appendChild(li);
        }
      });
    }
    loadProducts();
  }

  // =========================
  // COTIZACIONES
  // =========================
  async function renderQuotesModule(userData){
    modulesSection.innerHTML = `
      <div class="module-card">
        <h3>📋 Cotizaciones</h3>
        <form id="create-quote-form">
          <select id="client-select" required></select>
          <div id="quote-items">
            <input type="text" placeholder="Producto" class="product-name" required>
            <input type="number" placeholder="Cantidad" class="product-qty" required>
            <input type="number" placeholder="Precio" class="product-price" required>
          </div>
          <button type="button" id="add-item-btn">➕ Agregar Producto</button>
          <button type="submit">💾 Crear Cotización</button>
        </form>
        <h4>Listado de Cotizaciones</h4>
        <ul id="quotes-list"></ul>
      </div>
    `;

    const form = document.getElementById("create-quote-form");
    const clientSelect = document.getElementById("client-select");
    const quotesList = document.getElementById("quotes-list");
    const addItemBtn = document.getElementById("add-item-btn");
    const quoteItems = document.getElementById("quote-items");

    // Clientes
    const clientsSnapshot = await getDocs(collection(db, "users"));
    clientsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if(data.companyId === userData.companyId && data.role === "user"){
        const option = document.createElement("option");
        option.value = docSnap.id;
        option.textContent = data.email;
        clientSelect.appendChild(option);
      }
    });

    // Agregar producto
    addItemBtn.addEventListener("click", () => {
      const div = document.createElement("div");
      div.innerHTML = `
        <input type="text" placeholder="Producto" class="product-name" required>
        <input type="number" placeholder="Cantidad" class="product-qty" required>
        <input type="number" placeholder="Precio" class="product-price" required>
      `;
      quoteItems.appendChild(div);
    });

    // Crear cotización
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const clientId = clientSelect.value;
      const items = Array.from(quoteItems.querySelectorAll("div, input")).map(div => {
        const name = div.querySelector(".product-name")?.value;
        const qty = parseInt(div.querySelector(".product-qty")?.value);
        const price = parseFloat(div.querySelector(".product-price")?.value);
        return name && qty && price ? { name, qty, price, productId: null } : null;
      }).filter(x=>x);
      const total = items.reduce((acc,item)=>acc+item.qty*item.price,0);
      try{
        await addDoc(collection(db,"quotes"),{
          clientId,
          companyId:userData.companyId,
          items,
          total,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser.uid
        });
        alert("Cotización creada ✅");
        form.reset();
        quoteItems.innerHTML = `
          <input type="text" placeholder="Producto" class="product-name" required>
          <input type="number" placeholder="Cantidad" class="product-qty" required>
          <input type="number" placeholder="Precio" class="product-price" required>
        `;
        loadQuotes();
      }catch(err){console.error(err); alert("Error al crear cotización");}
    });

    // Listado
    async function loadQuotes(){
      quotesList.innerHTML = "";
      const quotesSnapshot = await getDocs(collection(db,"quotes"));
      quotesSnapshot.forEach(docSnap=>{
        const data = docSnap.data();
        if(data.companyId===userData.companyId){
          const li = document.createElement("li");
          li.textContent = `Cliente: ${data.clientId} - Total: $${data.total.toFixed(2)}`;
          quotesList.appendChild(li);
        }
      });
    }
    loadQuotes();
  }
});
