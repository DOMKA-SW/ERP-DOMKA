// clients.js
import { db } from "./firebase.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

export async function renderClientsModule(userData) {
  const moduleContainer = document.getElementById("clients-module");
  moduleContainer.innerHTML = `
    <form id="clients-form">
      <input type="text" id="client-name" placeholder="Nombre del cliente" required>
      <input type="email" id="client-email" placeholder="Email" required>
      <input type="text" id="client-phone" placeholder="Teléfono">
      <button type="submit">Agregar Cliente</button>
    </form>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Teléfono</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody id="clients-tbody"></tbody>
    </table>
  `;

  const form = document.getElementById("clients-form");
  const tbody = document.getElementById("clients-tbody");

  async function loadClients() {
    tbody.innerHTML = "";
    const snapshot = await getDocs(collection(db, "clients"));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data.name}</td>
        <td>${data.email}</td>
        <td>${data.phone || "-"}</td>
        <td>
          <button class="edit-btn" data-id="${docSnap.id}">✏️</button>
          <button class="delete-btn" data-id="${docSnap.id}">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("client-name").value;
    const email = document.getElementById("client-email").value;
    const phone = document.getElementById("client-phone").value;
    try {
      await addDoc(collection(db, "clients"), {
        name, email, phone, createdAt: serverTimestamp(), companyId: userData.companyId
      });
      form.reset();
      loadClients();
      alert("Cliente agregado ✅");
    } catch(err) {
      console.error(err);
      alert("Error al agregar cliente");
    }
  });

  tbody.addEventListener("click", async e => {
    const id = e.target.dataset.id;
    if (!id) return;
    const docRef = doc(db, "clients", id);

    if (e.target.classList.contains("edit-btn")) {
      const docSnap = await getDocs(docRef);
      const data = docSnap.data();
      document.getElementById("client-name").value = data.name;
      document.getElementById("client-email").value = data.email;
      document.getElementById("client-phone").value = data.phone || "";

      form.removeEventListener("submit", addClientHandler);
      form.addEventListener("submit", async ev => {
        ev.preventDefault();
        await updateDoc(docRef, {
          name: document.getElementById("client-name").value,
          email: document.getElementById("client-email").value,
          phone: document.getElementById("client-phone").value,
          updatedAt: serverTimestamp()
        });
        form.reset();
        loadClients();
        alert("Cliente actualizado ✅");
      });
    } else if (e.target.classList.contains("delete-btn")) {
      if (confirm("¿Desea eliminar este cliente?")) {
        await deleteDoc(docRef);
        loadClients();
        alert("Cliente eliminado ✅");
      }
    }
  });

  await loadClients();
}
