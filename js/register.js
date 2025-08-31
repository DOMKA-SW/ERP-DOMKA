// js/register.js
import { registerUser } from "./auth.js";

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const companyId = document.getElementById("companyId").value;
  await registerUser(email, password, companyId, name);
});
