// index.js - Script para la página principal de DOMKA ERP

// Importaciones de Firebase (versión modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Configuración de Firebase (debes reemplazar con tu configuración)
const firebaseConfig = {
    apiKey: "AIzaSyDyvK3PJK5gwZBTD3R8vQl-TPK7jo66ET4",
    authDomain: "domka-erp.firebaseapp.com",
    projectId: "domka-erp",
    storageBucket: "domka-erp.firebasestorage.app",
    messagingSenderId: "610583027018",
    appId: "1:610583027018:web:46f6f25e532bec491e35b3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elementos del DOM
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginNavBtn = document.getElementById('login-nav-btn');
const ctaRegisterBtn = document.getElementById('cta-register-btn');

// Inicializar la página
document.addEventListener('DOMContentLoaded', initPage);

function initPage() {
    setupEventListeners();
    checkAuthState();
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de inicio de sesión en el hero
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            redirectToAuth('login');
        });
    }
    
    // Botón de registro en el hero
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            redirectToAuth('register');
        });
    }
    
    // Botón de inicio de sesión en la navegación
    if (loginNavBtn) {
        loginNavBtn.addEventListener('click', () => {
            redirectToAuth('login');
        });
    }
    
    // Botón de registro en el CTA
    if (ctaRegisterBtn) {
        ctaRegisterBtn.addEventListener('click', () => {
            redirectToAuth('register');
        });
    }
}

// Redirigir a la página de autenticación
function redirectToAuth(mode = 'login') {
    const authUrl = './modules/auth/index.html';
    
    if (mode === 'register') {
        // Almacenar el modo de registro en sessionStorage
        sessionStorage.setItem('auth_mode', 'register');
    } else {
        sessionStorage.setItem('auth_mode', 'login');
    }
    
    window.location.href = authUrl;
}

// Verificar estado de autenticación
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuario autenticado, redirigir al dashboard
            window.location.href = './modules/dashboard/index.html';
        }
        // Si no hay usuario autenticado, permanecer en la página principal
    });
}

// Cargar imágenes temporales si no existen
function loadPlaceholderImages() {
    // Esta función podría crear imágenes temporales si no existen
    // Para una implementación real, deberías tener estas imágenes en tu carpeta assets
}

// Smooth scrolling para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Efectos de animación al hacer scroll
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observar elementos para animar
    document.querySelectorAll('.feature-card, .cta').forEach(el => {
        observer.observe(el);
    });
}

// Inicializar animaciones cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}
