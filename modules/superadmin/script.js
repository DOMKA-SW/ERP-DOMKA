// Importar servicios y configuraciones
import { 
    auth, 
    signOut, 
    onAuthStateChanged 
} from '../../services/firebase-config.js';
import { 
    getUserData,
    getAllCompanies,
    getAllUsers,
    getSystemMetrics,
    getSystemActivity,
    createCompany,
    updateCompany,
    updateUser,
    disableCompany,
    enableCompany 
} from '../../services/database.js';
import { showNotification, formatDate } from '../../services/helpers.js';

// Elementos del DOM
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const userNameElement = document.getElementById('userName');
const userAvatarElement = document.getElementById('userAvatar');
const welcomeTitleElement = document.getElementById('welcomeTitle');
const logoutBtn = document.getElementById('logoutBtn');
const backToDashboardBtn = document.getElementById('backToDashboard');

// Elementos de estadísticas
const totalCompaniesElement = document.getElementById('totalCompanies');
const totalUsersElement = document.getElementById('totalUsers');
const activeCompaniesElement = document.getElementById('activeCompanies');

// Elementos de secciones
const contentSections = document.querySelectorAll('.content-section');
const navLinks = document.querySelectorAll('.sidebar-nav a[data-section]');

// Elementos de empresas
const companiesTable = document.getElementById('companiesTable');
const companySearch = document.getElementById('companySearch');
const companyFilter = document.getElementById('companyFilter');
const addCompanyBtn = document.getElementById('addCompanyBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfoElement = document.getElementById('pageInfo');

// Elementos de usuarios
const usersTable = document.getElementById('usersTable');
const userSearch = document.getElementById('userSearch');
const userCompanyFilter = document.getElementById('userCompanyFilter');
const userRoleFilter = document.getElementById('userRoleFilter');
const userPrevPageBtn = document.getElementById('userPrevPage');
const userNextPageBtn = document.getElementById('userNextPage');
const userPageInfoElement = document.getElementById('userPageInfo');

// Modales
const companyModal = document.getElementById('companyModal');
const userModal = document.getElementById('userModal');
const companyForm = document.getElementById('companyForm');
const userForm = document.getElementById('userForm');

// Variables globales
let currentUser = null;
let allCompanies = [];
let allUsers = [];
let currentCompanyPage = 1;
let currentUserPage = 1;
const itemsPerPage = 10;

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
    backToDashboardBtn.addEventListener('click', goToDashboard);
    
    // Navegación entre secciones
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
            
            // Actualizar navegación activa
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            link.parentElement.classList.add('active');
        });
    });
    
    // Gestión de empresas
    addCompanyBtn.addEventListener('click', () => {
        showCompanyModal('add');
    });
    
    companySearch.addEventListener('input', filterCompanies);
    companyFilter.addEventListener('change', filterCompanies);
    prevPageBtn.addEventListener('click', () => changeCompanyPage(-1));
    nextPageBtn.addEventListener('click', () => changeCompanyPage(1));
    
    // Gestión de usuarios
    userSearch.addEventListener('input', filterUsers);
    userCompanyFilter.addEventListener('change', filterUsers);
    userRoleFilter.addEventListener('change', filterUsers);
    userPrevPageBtn.addEventListener('click', () => changeUserPage(-1));
    userNextPageBtn.addEventListener('click', () => changeUserPage(1));
    
    // Modales
    document.getElementById('closeCompanyModal').addEventListener('click', () => hideModal(companyModal));
    document.getElementById('cancelCompany').addEventListener('click', () => hideModal(companyModal));
    document.getElementById('closeUserModal').addEventListener('click', () => hideModal(userModal));
    document.getElementById('cancelUser').addEventListener('click', () => hideModal(userModal));
    
    // Formularios
    companyForm.addEventListener('submit', handleCompanySubmit);
    userForm.addEventListener('submit', handleUserSubmit);
    
    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (e.target === companyModal) hideModal(companyModal);
        if (e.target === userModal) hideModal(userModal);
    });
    
    // Cerrar modales con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideModal(companyModal);
            hideModal(userModal);
        }
    });
}

// Verificar estado de autenticación
function checkAuthState() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData(user.uid);
            await loadCompanies();
            await loadUsers();
            await loadSystemMetrics();
            await loadSystemActivity();
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
        
        // Verificar si el usuario es superadmin
        if (userData.role !== 'superadmin') {
            showNotification('Acceso denegado. Se requiere rol de Super Administrador.', 'error');
            goToDashboard();
            return;
        }
        
        // Actualizar UI con datos del usuario
        userNameElement.textContent = userData.name;
        userAvatarElement.querySelector('span').textContent = userData.name.charAt(0).toUpperCase();
        welcomeTitleElement.textContent = `Panel de Control Global - ${userData.name}`;
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        showNotification('Error al cargar datos del usuario', 'error');
    }
}

// Cargar todas las empresas
async function loadCompanies() {
    try {
        allCompanies = await getAllCompanies();
        updateCompaniesStats();
        displayCompanies();
        populateCompanyFilter();
        
    } catch (error) {
        console.error('Error al cargar empresas:', error);
        showNotification('Error al cargar las empresas', 'error');
    }
}

// Cargar todos los usuarios
async function loadUsers() {
    try {
        allUsers = await getAllUsers();
        updateUsersStats();
        displayUsers();
        
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showNotification('Error al cargar los usuarios', 'error');
    }
}

// Cargar métricas del sistema
async function loadSystemMetrics() {
    try {
        const metrics = await getSystemMetrics();
        // Aquí inicializarías los gráficos con los datos
        initCharts(metrics);
        
    } catch (error) {
        console.error('Error al cargar métricas del sistema:', error);
    }
}

// Cargar actividad del sistema
async function loadSystemActivity() {
    try {
        const activity = await getSystemActivity();
        displaySystemActivity(activity);
        
    } catch (error) {
        console.error('Error al cargar actividad del sistema:', error);
    }
}

// Actualizar estadísticas de empresas
function updateCompaniesStats() {
    const total = allCompanies.length;
    const active = allCompanies.filter(company => company.status === 'active').length;
    
    totalCompaniesElement.textContent = total;
    activeCompaniesElement.textContent = active;
}

// Actualizar estadísticas de usuarios
function updateUsersStats() {
    const total = allUsers.length;
    totalUsersElement.textContent = total;
}

// Mostrar empresas en la tabla
function displayCompanies() {
    if (!allCompanies || allCompanies.length === 0) {
        companiesTable.innerHTML = '<tr><td colspan="6" class="empty-state">No hay empresas registradas</td></tr>';
        return;
    }
    
    // Aplicar filtros y paginación
    const filteredCompanies = filterCompaniesList();
    const paginatedCompanies = paginateItems(filteredCompanies, currentCompanyPage);
    
    // Actualizar controles de paginación
    updatePaginationControls(filteredCompanies.length, currentCompanyPage, 'company');
    
    // Generar HTML de la tabla
    const companiesHTML = paginatedCompanies.map(company => `
        <tr>
            <td>${company.name}</td>
            <td>${company.plan}</td>
            <td><span class="status-badge status-${company.status}">${company.status}</span></td>
            <td>${company.userCount || 0}</td>
            <td>${formatDate(company.createdAt)}</td>
            <td>
                <button class="btn-action btn-edit" data-company-id="${company.id}">Editar</button>
                ${company.status === 'active' 
                    ? `<button class="btn-action btn-disable" data-company-id="${company.id}">Desactivar</button>` 
                    : `<button class="btn-action btn-edit" data-company-id="${company.id}">Activar</button>`
                }
            </td>
        </tr>
    `).join('');
    
    companiesTable.innerHTML = companiesHTML;
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-edit[data-company-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const companyId = e.target.getAttribute('data-company-id');
            showCompanyModal('edit', companyId);
        });
    });
    
    document.querySelectorAll('.btn-disable[data-company-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const companyId = e.target.getAttribute('data-company-id');
            toggleCompanyStatus(companyId);
        });
    });
}

// Mostrar usuarios en la tabla
function displayUsers() {
    if (!allUsers || allUsers.length === 0) {
        usersTable.innerHTML = '<tr><td colspan="7" class="empty-state">No hay usuarios registrados</td></tr>';
        return;
    }
    
    // Aplicar filtros y paginación
    const filteredUsers = filterUsersList();
    const paginatedUsers = paginateItems(filteredUsers, currentUserPage);
    
    // Actualizar controles de paginación
    updatePaginationControls(filteredUsers.length, currentUserPage, 'user');
    
    // Generar HTML de la tabla
    const usersHTML = paginatedUsers.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.companyName || 'Sin empresa'}</td>
            <td>${user.role}</td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td>${user.lastLogin ? formatDate(user.lastLogin) : 'Nunca'}</td>
            <td>
                <button class="btn-action btn-edit" data-user-id="${user.id}">Editar</button>
                ${user.status === 'active' 
                    ? `<button class="btn-action btn-disable" data-user-id="${user.id}">Desactivar</button>` 
                    : `<button class="btn-action btn-edit" data-user-id="${user.id}">Activar</button>`
                }
            </td>
        </tr>
    `).join('');
    
    usersTable.innerHTML = usersHTML;
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-edit[data-user-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            showUserModal(userId);
        });
    });
    
    document.querySelectorAll('.btn-disable[data-user-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            toggleUserStatus(userId);
        });
    });
}

// Filtrar lista de empresas
function filterCompaniesList() {
    const searchTerm = companySearch.value.toLowerCase();
    const filterValue = companyFilter.value;
    
    return allCompanies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchTerm) || 
                             company.email.toLowerCase().includes(searchTerm);
        const matchesFilter = filterValue === 'all' || company.status === filterValue;
        
        return matchesSearch && matchesFilter;
    });
}

// Filtrar lista de usuarios
function filterUsersList() {
    const searchTerm = userSearch.value.toLowerCase();
    const companyFilterValue = userCompanyFilter.value;
    const roleFilterValue = userRoleFilter.value;
    
    return allUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                             user.email.toLowerCase().includes(searchTerm);
        const matchesCompany = companyFilterValue === 'all' || user.companyId === companyFilterValue;
        const matchesRole = roleFilterValue === 'all' || user.role === roleFilterValue;
        
        return matchesSearch && matchesCompany && matchesRole;
    });
}

// Paginar items
function paginateItems(items, page) {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
}

// Actualizar controles de paginación
function updatePaginationControls(totalItems, currentPage, type) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const isCompany = type === 'company';
    
    const prevBtn = isCompany ? prevPageBtn : userPrevPageBtn;
    const nextBtn = isCompany ? nextPageBtn : userNextPageBtn;
    const pageInfo = isCompany ? pageInfoElement : userPageInfoElement;
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
}

// Mostrar modal de empresa
function showCompanyModal(action, companyId = null) {
    const modalTitle = document.getElementById('companyModalTitle');
    const form = document.getElementById('companyForm');
    
    if (action === 'add') {
        modalTitle.textContent = 'Agregar Empresa';
        form.reset();
        document.getElementById('companyId').value = '';
    } else if (action === 'edit' && companyId) {
        modalTitle.textContent = 'Editar Empresa';
        const company = allCompanies.find(c => c.id === companyId);
        if (company) {
            document.getElementById('companyId').value = company.id;
            document.getElementById('companyName').value = company.name;
            document.getElementById('companyEmail').value = company.email;
            document.getElementById('companyPlan').value = company.plan;
            document.getElementById('companyStatus').value = company.status;
            document.getElementById('companyTrialEnd').value = company.trialEnd || '';
        }
    }
    
    showModal(companyModal);
}

// Mostrar modal de usuario
async function showUserModal(userId) {
    const modalTitle = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    const user = allUsers.find(u => u.id === userId);
    
    if (user) {
        modalTitle.textContent = 'Editar Usuario';
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userStatus').value = user.status;
        
        // Cargar selector de empresas
        const companySelect = document.getElementById('userCompany');
        companySelect.innerHTML = '<option value="">Seleccionar empresa</option>';
        
        allCompanies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            option.selected = user.companyId === company.id;
            companySelect.appendChild(option);
        });
        
        showModal(userModal);
    }
}

// Manejar envío de formulario de empresa
async function handleCompanySubmit(e) {
    e.preventDefault();
    
    const submitBtn = companyForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        
        const formData = new FormData(companyForm);
        const companyData = {
            name: formData.get('companyName'),
            email: formData.get('companyEmail'),
            plan: formData.get('companyPlan'),
            status: formData.get('companyStatus'),
            trialEnd: formData.get('companyTrialEnd') || null
        };
        
        const companyId = formData.get('companyId');
        
        if (companyId) {
            // Editar empresa existente
            await updateCompany(companyId, companyData);
            showNotification('Empresa actualizada exitosamente', 'success');
        } else {
            // Crear nueva empresa
            await createCompany(companyData);
            showNotification('Empresa creada exitosamente', 'success');
        }
        
        hideModal(companyModal);
        
        // Recargar empresas
        await loadCompanies();
        
    } catch (error) {
        console.error('Error al guardar empresa:', error);
        showNotification('Error al guardar la empresa', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Manejar envío de formulario de usuario
async function handleUserSubmit(e) {
    e.preventDefault();
    
    const submitBtn = userForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        
        const formData = new FormData(userForm);
        const userData = {
            name: formData.get('userName'),
            role: formData.get('userRole'),
            status: formData.get('userStatus'),
            companyId: formData.get('userCompany')
        };
        
        const userId = formData.get('userId');
        
        await updateUser(userId, userData);
        showNotification('Usuario actualizado exitosamente', 'success');
        
        hideModal(userModal);
        
        // Recargar usuarios
        await loadUsers();
        
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        showNotification('Error al guardar el usuario', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Alternar estado de empresa
async function toggleCompanyStatus(companyId) {
    try {
        const company = allCompanies.find(c => c.id === companyId);
        if (!company) return;
        
        if (company.status === 'active') {
            await disableCompany(companyId);
            showNotification('Empresa desactivada exitosamente', 'success');
        } else {
            await enableCompany(companyId);
            showNotification('Empresa activada exitosamente', 'success');
        }
        
        // Recargar empresas
        await loadCompanies();
        
    } catch (error) {
        console.error('Error al cambiar estado de empresa:', error);
        showNotification('Error al cambiar el estado de la empresa', 'error');
    }
}

// Alternar estado de usuario
async function toggleUserStatus(userId) {
    try {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;
        
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        
        await updateUser(userId, { status: newStatus });
        showNotification(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente`, 'success');
        
        // Recargar usuarios
        await loadUsers();
        
    } catch (error) {
        console.error('Error al cambiar estado de usuario:', error);
        showNotification('Error al cambiar el estado del usuario', 'error');
    }
}

// Mostrar sección específica
function showSection(sectionId) {
    contentSections.forEach(section => {
        section.classList.add('hidden');
    });
    
    document.getElementById(`${sectionId}Section`).classList.remove('hidden');
}

// Cambiar página de empresas
function changeCompanyPage(direction) {
    const filteredCompanies = filterCompaniesList();
    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    
    currentCompanyPage += direction;
    
    if (currentCompanyPage < 1) currentCompanyPage = 1;
    if (currentCompanyPage > totalPages) currentCompanyPage = totalPages;
    
    displayCompanies();
}

// Cambiar página de usuarios
function changeUserPage(direction) {
    const filteredUsers = filterUsersList();
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    
    currentUserPage += direction;
    
    if (currentUserPage < 1) currentUserPage = 1;
    if (currentUserPage > totalPages) currentUserPage = totalPages;
    
    displayUsers();
}

// Llenar filtro de empresas
function populateCompanyFilter() {
    const filter = document.getElementById('userCompanyFilter');
    filter.innerHTML = '<option value="all">Todas las empresas</option>';
    
    allCompanies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.name;
        filter.appendChild(option);
    });
}

// Inicializar gráficos
function initCharts(metrics) {
    // Aquí inicializarías Chart.js con los datos de métricas
    // Esta es una implementación básica de ejemplo
    console.log('Inicializando gráficos con datos:', metrics);
}

// Mostrar actividad del sistema
function displaySystemActivity(activity) {
    const activityLog = document.getElementById('systemActivityLog');
    
    if (!activity || activity.length === 0) {
        activityLog.innerHTML = '<div class="empty-state">No hay actividad reciente</div>';
        return;
    }
    
    const activityHTML = activity.map(item => `
        <div class="activity-item">
            <div class="activity-icon">${getActivityIcon(item.type)}</div>
            <div class="activity-content">
                <p>${item.description}</p>
                <span class="activity-time">${formatDate(item.timestamp)}</span>
            </div>
        </div>
    `).join('');
    
    activityLog.innerHTML = activityHTML;
}

// Obtener icono según tipo de actividad
function getActivityIcon(type) {
    const icons = {
        company: '🏭',
        user: '👥',
        system: '⚙️',
        security: '🔒',
        error: '❌'
    };
    
    return icons[type] || '🔔';
}

// Ir al dashboard
function goToDashboard() {
    window.location.href = '../../modules/dashboard/index.html';
}

// Alternar visibilidad del sidebar
function toggleSidebar() {
    sidebar.classList.toggle('open');
}

// Mostrar modal
function showModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Ocultar modal
function hideModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
