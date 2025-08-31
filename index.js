// index.js - Funcionalidad para la página principal de DOMKA ERP

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar los event listeners para los botones
    setupEventListeners();
    
    // Añadir smooth scrolling para los enlaces de navegación
    setupSmoothScrolling();
});

// Configurar event listeners para los botones
function setupEventListeners() {
    // Botones de inicio de sesión
    const loginBtn = document.getElementById('login-btn');
    const loginNavBtn = document.getElementById('login-nav-btn');
    
    // Botones de registro
    const registerBtn = document.getElementById('register-btn');
    const ctaRegisterBtn = document.getElementById('cta-register-btn');
    
    // Redirigir al módulo de autenticación
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/ERP-DOMKA/modules/auth/index.html';
        });
    }
    
    if (loginNavBtn) {
        loginNavBtn.addEventListener('click', () => {
            window.location.href = '/ERP-DOMKA/modules/auth/index.html';
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            window.location.href = '/ERP-DOMKA/modules/auth/index.html#register';
        });
    }
    
    if (ctaRegisterBtn) {
        ctaRegisterBtn.addEventListener('click', () => {
            window.location.href = '/ERP-DOMKA/modules/auth/index.html#register';
        });
    }
}

// Configurar smooth scrolling para enlaces internos
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Calcular la posición considerando el header fijo
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Efecto de revelación gradual para elementos al hacer scroll
function setupScrollReveal() {
    const revealElements = document.querySelectorAll('.feature-card, .cta');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    revealElements.forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Inicializar efectos cuando la página esté cargada
window.addEventListener('load', function() {
    setupScrollReveal();
});

// Función para verificar si el usuario está autenticado y redirigir
function checkAuthState() {
    // Esta función se conectaría con Firebase en una implementación real
    // Por ahora es un placeholder
    console.log('Verificando estado de autenticación...');
}

// Exportar funciones para uso global (si es necesario)
window.DOMKA = {
    navigateToAuth: function() {
        window.location.href = '/modules/auth/index.html';
    },
    navigateToRegister: function() {
        window.location.href = '/modules/auth/index.html#register';
    }
};
