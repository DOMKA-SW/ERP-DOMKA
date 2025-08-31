import { loginUser } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");

  if (!loginForm) return; // seguridad extra

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const companyId = document.getElementById("companyId").value;

    try {
      await loginUser(email, password, companyId);
      window.location.href = "dashboard.html";
    } catch (err) {
      errorMsg.textContent = err.message;
    }
  });
});
