import { db, auth } from "../firebase.js";
import {
  collection, addDoc, getDocs, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export async function initClientes() {
  const form = document.getElementById("cliente-form");
  const list = document.getElementById("clientes-list");

  // === Guardar cliente ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const nombre = document.getElementById("cliente-nombre").value;
    const email = document.getElementById("cliente-email").value;
    const telefono = document.getElementById("cliente-telefono").value;

    await addDoc(collection(db, "clients"), {
      nombre, email, telefono,
      userId: user.uid,
      companyId: "demo" // luego lo tomamos del usuario logueado
    });

    form.reset();
    loadClientes();
  });

  // === Cargar clientes ===
  async function loadClientes() {
    list.innerHTML = "";
    const snapshot = await getDocs(collection(db, "clients"));
    snapshot.forEach(docSnap => {
      const c = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.nombre}</td>
        <td>${c.email}</td>
        <td>${c.telefono || ""}</td>
        <td><button data-id="${docSnap.id}" class="delete-btn">Eliminar</button></td>
      `;
      list.appendChild(tr);
    });

    // === Eliminar cliente ===
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        await deleteDoc(doc(db, "clients", btn.dataset.id));
        loadClientes();
      });
    });
  }

  loadClientes();
}
