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

// Mostrar notificación
export function showNotification(message, type = 'info') {
    // Crear elemento de notificación si no existe
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '10000';
        document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Estilos para la notificación
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            margin-bottom: 10px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            animation: slideIn 0.3s ease;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .notification.success { background: #4caf50; }
        .notification.error { background: #f44336; }
        .notification.info { background: #2196f3; }
        .notification-warning { background: #ff9800; }
        .notification-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            margin-left: 15px;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    
    if (!document.getElementById('notification-styles')) {
        style.id = 'notification-styles';
        document.head.appendChild(style);
    }
    
    // Cerrar notificación al hacer clic en el botón
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Formatear moneda
export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

// Verificar si el usuario es superadmin
export async function isSuperAdmin(userId) {
    try {
        const userData = await getUserData(userId);
        return userData.role === 'superadmin';
    } catch (error) {
        console.error('Error checking user role:', error);
        return false;
    }
}
