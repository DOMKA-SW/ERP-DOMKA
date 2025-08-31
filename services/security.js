// services/security.js - Verificaciones de seguridad multi-tenant

import { auth } from './auth.js';
import { getUserData } from './database.js';
import { doc, getDoc, where } from './firebase-config.js';

// Verificar que el usuario puede acceder a un recurso de su empresa
export async function checkResourceAccess(resourceCompanyId) {
    try {
        const user = auth.currentUser;
        if (!user) return false;
        
        const userData = await getUserData(user.uid);
        
        // Superadmin puede acceder a todo
        if (userData.role === 'superadmin') return true;
        
        // Usuarios normales solo pueden acceder a recursos de su empresa
        return userData.companyId === resourceCompanyId;
    } catch (error) {
        console.error('Error checking resource access:', error);
        return false;
    }
}

// Filtrar automáticamente por companyId en las consultas
export function withCompanyFilter(queryConstraints, user) {
    // Superadmin no tiene filtro por companyId (ve todo)
    if (user.role === 'superadmin') {
        return queryConstraints;
    }
    
    // Usuarios normales solo ven datos de su empresa
    return [
        ...queryConstraints,
        where("companyId", "==", user.companyId)
    ];
}

// Verificar ownership antes de operaciones CRUD
export async function validateOwnership(documentId, collectionName) {
    try {
        const user = auth.currentUser;
        if (!user) return false;
        
        const userData = await getUserData(user.uid);
        
        // Superadmin puede hacer cualquier operación
        if (userData.role === 'superadmin') return true;
        
        // Verificar que el documento pertenece a la empresa del usuario
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const documentData = docSnap.data();
            return documentData.companyId === userData.companyId;
        }
        
        return false;
    } catch (error) {
        console.error('Error validating ownership:', error);
        return false;
    }
}
