// services/permissions.js - Sistema de permisos por rol

// Permisos por rol
const rolePermissions = {
    superadmin: {
        // Permisos globales
        view_superadmin_panel: true,
        manage_all_companies: true,
        manage_all_users: true,
        manage_system_settings: true,
        
        // Módulos
        access_module: (module) => true // Acceso a todos los módulos
    },
    admin: {
        // Permisos limitados a su empresa
        view_superadmin_panel: false,
        manage_company_users: true,
        manage_company_settings: true,
        
        // Módulos - depende de lo que tenga habilitado la empresa
        access_module: (module, company) => company.modules[module] || false
    },
    user: {
        // Permisos básicos
        view_superadmin_panel: false,
        manage_company_users: false,
        manage_company_settings: false,
        
        // Módulos - depende de permisos específicos y lo que tenga la empresa
        access_module: (module, company, userPermissions) => 
            (company.modules[module] || false) && (userPermissions[module] || false)
    }
};

// Verificar si un usuario tiene permiso para una acción
export function hasPermission(user, permission, module = null) {
    if (!user || !user.role) return false;
    
    const permissions = rolePermissions[user.role];
    if (!permissions) return false;
    
    // Permisos directos
    if (permissions[permission] !== undefined) {
        return permissions[permission];
    }
    
    // Permisos de módulo
    if (permission === 'access_module' && module) {
        return permissions.access_module(module, user.company, user.permissions);
    }
    
    return false;
}

// Filtrar navegación según permisos
export function filterNavigationByRole(navigationItems, user) {
    if (!user) return [];
    
    return navigationItems.filter(item => {
        // Superadmin ve todo
        if (user.role === 'superadmin') return true;
        
        // Para admin y user, verificar si el módulo está habilitado para su empresa
        if (user.company && user.company.modules) {
            return user.company.modules[item.module] || false;
        }
        
        return false;
    });
}
