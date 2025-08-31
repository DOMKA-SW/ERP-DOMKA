// Mostrar mensajes de retroalimentación al usuario
export function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('authMessage');
    messageEl.textContent = message;
    messageEl.classList.remove('hidden', 'success', 'error');
    messageEl.classList.add(type);
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 5000);
}

// Redirigir según el rol del usuario
export async function redirectBasedOnRole(userId) {
    try {
        const role = await getUserRole(userId);
        
        if (role === 'superadmin') {
            window.location.href = '/modules/superadmin/';
        } else {
            window.location.href = '/modules/dashboard/';
        }
    } catch (error) {
        console.error('Error al redirigir usuario:', error);
        showMessage('Error al cargar tu perfil. Inténtalo de nuevo.', 'error');
    }
}

// Formatear fechas
export function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Validar email
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
