// services/config.js - Configuración de paths base
export const BASE_PATH = window.location.hostname === 'localhost' ? '' : '/ERP-DOMKA';

// Función para obtener paths correctos según el entorno
export function getModulePath(moduleName) {
    return `${BASE_PATH}/modules/${moduleName}/index.html`;
}

export function getServicePath(serviceName) {
    return `${BASE_PATH}/services/${serviceName}.js`;
}
