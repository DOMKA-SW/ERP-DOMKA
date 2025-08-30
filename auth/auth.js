/**
 * Módulo de Autenticación para DOMKA ERP
 * Controla las pantallas de login, registro y recuperación de contraseña
 * Preparado para integración con Firebase Authentication
 */

// Elementos del DOM
const screens = {
    login: document.getElementById('login-screen'),
    register: document.getElementById('register-screen'),
    recovery: document.getElementById('recovery-screen')
};

const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form'),
    recovery: document.getElementById('recovery-form')
};

// Elementos de navegación
const gotoRegister = document.getElementById('goto-register');
const gotoRecovery = document.getElementById('goto-recovery');
const gotoLoginFromRegister = document.getElementById('goto-login-from-register');
const gotoLoginFromRecovery = document.getElementById('goto-login-from-recovery');

// Inicialización del módulo
document.addEventListener('DOMContentLoaded', initAuthModule);

/**
 * Inicializa el módulo de autenticación
 * Configura los event listeners para formularios y navegación
 */
function initAuthModule() {
    console.log('Inicializando módulo de autenticación DOMKA');
    
    // Configurar navegación entre pantallas
    setupNavigation();
    
    // Configurar manejo de formularios
    setupForms();
}

/**
 * Configura los event listeners para la navegación entre pantallas
 */
function setupNavigation() {
    // Navegación desde login
    gotoRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen('register');
    });
    
    gotoRecovery.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen('recovery');
    });
    
    // Navegación desde registro
    gotoLoginFromRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen('login');
    });
    
    // Navegación desde recuperación
    gotoLoginFromRecovery.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen('login');
    });
}

/**
 * Configura los event listeners para el envío de formularios
 */
function setupForms() {
    // Formulario de login
    forms.login.addEventListener('submit', handleLogin);
    
    // Formulario de registro
    forms.register.addEventListener('submit', handleRegister);
    
    // Formulario de recuperación
    forms.recovery.addEventListener('submit', handleRecovery);
}

/**
 * Muestra la pantalla especificada y oculta las demás
 * @param {string} screenName - Nombre de la pantalla a mostrar ('login', 'register', 'recovery')
 */
function showScreen(screenName) {
    // Oculta todas las pantallas
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Muestra la pantalla solicitada
    screens[screenName].classList.add('active');
}

/**
 * Maneja el envío del formulario de login
 * @param {Event} e - Evento de envío del formulario
 */
function handleLogin(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Validación básica
    if (!email || !password) {
        showMessage('Por favor, completa todos los campos', 'error');
        return;
    }
    
    // Aquí se integrará con Firebase Authentication
    console.log('Intentando login con:', { email, password });
    
    // Simulación de proceso de autenticación
    simulateAuthProcess('login')
        .then(() => {
            showMessage('Inicio de sesión exitoso. Redirigiendo...', 'success');
            // En una implementación real, redirigiríamos al dashboard
        })
        .catch(error => {
            showMessage('Error en el inicio de sesión: ' + error.message, 'error');
        });
}

/**
 * Maneja el envío del formulario de registro
 * @param {Event} e - Evento de envío del formulario
 */
function handleRegister(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    
    // Validación básica
    if (!name || !email || !password || !role) {
        showMessage('Por favor, completa todos los campos', 'error');
        return;
    }
    
    // Validar fortaleza de contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Aquí se integrará con Firebase Authentication y Firestore
    console.log('Intentando registro con:', { name, email, password, role });
    
    // Simulación de proceso de registro
    simulateAuthProcess('register')
        .then(() => {
            showMessage('Registro exitoso. Por favor, inicia sesión.', 'success');
            
            // Limpiar formulario y volver al login después de un breve delay
            setTimeout(() => {
                forms.register.reset();
                showScreen('login');
            }, 2000);
        })
        .catch(error => {
            showMessage('Error en el registro: ' + error.message, 'error');
        });
}

/**
 * Maneja el envío del formulario de recuperación de contraseña
 * @param {Event} e - Evento de envío del formulario
 */
function handleRecovery(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const email = document.getElementById('recovery-email').value;
    
    // Validación básica
    if (!email) {
        showMessage('Por favor, ingresa tu correo electrónico', 'error');
        return;
    }
    
    // Aquí se integrará con Firebase Authentication
    console.log('Solicitando recuperación para:', email);
    
    // Simulación de proceso de recuperación
    simulateAuthProcess('recovery')
        .then(() => {
            showMessage('Se ha enviado un enlace de recuperación a tu correo', 'success');
            
            // Limpiar formulario y volver al login después de un breve delay
            setTimeout(() => {
                forms.recovery.reset();
                showScreen('login');
            }, 2000);
        })
        .catch(error => {
            showMessage('Error al procesar la solicitud: ' + error.message, 'error');
        });
}

/**
 * Simula un proceso de autenticación (para demostración)
 * @param {string} action - Tipo de acción ('login', 'register', 'recovery')
 * @returns {Promise} Promesa que se resuelve después de un delay
 */
function simulateAuthProcess(action) {
    return new Promise((resolve, reject) => {
        // Simula un delay de red
        setTimeout(() => {
            // En una implementación real, aquí se conectaría con Firebase
            // Por ahora, siempre resolvemos exitosamente para demostración
            resolve({ action, success: true });
            
            // Para simular errores aleatorios (quitar en producción):
            // if (Math.random() > 0.7) {
            //   reject(new Error('Error de conexión. Intenta nuevamente.'));
            // } else {
            //   resolve({ action, success: true });
            // }
        }, 1000);
    });
}

/**
 * Muestra un mensaje de estado al usuario
 * @param {string} text - Texto del mensaje
 * @param {string} type - Tipo de mensaje ('success' o 'error')
 */
function showMessage(text, type) {
    // Crear elemento de mensaje si no existe
    let messageEl = document.querySelector('.auth-message');
    
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'auth-message';
        
        // Insertar después del header
        const authHeader = document.querySelector('.auth-header');
        authHeader.parentNode.insertBefore(messageEl, authHeader.nextSibling);
    }
    
    // Configurar y mostrar el mensaje
    messageEl.textContent = text;
    messageEl.className = `auth-message ${type}`;
    messageEl.style.display = 'block';
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Exportar funciones para uso externo si es necesario
export { initAuthModule, showScreen, handleLogin, handleRegister, handleRecovery };
