// auth.js - Módulo de autenticación para DOMKA ERP

// Importaciones de Firebase (versión modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Configuración de Firebase (debes reemplazar con tu configuración)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const loginFormContainer = document.getElementById('login-form');
const registerFormContainer = document.getElementById('register-form');
const companyOptionRadios = document.getElementsByName('companyOption');
const newCompanyGroup = document.getElementById('newCompanyGroup');
const existingCompanyGroup = document.getElementById('existingCompanyGroup');
const authAlert = document.getElementById('authAlert');
const alertMessage = document.getElementById('alertMessage');
const closeAlertBtn = document.getElementById('closeAlert');

// Variables globales
let currentUser = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', initAuthModule);

// Inicialización del módulo de autenticación
function initAuthModule() {
    setupEventListeners();
    checkAuthState();
}

// Configurar event listeners
function setupEventListeners() {
    // Alternar entre formularios de login y registro
    showRegisterBtn.addEventListener('click', showRegisterForm);
    showLoginBtn.addEventListener('click', showLoginForm);
    
    // Envío de formularios
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Cambio entre opciones de empresa
    companyOptionRadios.forEach(radio => {
        radio.addEventListener('change', toggleCompanyOption);
    });
    
    // Cerrar alerta
    closeAlertBtn.addEventListener('click', hideAlert);
}

// Verificar estado de autenticación
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuario autenticado, redirigir al dashboard
            currentUser = user;
            window.location.href = '../dashboard/dashboard.html';
        } else {
            // Usuario no autenticado, mostrar formulario de login
            currentUser = null;
            showLoginForm();
        }
    });
}

// Mostrar formulario de registro
function showRegisterForm(e) {
    if (e) e.preventDefault();
    loginFormContainer.classList.remove('active');
    registerFormContainer.classList.add('active');
}

// Mostrar formulario de login
function showLoginForm(e) {
    if (e) e.preventDefault();
    registerFormContainer.classList.remove('active');
    loginFormContainer.classList.add('active');
}

// Alternar entre opciones de empresa (nueva/existente)
function toggleCompanyOption() {
    const selectedOption = document.querySelector('input[name="companyOption"]:checked').value;
    
    if (selectedOption === 'new') {
        newCompanyGroup.classList.remove('hidden');
        existingCompanyGroup.classList.add('hidden');
    } else {
        newCompanyGroup.classList.add('hidden');
        existingCompanyGroup.classList.remove('hidden');
    }
}

// Manejar inicio de sesión
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        showLoading(true);
        await loginUser(email, password);
        showAlert('Inicio de sesión exitoso', 'success');
    } catch (error) {
        console.error('Error en inicio de sesión:', error);
        showAlert(getAuthErrorMessage(error.code), 'error');
    } finally {
        showLoading(false);
    }
}

// Manejar registro de usuario
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const companyOption = document.querySelector('input[name="companyOption"]:checked').value;
    
    try {
        showLoading(true);
        
        let companyId;
        let userRole = 'usuario';
        
        if (companyOption === 'new') {
            // Crear nueva empresa
            const companyName = document.getElementById('companyName').value;
            if (!companyName) {
                throw new Error('El nombre de la empresa es requerido');
            }
            
            companyId = await createNewCompany(companyName);
            userRole = 'admin'; // El creador de la empresa es admin
        } else {
            // Unirse a empresa existente
            const companyCode = document.getElementById('companyCode').value;
            if (!companyCode) {
                throw new Error('El código de empresa es requerido');
            }
            
            companyId = await joinExistingCompany(companyCode);
        }
        
        // Registrar usuario
        await registerUser(name, email, password, companyId, userRole);
        showAlert('Usuario registrado correctamente', 'success');
        
        // Iniciar sesión automáticamente después del registro
        await loginUser(email, password);
    } catch (error) {
        console.error('Error en registro:', error);
        showAlert(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Función para registrar usuario en Firebase Auth y Firestore
async function registerUser(name, email, password, companyId, role = 'usuario') {
    try {
        // Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Guardar información adicional en Firestore
        await setDoc(doc(db, "usuarios", user.uid), {
            uid: user.uid,
            nombre: name,
            email: email,
            empresa_id: companyId,
            rol: role,
            fecha_creacion: new Date()
        });
        
        return user;
    } catch (error) {
        throw error;
    }
}

// Función para iniciar sesión
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Función para cerrar sesión (exportada para uso en otros módulos)
window.logoutUser = async function() {
    try {
        await signOut(auth);
        window.location.href = '../auth/auth.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Crear nueva empresa en Firestore
async function createNewCompany(companyName) {
    try {
        // Generar ID único para la empresa
        const companyId = generateCompanyId(companyName);
        
        // Guardar empresa en Firestore
        const companyRef = doc(db, "empresas", companyId);
        await setDoc(companyRef, {
            id: companyId,
            nombre: companyName,
            fecha_creacion: new Date(),
            estado: 'activa'
        });
        
        return companyId;
    } catch (error) {
        throw error;
    }
}

// Unirse a empresa existente
async function joinExistingCompany(companyCode) {
    try {
        // Verificar que la empresa existe
        const companyRef = doc(db, "empresas", companyCode);
        const companyDoc = await getDoc(companyRef);
        
        if (!companyDoc.exists()) {
            throw new Error('El código de empresa no es válido');
        }
        
        return companyCode;
    } catch (error) {
        throw error;
    }
}

// Generar ID único para empresa
function generateCompanyId(companyName) {
    // Crear un ID basado en el nombre de la empresa y un timestamp
    const timestamp = Date.now().toString(36);
    const nameAbbr = companyName
        .replace(/\s+/g, '')
        .substring(0, 3)
        .toLowerCase();
    
    return `${nameAbbr}_${timestamp}`;
}

// Mostrar alerta
function showAlert(message, type = 'info') {
    alertMessage.textContent = message;
    authAlert.className = `auth-alert ${type}`;
    authAlert.classList.remove('hidden');
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        hideAlert();
    }, 5000);
}

// Ocultar alerta
function hideAlert() {
    authAlert.classList.add('hidden');
}

// Mostrar/ocultar estado de carga
function showLoading(show) {
    const buttons = document.querySelectorAll('button[type="submit"]');
    
    buttons.forEach(button => {
        if (show) {
            button.disabled = true;
            button.textContent = 'Procesando...';
        } else {
            button.disabled = false;
            button.textContent = button === loginForm.querySelector('button') ? 'Ingresar' : 'Registrarse';
        }
    });
}

// Obtener mensaje de error legible para el usuario
function getAuthErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': 'El correo electrónico no tiene un formato válido',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
        'auth/wrong-password': 'La contraseña es incorrecta',
        'auth/email-already-in-use': 'Este correo electrónico ya está en uso',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/operation-not-allowed': 'La operación no está permitida',
        'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde'
    };
    
    return errorMessages[errorCode] || 'Ocurrió un error inesperado';
}

// Exportar funciones para uso en otros módulos
window.authModule = {
    getCurrentUser: () => currentUser,
    logoutUser: window.logoutUser
};