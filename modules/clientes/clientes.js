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

// clientes.js - Módulo de Clientes para DOMKA ERP

// Importaciones de Firebase (versión modular)
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    query, 
    where,
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Inicializar Firebase (ya inicializada en auth, pero la necesitamos aquí)
import { app } from "../auth/auth.js";

// Inicializar servicios de Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Variables globales
let currentUser = null;
let empresaId = null;
let currentClientId = null;

// Elementos del DOM
const clientsTable = document.getElementById('clients-table');
const clientsTbody = document.getElementById('clients-tbody');
const loadingSpinner = document.getElementById('loading-spinner');
const emptyState = document.getElementById('empty-state');
const newClientBtn = document.getElementById('new-client-btn');
const emptyNewClientBtn = document.getElementById('empty-new-client-btn');
const clientModal = document.getElementById('client-modal');
const deleteModal = document.getElementById('delete-modal');
const clientForm = document.getElementById('client-form');
const modalTitle = document.getElementById('modal-title');
const clientIdInput = document.getElementById('client-id');
const closeModalBtn = document.getElementById('close-modal');
const cancelFormBtn = document.getElementById('cancel-form');
const closeDeleteModalBtn = document.getElementById('close-delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const confirmDeleteBtn = document.getElementById('confirm-delete');

// Inicializar el módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initClientModule);

// Inicialización del módulo de clientes
function initClientModule() {
    checkAuthState();
    setupEventListeners();
}

// Configurar event listeners
function setupEventListeners() {
    // Botones para abrir modal de nuevo cliente
    if (newClientBtn) newClientBtn.addEventListener('click', openNewClientModal);
    if (emptyNewClientBtn) emptyNewClientBtn.addEventListener('click', openNewClientModal);
    
    // Modal events
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeClientModal);
    if (cancelFormBtn) cancelFormBtn.addEventListener('click', closeClientModal);
    if (clientForm) clientForm.addEventListener('submit', handleClientSubmit);
    
    // Delete modal events
    if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDeleteClient);
    
    // Cerrar modal al hacer clic fuera del contenido
    if (clientModal) clientModal.addEventListener('click', (e) => {
        if (e.target === clientModal) closeClientModal();
    });
    
    if (deleteModal) deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
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
            // Obtener empresa_id del usuario
            await loadUserData(user.uid);
            // Cargar clientes
            await loadClients();
        } else {
            // Usuario no autenticado, redirigir al login
            window.location.href = '../auth/auth.html';
        }
    });
}

// Cargar datos del usuario desde sessionStorage
async function loadUserData(userId) {
    try {
        empresaId = sessionStorage.getItem('empresa_id');
        if (!empresaId) {
            // Redirigir al login si no hay empresa_id
            window.location.href = '../auth/auth.html';
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        showError('Error al cargar información del usuario');
    }
}

// Cargar clientes desde Firestore
async function loadClients() {
    if (!empresaId) return;
    
    try {
        showLoading(true);
        
        // Consultar clientes de la empresa actual, ordenados por fecha de creación
        const q = query(
            collection(db, "clientes"), 
            where("empresa_id", "==", empresaId),
            orderBy("fechaCreacion", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            showEmptyState();
            return;
        }
        
        // Limpiar tabla
        clientsTbody.innerHTML = '';
        
        // Procesar cada documento
        querySnapshot.forEach((doc) => {
            const client = doc.data();
            renderClientRow(doc.id, client);
        });
        
        showTable();
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        showError('Error al cargar la lista de clientes');
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

// Renderizar fila de cliente en la tabla
function renderClientRow(clientId, client) {
    const row = document.createElement('tr');
    
    // Formatear fecha
    const creationDate = client.fechaCreacion?.toDate();
    const formattedDate = creationDate ? 
        creationDate.toLocaleDateString('es-ES') : 
        'Fecha no disponible';
    
    row.innerHTML = `
        <td>${client.nombre || 'Sin nombre'}</td>
        <td>${client.email || '—'}</td>
        <td>${client.telefono || '—'}</td>
        <td>${client.empresa || '—'}</td>
        <td>${formattedDate}</td>
        <td class="actions">
            <button class="action-btn edit-btn" data-id="${clientId}">Editar</button>
            <button class="action-btn delete-btn" data-id="${clientId}">Eliminar</button>
        </td>
    `;
    
    // Agregar event listeners a los botones
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => openEditClientModal(clientId, client));
    deleteBtn.addEventListener('click', () => openDeleteClientModal(clientId, client));
    
    clientsTbody.appendChild(row);
}

// Abrir modal para nuevo cliente
function openNewClientModal() {
    modalTitle.textContent = 'Nuevo Cliente';
    clientIdInput.value = '';
    clientForm.reset();
    currentClientId = null;
    openClientModal();
}

// Abrir modal para editar cliente
function openEditClientModal(clientId, clientData) {
    modalTitle.textContent = 'Editar Cliente';
    clientIdInput.value = clientId;
    
    // Llenar formulario con datos existentes
    document.getElementById('client-name').value = clientData.nombre || '';
    document.getElementById('client-email').value = clientData.email || '';
    document.getElementById('client-phone').value = clientData.telefono || '';
    document.getElementById('client-company').value = clientData.empresa || '';
    
    currentClientId = clientId;
    openClientModal();
}

// Abrir modal de cliente
function openClientModal() {
    clientModal.classList.add('active');
}

// Cerrar modal de cliente
function closeClientModal() {
    clientModal.classList.remove('active');
}

// Manejar envío del formulario de cliente
async function handleClientSubmit(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const clientData = {
        nombre: document.getElementById('client-name').value.trim(),
        email: document.getElementById('client-email').value.trim(),
        telefono: document.getElementById('client-phone').value.trim(),
        empresa: document.getElementById('client-company').value.trim(),
        empresa_id: empresaId,
        fechaCreacion: serverTimestamp()
    };
    
    // Validación básica
    if (!clientData.nombre) {
        showError('El nombre del cliente es obligatorio');
        return;
    }
    
    try {
        if (currentClientId) {
            // Actualizar cliente existente
            await updateClient(currentClientId, clientData);
            showSuccess('Cliente actualizado correctamente');
        } else {
            // Crear nuevo cliente
            await createClient(clientData);
            showSuccess('Cliente creado correctamente');
        }
        
        // Recargar lista de clientes
        await loadClients();
        
        // Cerrar modal
        closeClientModal();
    } catch (error) {
        console.error('Error al guardar cliente:', error);
        showError('Error al guardar el cliente');
    }
}

// Crear nuevo cliente en Firestore
async function createClient(clientData) {
    try {
        await addDoc(collection(db, "clientes"), clientData);
    } catch (error) {
        throw error;
    }
}

// Actualizar cliente existente
async function updateClient(clientId, clientData) {
    try {
        // No actualizar la fecha de creación al editar
        delete clientData.fechaCreacion;
        
        const clientRef = doc(db, "clientes", clientId);
        await updateDoc(clientRef, clientData);
    } catch (error) {
        throw error;
    }
}

// Abrir modal de confirmación para eliminar cliente
function openDeleteClientModal(clientId, clientData) {
    currentClientId = clientId;
    deleteModal.classList.add('active');
}

// Cerrar modal de confirmación
function closeDeleteModal() {
    deleteModal.classList.remove('active');
    currentClientId = null;
}

// Confirmar eliminación de cliente
async function confirmDeleteClient() {
    if (!currentClientId) return;
    
    try {
        await deleteClient(currentClientId);
        showSuccess('Cliente eliminado correctamente');
        
        // Recargar lista de clientes
        await loadClients();
        
        // Cerrar modal
        closeDeleteModal();
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        showError('Error al eliminar el cliente');
    }
}

// Eliminar cliente de Firestore
async function deleteClient(clientId) {
    try {
        const clientRef = doc(db, "clientes", clientId);
        await deleteDoc(clientRef);
    } catch (error) {
        throw error;
    }
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

// Mostrar/ocultar estados de la UI
function showLoading(show) {
    if (show) {
        loadingSpinner.style.display = 'block';
        clientsTable.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingSpinner.style.display = 'none';
    }
}

function showTable() {
    clientsTable.style.display = 'table';
    emptyState.style.display = 'none';
}

function showEmptyState() {
    clientsTable.style.display = 'none';
    emptyState.style.display = 'block';
}

// Mostrar mensaje de éxito
function showSuccess(message) {
    showNotification(message, 'success');
}

// Mostrar mensaje de error
function showError(message) {
    showNotification(message, 'error');
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación si no existe
    let notification = document.getElementById('client-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'client-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: var(--border-radius);
            z-index: 3000;
            box-shadow: var(--box-shadow);
            color: white;
            font-weight: 500;
        `;
        document.body.appendChild(notification);
    }
    
    // Estilo según el tipo
    if (type === 'success') {
        notification.style.backgroundColor = 'var(--success-color)';
    } else if (type === 'error') {
        notification.style.backgroundColor = 'var(--danger-color)';
    } else {
        notification.style.backgroundColor = 'var(--primary-color)';
    }
    
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Exportar funciones para uso en otros módulos
window.clientModule = {
    createClient,
    getClients: loadClients,
    updateClient,
    deleteClient,
    logoutUser
};
