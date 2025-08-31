import { loginUser } from "./auth.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const companyId = document.getElementById("companyId").value;
  const errorMsg = document.getElementById("errorMsg");

  try {
    await loginUser(email, password, companyId);
    window.location.href = "dashboard.html";
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});
