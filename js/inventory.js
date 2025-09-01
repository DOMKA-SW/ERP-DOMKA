// inventory.js
import { db } from "./firebase.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("inventory-form");
  const tableBody = document.getElementById("inventory-tbody");

  // Cargar productos
  async function loadProducts() {
    tableBody.innerHTML = "";
    const snapshot = await getDocs(collection(db, "products"));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data.name}</td>
        <td>${data.description}</td>
        <td>${data.stock}</td>
        <td>$${data.price.toFixed(2)}</td>
        <td>
          <button class="edit-btn" data-id="${docSnap.id}">✏️</button>
          <button class="delete-btn" data-id="${docSnap.id}">🗑️</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Crear producto
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("product-name").value;
    const description = document.getElementById("product-description").value;
    const stock = parseInt(document.getElementById("product-stock").value);
    const price = parseFloat(document.getElementById("product-price").value);

    try {
      await addDoc(collection(db, "products"), {
        name, description, stock, price, createdAt: serverTimestamp()
      });
      form.reset();
      loadProducts();
      alert("Producto agregado ✅");
    } catch (err) {
      console.error(err);
      alert("Error al agregar producto");
    }
  });

  // Editar o eliminar producto usando delegación de eventos
  tableBody.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("edit-btn")) {
      const docRef = doc(db, "products", id);
      const docSnap = await getDocs(docRef);
      const data = docSnap.data();
      document.getElementById("product-name").value = data.name;
      document.getElementById("product-description").value = data.description;
      document.getElementById("product-stock").value = data.stock;
      document.getElementById("product-price").value = data.price;
      // Cambiar comportamiento del form
      form.removeEventListener("submit", addProductHandler);
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        await updateDoc(docRef, {
          name: document.getElementById("product-name").value,
          description: document.getElementById("product-description").value,
          stock: parseInt(document.getElementById("product-stock").value),
          price: parseFloat(document.getElementById("product-price").value),
          updatedAt: serverTimestamp()
        });
        form.reset();
        loadProducts();
        alert("Producto actualizado ✅");
      });
    } else if (e.target.classList.contains("delete-btn")) {
      if (confirm("¿Seguro que quieres eliminar este producto?")) {
        await deleteDoc(doc(db, "products", id));
        loadProducts();
        alert("Producto eliminado ✅");
      }
    }
  });

  loadProducts();
});
