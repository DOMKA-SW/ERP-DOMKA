// dashboard.js - Módulo Dashboard para DOMKA ERP

// Importaciones de Firebase (versión modular)
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs,
    getCountFromServer,
    orderBy,
    startAt,
    endAt,
    Timestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Inicializar Firebase (ya inicializada en auth, pero la necesitamos aquí)
import { app } from "../modules/auth/auth.js";

// Inicializar servicios de Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Variables globales
let currentUser = null;
let empresaId = null;
let revenueChart = null;

// Inicializar el dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initDashboard);

// Inicialización del dashboard
function initDashboard() {
    checkAuthState();
    setupEventListeners();
}

// Configurar event listeners
function setupEventListeners() {
    // Botón para nueva cotización
    document.getElementById('new-quote-btn').addEventListener('click', () => {
        window.location.href = '../cotizaciones/cotizaciones.html';
    });
    
    // Event listener para el logout (se configura después de cargar el header)
    setTimeout(() => {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutUser);
        }
    }, 500);
}

// Verificar estado de autenticación
function checkAuthState() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            // Obtener información adicional del usuario desde Firestore
            await loadUserData(user.uid);
            // Cargar métricas del dashboard
            await loadDashboardMetrics();
            // Cargar gráfica de ingresos
            await loadRevenueChart();
        } else {
            // Usuario no autenticado, redirigir al login
            window.location.href = '../auth/auth.html';
        }
    });
}

// Cargar datos del usuario desde Firestore
async function loadUserData(userId) {
    try {
        // En una implementación real, obtendríamos los datos del usuario desde Firestore
        // Por ahora, usamos sessionStorage para obtener el empresa_id
        empresaId = sessionStorage.getItem('empresa_id');
        
        if (!empresaId) {
            // Si no está en sessionStorage, obtener de Firestore
            const userDoc = await getDoc(doc(db, "usuarios", userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                empresaId = userData.empresa_id;
                sessionStorage.setItem('empresa_id', empresaId);
                sessionStorage.setItem('user_role', userData.rol || 'usuario');
            }
        }
        
        // Actualizar el header con el nombre de la empresa
        updateHeaderCompanyName();
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        showError('Error al cargar información del usuario');
    }
}

// Actualizar el header con el nombre de la empresa
async function updateHeaderCompanyName() {
    try {
        if (!empresaId) return;
        
        // Obtener nombre de la empresa desde Firestore
        const empresaDoc = await getDoc(doc(db, "empresas", empresaId));
        if (empresaDoc.exists()) {
            const empresaData = empresaDoc.data();
            const companyNameElement = document.getElementById('company-name');
            if (companyNameElement) {
                companyNameElement.textContent = empresaData.nombre;
            }
        }
    } catch (error) {
        console.error('Error al obtener nombre de empresa:', error);
    }
}

// Cargar métricas del dashboard
async function loadDashboardMetrics() {
    if (!empresaId) return;
    
    try {
        // Obtener total de clientes
        const clientsCount = await getCollectionCount('clientes');
        document.getElementById('total-clients').textContent = clientsCount;
        
        // Obtener total de cotizaciones
        const quotesCount = await getCollectionCount('cotizaciones');
        document.getElementById('total-quotes').textContent = quotesCount;
        
        // Obtener total de cuentas de cobro
        const accountsCount = await getCollectionCount('cuentas');
        document.getElementById('total-accounts').textContent = accountsCount;
        
        // Obtener estado de inventario
        await loadInventoryStatus();
    } catch (error) {
        console.error('Error al cargar métricas:', error);
        showError('Error al cargar las métricas del dashboard');
    }
}

// Obtener el conteo de documentos en una colección filtrado por empresa_id
async function getCollectionCount(collectionName) {
    try {
        const q = query(
            collection(db, collectionName), 
            where("empresa_id", "==", empresaId)
        );
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    } catch (error) {
        console.error(`Error al contar documentos en ${collectionName}:`, error);
        return 0;
    }
}

// Cargar estado del inventario
async function loadInventoryStatus() {
    try {
        const q = query(
            collection(db, "inventario"), 
            where("empresa_id", "==", empresaId)
        );
        
        const querySnapshot = await getDocs(q);
        const totalProducts = querySnapshot.size;
        
        // Calcular productos con stock bajo (menos de 10 unidades)
        let lowStockCount = 0;
        querySnapshot.forEach(doc => {
            const product = doc.data();
            if (product.stock !== undefined && product.stock < 10) {
                lowStockCount++;
            }
        });
        
        // Actualizar UI
        const inventoryElement = document.getElementById('inventory-status');
        if (inventoryElement) {
            inventoryElement.textContent = `${totalProducts} productos`;
            
            // Mostrar advertencia si hay productos con stock bajo
            if (lowStockCount > 0) {
                inventoryElement.innerHTML += `<br><small style="color: var(--warning-color);">${lowStockCount} con stock bajo</small>`;
            }
        }
    } catch (error) {
        console.error('Error al cargar estado de inventario:', error);
        document.getElementById('inventory-status').textContent = "Error al cargar";
    }
}

// Cargar gráfica de ingresos
async function loadRevenueChart() {
    try {
        // Obtener fecha de hace 30 días
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Consultar cuentas de los últimos 30 días
        const q = query(
            collection(db, "cuentas"), 
            where("empresa_id", "==", empresaId),
            where("fecha_creacion", ">=", Timestamp.fromDate(thirtyDaysAgo)),
            where("estado", "==", "pagada"), // Solo cuentas pagadas
            orderBy("fecha_creacion")
        );
        
        const querySnapshot = await getDocs(q);
        
        // Preparar datos para la gráfica
        const revenueByDay = {};
        const dates = [];
        
        // Inicializar los últimos 30 días
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            revenueByDay[dateStr] = 0;
            dates.push(dateStr);
        }
        
        // Procesar cuentas pagadas
        querySnapshot.forEach(doc => {
            const cuenta = doc.data();
            if (cuenta.monto && cuenta.fecha_creacion) {
                const dateStr = cuenta.fecha_creacion.toDate().toISOString().split('T')[0];
                if (revenueByDay[dateStr] !== undefined) {
                    revenueByDay[dateStr] += cuenta.monto;
                }
            }
        });
        
        // Crear arrays para la gráfica
        const labels = dates.map(date => {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        });
        
        const data = dates.map(date => revenueByDay[date]);
        
        // Renderizar gráfica
        renderRevenueChart(labels, data);
    } catch (error) {
        console.error('Error al cargar datos para gráfica de ingresos:', error);
        // Renderizar gráfica vacía en caso de error
        renderRevenueChart([], []);
    }
}

// Renderizar gráfica de ingresos con Chart.js
function renderRevenueChart(labels, data) {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    
    // Destruir gráfica existente si hay una
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos diarios',
                data: data,
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Ingresos: $${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// Función para cerrar sesión
async function logoutUser() {
    try {
        await signOut(auth);
        // Limpiar sessionStorage
        sessionStorage.removeItem('empresa_id');
        sessionStorage.removeItem('user_role');
        // Redirigir a auth
        window.location.href = '../auth/auth.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showError('Error al cerrar sesión');
    }
}

// Mostrar mensaje de error
function showError(message) {
    // Crear elemento de error si no existe
    let errorElement = document.getElementById('dashboard-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'dashboard-error';
        errorElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background-color: var(--danger-color);
            color: white;
            border-radius: var(--border-radius);
            z-index: 1000;
            box-shadow: var(--box-shadow);
        `;
        document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Exportar funciones para uso en otros módulos
window.dashboardModule = {
    logoutUser: logoutUser
};