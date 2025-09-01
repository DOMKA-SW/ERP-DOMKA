import { db, auth } from "./firebase.js";
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const clientesModule = document.getElementById("clientes-module");
  const form = document.getElementById("cliente-form");
  const ul = document.getElementById("clientes-ul");

  let currentUserCompanyId = null;

  // Obtener empresa del usuario actual
  import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
  import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

  onAuthStateChanged(auth, async user => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    currentUserCompanyId = userDoc.data().companyId;
    clientesModule.style.display = "block";
    cargarClientes();
  });

  // Crear / editar cliente
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("cliente-id").value;
    const nombre = document.getElementById("cliente-nombre").value;
    const email = document.getElementById("cliente-email").value;
    const telefono = document.getElementById("cliente-telefono").value;

    if (id) {
      await setDoc(doc(db, "companies", currentUserCompanyId, "clientes", id), { nombre, email, telefono });
      alert("Cliente actualizado ✅");
    } else {
      await addDoc(collection(db, "companies", currentUserCompanyId, "clientes"), { nombre, email, telefono });
      alert("Cliente creado ✅");
    }

    form.reset();
  });

  // Cargar clientes en tiempo real
  async function cargarClientes() {
    const clientesRef = collection(db, "companies", currentUserCompanyId, "clientes");
    onSnapshot(clientesRef, snapshot => {
      ul.innerHTML = "";
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${data.nombre}</strong> | ${data.email} | ${data.telefono || "-"}
          <button class="editar-btn">✏️</button>
          <button class="eliminar-btn">🗑️</button>
        `;
        // Editar
        li.querySelector(".editar-btn").addEventListener("click", () => {
          document.getElementById("cliente-id").value = docSnap.id;
          document.getElementById("cliente-nombre").value = data.nombre;
          document.getElementById("cliente-email").value = data.email;
          document.getElementById("cliente-telefono").value = data.telefono;
        });
        // Eliminar
        li.querySelector(".eliminar-btn").addEventListener("click", async () => {
          if (confirm("¿Eliminar cliente?")) {
            await deleteDoc(doc(db, "companies", currentUserCompanyId, "clientes", docSnap.id));
          }
        });
        ul.appendChild(li);
      });
    });
  }
});
