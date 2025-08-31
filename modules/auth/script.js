// Importar configuración de Firebase
import { 
    auth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail,
    onAuthStateChanged 
} from '../../services/firebase-config.js';
import { 
    createUserDocument, 
    createCompanyDocument, 
    getUserRole 
} from '../../services/database.js';
import { showMessage, redirectBasedOnRole } from '../../services/helpers.js';

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const forgotPasswordBtn = document.getElementById('forgotPassword');
const backToLoginBtn = document.getElementById('backToLogin');
const togglePasswordBtn = document.getElementById('togglePassword');
const toggleRegisterPasswordBtn = document.getElementById('toggleRegisterPassword');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const resetBtn = document.getElementById('resetBtn');

// Estado de la aplicación
let isProcessing = false;

// Inicializar la aplicación
function init() {
    setupEventListeners();
    checkAuthState();
}

// Configurar event listeners
function setupEventListeners() {
    // Alternar entre formularios
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(registerForm);
        hideForms([loginForm, resetPasswordForm]);
    });
    
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(loginForm);
        hideForms([registerForm, resetPasswordForm]);
    });
    
    forgotPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(resetPasswordForm);
        hideForms([loginForm, registerForm]);
    });
    
    backToLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(loginForm);
        hideForms([registerForm, resetPasswordForm]);
    });
    
    // Alternar visibilidad de contraseñas
    togglePasswordBtn.addEventListener('click', () => {
        togglePasswordVisibility('password', togglePasswordBtn);
    });
    
    toggleRegisterPasswordBtn.addEventListener('click', () => {
        togglePasswordVisibility('registerPassword', toggleRegisterPasswordBtn);
    });
    
    // Envío de formularios
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    resetPasswordForm.addEventListener('submit', handlePasswordReset);
}

// Verificar estado de autenticación
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuario autenticado, redirigir según rol
            redirectUserBasedOnRole(user.uid);
        }
    });
}

// Manejar inicio de sesión
async function handleLogin(e) {
    e.preventDefault();
    
    if (isProcessing) return;
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Por favor, completa todos los campos', 'error');
        return;
    }
    
    isProcessing = true;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Iniciando sesión...';
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Redirigir según el rol del usuario
        redirectUserBasedOnRole(user.uid);
        
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        let errorMessage = 'Error al iniciar sesión';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'El correo electrónico no es válido';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Esta cuenta ha sido deshabilitada';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No existe una cuenta con este correo electrónico';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta';
                break;
            default:
                errorMessage = 'Error al iniciar sesión. Inténtalo de nuevo más tarde.';
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        isProcessing = false;
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar Sesión';
    }
}

// Manejar registro de usuario
async function handleRegister(e) {
    e.preventDefault();
    
    if (isProcessing) return;
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const companyName = document.getElementById('companyName').value;
    
    // Validaciones
    if (!name || !email || !password || !confirmPassword || !companyName) {
        showMessage('Por favor, completa todos los campos', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    isProcessing = true;
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creando cuenta...';
    
    try {
        // Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Crear documento de empresa en Firestore
        const companyId = await createCompanyDocument(companyName);
        
        // Crear documento de usuario en Firestore
        await createUserDocument(user.uid, {
            name,
            email,
            role: 'admin', // El creador de la empresa es admin por defecto
            companyId,
            createdAt: new Date()
        });
        
        showMessage('Cuenta creada exitosamente. Redirigiendo...', 'success');
        
        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
            redirectBasedOnRole(user.uid);
        }, 1500);
        
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        let errorMessage = 'Error al crear la cuenta';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este correo electrónico ya está en uso';
                break;
            case 'auth/invalid-email':
                errorMessage = 'El correo electrónico no es válido';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña es demasiado débil';
                break;
            default:
                errorMessage = 'Error al crear la cuenta. Inténtalo de nuevo más tarde.';
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        isProcessing = false;
        registerBtn.disabled = false;
        registerBtn.textContent = 'Crear Cuenta';
    }
}

// Manejar recuperación de contraseña
async function handlePasswordReset(e) {
    e.preventDefault();
    
    if (isProcessing) return;
    
    const email = document.getElementById('resetEmail').value;
    
    if (!email) {
        showMessage('Por favor, ingresa tu correo electrónico', 'error');
        return;
    }
    
    isProcessing = true;
    resetBtn.disabled = true;
    resetBtn.textContent = 'Enviando...';
    
    try {
        await sendPasswordResetEmail(auth, email);
        showMessage('Se ha enviado un enlace de recuperación a tu correo electrónico', 'success');
        
        // Volver al formulario de login después de un breve delay
        setTimeout(() => {
            showForm(loginForm);
            hideForms([registerForm, resetPasswordForm]);
        }, 2000);
        
    } catch (error) {
        console.error('Error al enviar email de recuperación:', error);
        let errorMessage = 'Error al enviar el email de recuperación';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'El correo electrónico no es válido';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No existe una cuenta con este correo electrónico';
                break;
            default:
                errorMessage = 'Error al enviar el email de recuperación. Inténtalo de nuevo más tarde.';
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        isProcessing = false;
        resetBtn.disabled = false;
        resetBtn.textContent = 'Enviar enlace de recuperación';
    }
}

// Utilidades de UI
function showForm(form) {
    form.classList.remove('hidden');
}

function hideForms(forms) {
    forms.forEach(form => form.classList.add('hidden'));
}

function togglePasswordVisibility(inputId, button) {
    const passwordInput = document.getElementById(inputId);
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Cambiar el emoji del botón
    button.textContent = type === 'password' ? '👁️' : '🔒';
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);


