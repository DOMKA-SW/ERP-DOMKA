// auth.js
import { auth, db } from "./firebase.js";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

/* -------------------- EXPORTS -------------------- */

// Registro de usuario + empresa
export async function registerUser(companyName, email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const companyId = "C" + Date.now();

  await setDoc(doc(db, "companies", companyId), {
    name: companyName,
    createdAt: serverTimestamp(),
    createdBy: user.uid
  });

  await setDoc(doc(db, "users", user.uid), {
    email,
    companyId,
    role: "admin",
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, "companies", companyId, "users", user.uid), {
    email,
    role: "admin",
    createdAt: serverTimestamp()
  });

  return user;
}

// Login
export async function loginUser(email, password, companyId) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) throw new Error("Usuario no encontrado");

  if (userDoc.data().companyId !== companyId) {
    await signOut(auth);
    throw new Error("El usuario no pertenece a esta empresa.");
  }

  return user;
}

// Logout
export async function logoutUser() {
  await signOut(auth);
}

// Obtener info de usuario actual
export function observeUser(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      callback(user, snap.exists() ? snap.data() : null);
    } else {
      callback(null, null);
    }
  });
}
