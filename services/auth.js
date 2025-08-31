import { 
    auth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    onAuthStateChanged,
    signOut 
} from './firebase-config.js';
import { getUserRole, getUserData } from './database.js';

// Función para redirigir según el rol con mejor manejo de errores
export async function redirectBasedOnRole(userId) {
    try {
        const role = await getUserRole(userId);
        console.log("Rol detectado:", role);
        
        // Pequeña pausa para asegurar que todo se cargue correctamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (role === 'superadmin') {
            window.location.href = '/modules/superadmin/index.html';
        } else {
            window.location.href = '/modules/dashboard/index.html';
        }
    } catch (error) {
        console.error('Error al redirigir usuario:', error);
        
        // Redirigir al dashboard por defecto después de 2 segundos
        setTimeout(() => {
            window.location.href = '/modules/dashboard/index.html';
        }, 2000);
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
