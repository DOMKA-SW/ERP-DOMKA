// js/register.js
import { registerUser } from "./auth.js";

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const companyId = document.getElementById("companyId").value || "default"; 
  const role = "user"; // por defecto, usuario normal

  try {
    const user = await registerUser(email, password, companyId, role);
    alert("Usuario registrado: " + user.email);
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Error en registro:", err);
    alert("Error: " + err.message);
  }
});
