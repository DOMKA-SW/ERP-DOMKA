import { registerUser } from "./auth.js";

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const companyName = document.getElementById("companyName").value.trim();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const errorMsg = document.getElementById("errorMsg");

  if (password !== confirmPassword) {
    errorMsg.textContent = "Las contraseñas no coinciden.";
    return;
  }

  try {
    await registerUser(companyName, email, password);
    window.location.href = "dashboard.html";
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});
