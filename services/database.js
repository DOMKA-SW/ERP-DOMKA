import { 
    db, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc,
    query,
    where,
    getDocs 
} from './firebase-config.js';

// Crear documento de usuario en Firestore
export async function createUserDocument(userId, userData) {
    try {
        await setDoc(doc(db, "users", userId), userData);
        console.log("Documento de usuario creado con ID: ", userId);
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

// Crear documento de empresa en Firestore
export async function createCompanyDocument(companyName) {
    try {
        const docRef = await addDoc(collection(db, "companies"), {
            name: companyName,
            status: "active",
            createdAt: new Date(),
            plan: "free"
        });
        console.log("Documento de empresa creado con ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

// Obtener el rol del usuario
export async function getUserRole(userId) {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data().role;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (e) {
        console.error("Error getting document: ", e);
        throw e;
    }
}

// Obtener información de la empresa
export async function getCompanyData(companyId) {
    try {
        const docRef = doc(db, "companies", companyId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (e) {
        console.error("Error getting document: ", e);
        throw e;
    }
}
