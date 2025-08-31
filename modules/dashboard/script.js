// Verificar permisos antes de cargar el módulo
import { checkModulePermission } from '../../services/middleware.js';

async function init() {
    // Verificar permisos para este módulo
    const hasAccess = await checkModulePermission('clientes');
    if (!hasAccess) {
        window.location.href = '/modules/dashboard/index.html';
        return;
    }
    
    // El resto de la inicialización...
    setupEventListeners();
    loadClientesData();
}

// Importar servicios y configuraciones
import { 
    auth, 
    signOut, 
    onAuthStateChanged 
} from '../../services/auth.js'; // Cambiado a auth.js
import { 
    getUserData, 
    getCompanyData, 
    getDashboardMetrics,
    getRecentQuotes,
    getRecentActivity,
    getUserTasks,
    createQuickQuote,
    createTask 
} from '../../services/database.js';
import { showNotification, formatCurrency, formatDate } from '../../services/helpers.js';

// Elementos del DOM
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const userNameElement = document.getElementById('userName');
const userRoleElement = document.getElementById('userRole');
const userAvatarElement = document.getElementById('userAvatar');
const welcomeTitleElement = document.getElementById('welcomeTitle');
const welcomeMessageElement = document.getElementById('welcomeMessage');
const logoutBtn = document.getElementById('logoutBtn');
const quickActionBtn = document.getElementById('quickActionBtn');

// Elementos de métricas
const clientsCountElement = document.getElementById('clientsCount');
const quotesCountElement = document.getElementById('quotesCount');
const inventoryItemsElement = document.getElementById('inventoryItems');
const revenueAmountElement = document.getElementById('revenueAmount');

// Elementos de gráficos y listas
const recentQuotesList = document.getElementById('recentQuotes');
const taskList = document.getElementById('taskList');
const activityFeed = document.getElementById('activityFeed');

// Modales
const quickQuoteModal = document.getElementById('quickQuoteModal');
const addTaskModal = document.getElementById('addTaskModal');
const closeQuoteModal = document.getElementById('closeQuoteModal');
const cancelQuote = document.getElementById('cancelQuote');
const closeTaskModal = document.getElementById('closeTaskModal');
const cancelTask = document.getElementById('cancelTask');
const addTaskBtn = document.getElementById('addTaskBtn');

// Formularios
const quickQuoteForm = document.getElementById('quickQuoteForm');
const addTaskForm = document.getElementById('addTaskForm');

// Variables globales
let revenueChart = null;
let currentUser = null;
let currentCompany = null;

// Inicializar la aplicación
function init() {
    setupEventListeners();
    checkAuthState();
    loadNavigation();
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    sidebarToggle.addEventListener('click', toggleSidebar);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Navegación entre módulos
    document.querySelectorAll('[data-module]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const module = link.getAttribute('data-module');
            navigateToModule(module);
        });
    });
    
    // Acciones rápidas
    quickActionBtn.addEventListener('click', () => {
        showModal(quickQuoteModal);
        loadClientsForQuote();
    });
    
    addTaskBtn.addEventListener('click', () => {
        showModal(addTaskModal);
    });
    
    // Cerrar modales - Corrección aplicada aquí
    closeQuoteModal.addEventListener('click', () => hideModal(quickQuoteModal));
    cancelQuote.addEventListener('click', () => hideModal(quickQuoteModal));
    closeTaskModal.addEventListener('click', () => hideModal(addTaskModal));
    cancelTask.addEventListener('click', () => hideModal(addTaskModal));
    
    // Envío de formularios - Corrección aplicada aquí
    quickQuoteForm.addEventListener('submit', handleQuickQuote);
    addTaskForm.addEventListener('submit', handleAddTask); // Cambiado de 'click' a 'submit'
    
    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (e.target === quickQuoteModal) hideModal(quickQuoteModal);
        if (e.target === addTaskModal) hideModal(addTaskModal);
    });

    // Cerrar modales con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideModal(quickQuoteModal);
            hideModal(addTaskModal);
        }
    });
}

// Verificar estado de autenticación
function checkAuthState() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData(user.uid);
            await loadCompanyData();
            await loadDashboardData();
        } else {
            // Usuario no autenticado, redirigir al login
            window.location.href = '../../modules/auth/index.html';
        }
    });
}

// Cargar datos del usuario
async function loadUserData(userId) {
    try {
        const userData = await getUserData(userId);
        
        // Actualizar UI con datos del usuario
        userNameElement.textContent = userData.name;
        userRoleElement.textContent = userData.role;
        userAvatarElement.querySelector('span').textContent = userData.name.charAt(0).toUpperCase();
        
        // Personalizar mensaje de bienvenida
        welcomeTitleElement.textContent = `Bienvenido${userData.name ? `, ${userData.name}` : ''}`;
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        showNotification('Error al cargar datos del usuario', 'error');
    }
}

// Cargar datos de la empresa
async function loadCompanyData() {
    try {
        if (!currentUser) return;
        
        const userData = await getUserData(currentUser.uid);
        if (userData.companyId) {
            currentCompany = await getCompanyData(userData.companyId);
            welcomeMessageElement.textContent = `Resumen de ${currentCompany.name}`;
        }
    } catch (error) {
        console.error('Error al cargar datos de la empresa:', error);
    }
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        if (!currentUser) return;
        
        const userData = await getUserData(currentUser.uid);
        if (!userData.companyId) return;
        
        // Cargar métricas
        const metrics = await getDashboardMetrics(userData.companyId);
        updateMetrics(metrics);
        
        // Cargar cotizaciones recientes
        const quotes = await getRecentQuotes(userData.companyId);
        displayRecentQuotes(quotes);
        
        // Cargar tareas
        const tasks = await getUserTasks(currentUser.uid);
        displayTasks(tasks);
        
        // Cargar actividad reciente
        const activity = await getRecentActivity(userData.companyId);
        displayRecentActivity(activity);
        
        // Inicializar gráfico
        initRevenueChart(metrics.revenueData);
        
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showNotification('Error al cargar datos del dashboard', 'error');
    }
}

// Actualizar métricas en la UI
function updateMetrics(metrics) {
    clientsCountElement.textContent = metrics.clientsCount || 0;
    quotesCountElement.textContent = metrics.quotesCount || 0;
    inventoryItemsElement.textContent = metrics.inventoryItems || 0;
    revenueAmountElement.textContent = formatCurrency(metrics.revenueAmount || 0);
}

// Mostrar cotizaciones recientes
function displayRecentQuotes(quotes) {
    if (!quotes || quotes.length === 0) {
        recentQuotesList.innerHTML = '<div class="empty-state"><p>No hay cotizaciones recientes</p></div>';
        return;
    }
    
    const quotesHTML = quotes.map(quote => `
        <div class="recent-item">
            <div class="recent-info">
                <h4>${quote.clientName}</h4>
                <p>${quote.description}</p>
            </div>
            <div class="recent-amount">${formatCurrency(quote.amount)}</div>
        </div>
    `).join('');
    
    recentQuotesList.innerHTML = quotesHTML;
}

// Mostrar tareas
function displayTasks(tasks) {
    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state"><p>No hay tareas pendientes</p></div>';
        return;
    }
    
    const tasksHTML = tasks.map(task => `
        <div class="task-item">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-info">
                <h4>${task.title}</h4>
                <p>Vence: ${formatDate(task.dueDate)}</p>
            </div>
            <span class="task-priority ${task.priority}">${task.priority}</span>
        </div>
    `).join('');
    
    taskList.innerHTML = tasksHTML;
    
    // Agregar event listeners para checkboxes
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', toggleTaskCompletion);
    });
}

// Mostrar actividad reciente
function displayRecentActivity(activities) {
    if (!activities || activities.length === 0) {
        activityFeed.innerHTML = '<div class="empty-state"><p>No hay actividad reciente</p></div>';
        return;
    }
    
    const activityHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${getActivityIcon(activity.type)}</div>
            <div class="activity-content">
                <p>${activity.description}</p>
                <span class="activity-time">${formatDate(activity.timestamp)}</span>
            </div>
        </div>
    `).join('');
    
    activityFeed.innerHTML = activityHTML;
}

// Obtener icono según tipo de actividad
function getActivityIcon(type) {
    const icons = {
        quote: '📋',
        client: '👥',
        payment: '💳',
        task: '✅',
        system: '⚙️'
    };
    
    return icons[type] || '🔔';
}

// Inicializar gráfico de ingresos
function initRevenueChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Destruir gráfico existente si hay uno
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Ingresos',
                data: data.values || [0, 0, 0, 0, 0, 0],
                borderColor: '#F27C22',
                backgroundColor: 'rgba(242, 124, 34, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Cargar clientes para cotización rápida
async function loadClientsForQuote() {
    try {
        // En una implementación real, esto cargaría clientes desde Firestore
        const quoteClientSelect = document.getElementById('quoteClient');
        quoteClientSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
        
        // Simulación de carga de clientes
        const clients = [
            { id: '1', name: 'Constructora Andina S.A.' },
            { id: '2', name: 'Inmobiliaria Pacifico' },
            { id: '3', name: 'Edificaciones Modernas' }
        ];
        
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            quoteClientSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        showNotification('Error al cargar la lista de clientes', 'error');
    }
}

// Manejar cotización rápida
async function handleQuickQuote(e) {
    e.preventDefault();
    
    const submitBtn = quickQuoteForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando...';
        
        const formData = new FormData(quickQuoteForm);
        const quoteData = {
            clientId: formData.get('quoteClient'),
            description: formData.get('quoteDescription'),
            amount: parseFloat(formData.get('quoteAmount')),
            validUntil: formData.get('quoteValidUntil'),
            createdAt: new Date()
        };
        
        await createQuickQuote(currentUser.uid, currentCompany.id, quoteData);
        
        showNotification('Cotización creada exitosamente', 'success');
        hideModal(quickQuoteModal);
        quickQuoteForm.reset();
        
        // Recargar datos del dashboard
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error al crear cotización:', error);
        showNotification('Error al crear la cotización', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Manejar agregar tarea - Versión corregida
async function handleAddTask(e) {
    e.preventDefault();
    
    const submitBtn = addTaskForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Agregando...';
        
        const formData = new FormData(addTaskForm);
        const taskData = {
            title: formData.get('taskTitle'),
            dueDate: formData.get('taskDueDate'),
            priority: formData.get('taskPriority'),
            completed: false,
            createdAt: new Date(),
            userId: currentUser.uid
        };
        
        // Validaciones
        if (!taskData.title || !taskData.dueDate) {
            showNotification('Por favor, completa todos los campos obligatorios', 'error');
            return;
        }
        
        if (new Date(taskData.dueDate) < new Date().setHours(0, 0, 0, 0)) {
            showNotification('La fecha límite no puede ser en el pasado', 'error');
            return;
        }
        
        await createTask(taskData);
        
        showNotification('Tarea agregada exitosamente', 'success');
        hideModal(addTaskModal);
        addTaskForm.reset();
        
        // Recargar tareas
        const tasks = await getUserTasks(currentUser.uid);
        displayTasks(tasks);
        
    } catch (error) {
        console.error('Error al agregar tarea:', error);
        showNotification('Error al agregar la tarea', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Alternar estado de completitud de tarea
async function toggleTaskCompletion(e) {
    const checkbox = e.currentTarget;
    const taskId = checkbox.getAttribute('data-task-id');
    const isCompleted = checkbox.classList.contains('checked');
    
    try {
        // En una implementación real, esto actualizaría el estado en Firestore
        checkbox.classList.toggle('checked');
        checkbox.innerHTML = isCompleted ? '' : '✓';
        
        showNotification(`Tarea ${isCompleted ? 'reactivada' : 'completada'}`, 'success');
        
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        showNotification('Error al actualizar la tarea', 'error');
        
        // Revertir visualmente si hay error
        checkbox.classList.toggle('checked');
        checkbox.innerHTML = isCompleted ? '✓' : '';
    }
}

// Manejar cierre de sesión - Versión corregida
async function handleLogout() {
    try {
        await signOut(auth);
        // Redirigir a la página de auth index.html
        window.location.href = '../../modules/auth/index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showNotification('Error al cerrar sesión', 'error');
    }
}

// Alternar visibilidad del sidebar
function toggleSidebar() {
    sidebar.classList.toggle('open');
}

// Mostrar modal - Versión mejorada
function showModal(modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('open');
    }, 10);
    document.body.style.overflow = 'hidden';
}

// Ocultar modal - Versión mejorada
function hideModal(modal) {
    modal.classList.remove('open');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
    document.body.style.overflow = 'auto';
}

// Navegar a módulo
function navigateToModule(module) {
    window.location.href = `/modules/${module}/`;
}

// Cargar navegación según permisos
function loadNavigation() {
    // En una implementación real, esto ocultaría elementos según el rol del usuario
    // Por ahora es solo un esqueleto para la funcionalidad
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

// Importar sistema de permisos
import { hasPermission, filterNavigationByRole } from '../../services/permissions.js';

// Navegación con identificación de módulos
const navigationItems = [
    { module: "clientes", icon: "👥", text: "Clientes" },
    { module: "cotizaciones", icon: "📋", text: "Cotizaciones" },
    { module: "inventario", icon: "📦", text: "Inventario" },
    { module: "contabilidad", icon: "📒", text: "Contabilidad" },
    { module: "nomina", icon: "💰", text: "Nómina" },
    { module: "pagos", icon: "💳", text: "Pagos" },
    { module: "crm", icon: "🤝", text: "CRM" },
    { module: "ai", icon: "🤖", text: "Asistente AI" }
];

// En la función loadUserData, después de cargar los datos del usuario:
async function loadUserData(userId) {
    try {
        const userData = await getUserData(userId);
        
        // Actualizar UI con datos del usuario
        userNameElement.textContent = userData.name;
        userRoleElement.textContent = userData.role;
        userAvatarElement.querySelector('span').textContent = userData.name.charAt(0).toUpperCase();
        
        // Personalizar mensaje de bienvenida
        if (userData.role === 'superadmin') {
            welcomeTitleElement.textContent = `Panel de Control Global`;
            welcomeMessageElement.textContent = `Gestión de todas las empresas del sistema`;
        } else if (userData.company) {
            welcomeTitleElement.textContent = `Bienvenido, ${userData.name}`;
            welcomeMessageElement.textContent = `Panel de ${userData.company.name}`;
        }
        
        // Filtrar y cargar navegación según permisos
        loadNavigation(userData);
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        showNotification('Error al cargar datos del usuario', 'error');
    }
}

// Cargar navegación según permisos
function loadNavigation(user) {
    const navContainer = document.getElementById('sidebar-nav');
    const filteredNav = filterNavigationByRole(navigationItems, user);
    
    let navHTML = '';
    
    // Sección Principal
    navHTML += `
        <div class="nav-section">
            <h3>Principal</h3>
            <ul>
                <li class="nav-item active">
                    <a href="#" data-module="dashboard">
                        <span class="nav-icon">📊</span>
                        <span class="nav-text">Dashboard</span>
                    </a>
                </li>
            </ul>
        </div>
    `;
    
    // Sección de Gestión (solo si tiene al menos un módulo)
    if (filteredNav.length > 0) {
        navHTML += `
            <div class="nav-section">
                <h3>Gestión</h3>
                <ul>
        `;
        
        filteredNav.forEach(item => {
            navHTML += `
                <li class="nav-item">
                    <a href="#" data-module="${item.module}">
                        <span class="nav-icon">${item.icon}</span>
                        <span class="nav-text">${item.text}</span>
                    </a>
                </li>
            `;
        });
        
        navHTML += `
                </ul>
            </div>
        `;
    }
    
    // Sección de Herramientas (si tiene permisos)
    if (hasPermission(user, 'access_module', 'crm') || 
        hasPermission(user, 'access_module', 'ai')) {
        
        navHTML += `
            <div class="nav-section">
                <h3>Herramientas</h3>
                <ul>
        `;
        
        if (hasPermission(user, 'access_module', 'crm')) {
            navHTML += `
                <li class="nav-item">
                    <a href="#" data-module="crm">
                        <span class="nav-icon">🤝</span>
                        <span class="nav-text">CRM</span>
                    </a>
                </li>
            `;
        }
        
        if (hasPermission(user, 'access_module', 'ai')) {
            navHTML += `
                <li class="nav-item">
                    <a href="#" data-module="ai">
                        <span class="nav-icon">🤖</span>
                        <span class="nav-text">Asistente AI</span>
                    </a>
                </li>
            `;
        }
        
        navHTML += `
                </ul>
            </div>
        `;
    }
    
    navContainer.innerHTML = navHTML;
    
    // Agregar event listeners a los enlaces de navegación
    document.querySelectorAll('[data-module]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const module = link.getAttribute('data-module');
            
            // Verificar permisos antes de navegar
            if (module === 'dashboard' || hasPermission(user, 'access_module', module)) {
                navigateToModule(module);
            } else {
                showNotification('No tienes permisos para acceder a este módulo', 'error');
            }
        });
    });
}




