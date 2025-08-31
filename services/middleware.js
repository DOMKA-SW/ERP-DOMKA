// services/middleware.js - Middleware para verificación de permisos

import { hasPermission } from './permissions.js';
import { showNotification } from './helpers.js';

// Verificar permisos antes de cargar un módulo
export async function checkModulePermission(moduleName) {
    try {
        const { auth } = await import('./auth.js');
        const { getUserData } = await import('./database.js');
        
        const user = auth.currentUser;
        if (!user) return false;
        
        const userData = await getUserData(user.uid);
        return hasPermission(userData, 'access_module', moduleName);
    } catch (error) {
        console.error('Error checking module permission:', error);
        return false;
    }
}

// Redirigir si no tiene permisos
export function redirectIfNoPermission(moduleName, user) {
    if (!hasPermission(user, 'access_module', moduleName)) {
        showNotification('No tienes permisos para acceder a este módulo', 'error');
        window.location.href = '/modules/dashboard/index.html';
        return true;
    }
    return false;
}
