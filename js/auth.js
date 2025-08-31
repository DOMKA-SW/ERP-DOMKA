import { auth, db } from "./firebase.js";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// LOGIN
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const companyId = document.getElementById("companyId").value;
    const errorMsg = document.getElementById("errorMsg");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardamos companyId en Firestore
      await setDoc(doc(db, "userCompanies", user.uid), {
        companyId,
        email
      });

      window.location.href = "dashboard.html";
    } catch (error) {
      errorMsg.textContent = "Error: " + error.message;
    }
  });
}

// DASHBOARD
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

// VERIFICAR SESIÓN
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userInfo = document.getElementById("userInfo");
    if (userInfo) {
      const docSnap = await getDoc(doc(db, "userCompanies", user.uid));
      let companyId = docSnap.exists() ? docSnap.data().companyId : "N/A";
      userInfo.textContent = `Usuario: ${user.email} | Empresa: ${companyId}`;
    }
  } else {
    if (!window.location.href.includes("login.html")) {
      window.location.href = "login.html";
    }
  }
});
