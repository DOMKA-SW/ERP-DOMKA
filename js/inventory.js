// inventory.js
import { db } from "./firebase.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

export async function renderInventoryModule(userData) {
  const moduleContainer = document.getElementById("inventory-module");
  moduleContainer.innerHTML = `
    <form id="inventory-form">
      <input type="text" id="product-name" placeholder="Nombre del producto" required>
      <input type="number" id="product-stock" placeholder="Cantidad" required>
      <input type="number" step="0.01" id="product-price" placeholder="Precio" required>
      <button type="submit">Agregar Producto</button>
    </form>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Stock</th>
          <th>Precio</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody id="inventory-tbody"></tbody>
    </table>
  `;

  const form = document.getElementById("inventory-form");
  const tbody = document.getElementById("inventory-tbody");

  async function loadInventory() {
    tbody.innerHTML = "";
    const snapshot = await getDocs(collection(db, "inventory"));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data.name}</td>
        <td>${data.stock}</td>
        <td>$${data.price.toFixed(2)}</td>
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
    const name = document.getElementById("product-name").value;
    const stock = parseInt(document.getElementById("product-stock").value);
    const price = parseFloat(document.getElementById("product-price").value);
    try {
      await addDoc(collection(db, "inventory"), {
        name, stock, price, createdAt: serverTimestamp(), companyId: userData.companyId
      });
      form.reset();
      loadInventory();
      alert("Producto agregado ✅");
    } catch(err) {
      console.error(err);
      alert("Error al agregar producto");
    }
  });

  tbody.addEventListener("click", async e => {
    const id = e.target.dataset.id;
    if (!id) return;
    const docRef = doc(db, "inventory", id);

    if (e.target.classList.contains("edit-btn")) {
      const docSnap = await getDocs(docRef);
      const data = docSnap.data();
      document.getElementById("product-name").value = data.name;
      document.getElementById("product-stock").value = data.stock;
      document.getElementById("product-price").value = data.price;

      form.removeEventListener("submit", addProductHandler);
      form.addEventListener("submit", async ev => {
        ev.preventDefault();
        await updateDoc(docRef, {
          name: document.getElementById("product-name").value,
          stock: parseInt(document.getElementById("product-stock").value),
          price: parseFloat(document.getElementById("product-price").value),
          updatedAt: serverTimestamp()
        });
        form.reset();
        loadInventory();
        alert("Producto actualizado ✅");
      });
    } else if (e.target.classList.contains("delete-btn")) {
      if (confirm("¿Desea eliminar este producto?")) {
        await deleteDoc(docRef);
        loadInventory();
        alert("Producto eliminado ✅");
      }
    }
  });

  await loadInventory();
}
