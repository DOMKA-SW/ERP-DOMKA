import { 
    auth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    onAuthStateChanged,
    signOut 
} from './firebase-config.js';
import { getUserRole, getUserData } from './database.js';

// Función para redirigir según el rol
export async function redirectBasedOnRole(userId) {
    try {
        const role = await getUserRole(userId);
        
        if (role === 'superadmin') {
            window.location.href = '../../modules/superadmin/index.html';
        } else {
            window.location.href = '../../modules/dashboard/index.html';
        }
    } catch (error) {
        console.error('Error al redirigir usuario:', error);
        // Redirigir al dashboard por defecto en caso de error
        window.location.href = '../../modules/dashboard/index.html';
    }
}

// Exportar todas las funciones de autenticación
export {
    auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut,
    getUserData
};
