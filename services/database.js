import { 
    db, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc,
    query,
    where,
    getDocs 
} from './firebase-config.js';

// Crear documento de usuario en Firestore
export async function createUserDocument(userId, userData) {
    try {
        await setDoc(doc(db, "users", userId), userData);
        console.log("Documento de usuario creado con ID: ", userId);
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

// Crear documento de empresa en Firestore
export async function createCompanyDocument(companyName) {
    try {
        const docRef = await addDoc(collection(db, "companies"), {
            name: companyName,
            status: "active",
            createdAt: new Date(),
            plan: "free"
        });
        console.log("Documento de empresa creado con ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

// Obtener el rol del usuario
export async function getUserRole(userId) {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data().role;
        } else {
            console.log("No such document!");
            return 'user'; // Rol por defecto
        }
    } catch (e) {
        console.error("Error getting document: ", e);
        return 'user'; // Rol por defecto en caso de error
    }
}

// Obtener información de la empresa
export async function getCompanyData(companyId) {
    try {
        const docRef = doc(db, "companies", companyId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (e) {
        console.error("Error getting document: ", e);
        throw e;
    }
}


// Obtener datos del usuario
export async function getUserData(userId) {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: userId, ...docSnap.data() };
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (e) {
        console.error("Error getting document: ", e);
        throw e;
    }
}

// Obtener métricas del dashboard
export async function getDashboardMetrics(companyId) {
    try {
        // Simulación de datos - en una implementación real, estos vendrían de Firestore
        return {
            clientsCount: 24,
            quotesCount: 18,
            inventoryItems: 156,
            revenueAmount: 45280.50,
            revenueData: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                values: [12000, 15000, 18000, 22000, 28000, 45280]
            }
        };
    } catch (e) {
        console.error("Error getting dashboard metrics: ", e);
        throw e;
    }
}

// Obtener cotizaciones recientes
export async function getRecentQuotes(companyId) {
    try {
        // Simulación de datos
        return [
            {
                id: '1',
                clientName: 'Constructora Andina S.A.',
                description: 'Materiales de construcción',
                amount: 12500.00,
                date: new Date()
            },
            {
                id: '2',
                clientName: 'Inmobiliaria Pacifico',
                description: 'Instalación domótica',
                amount: 8700.00,
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                id: '3',
                clientName: 'Edificaciones Modernas',
                description: 'Consultoría software',
                amount: 5600.00,
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            }
        ];
    } catch (e) {
        console.error("Error getting recent quotes: ", e);
        throw e;
    }
}

// Obtener tareas del usuario
export async function getUserTasks(userId) {
    try {
        // Simulación de datos
        return [
            {
                id: '1',
                title: 'Revisar cotización #245',
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                priority: 'high',
                completed: false
            },
            {
                id: '2',
                title: 'Contactar a proveedor materiales',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                priority: 'medium',
                completed: false
            },
            {
                id: '3',
                title: 'Actualizar inventario',
                dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                priority: 'high',
                completed: true
            }
        ];
    } catch (e) {
        console.error("Error getting user tasks: ", e);
        throw e;
    }
}

// Obtener actividad reciente
export async function getRecentActivity(companyId) {
    try {
        // Simulación de datos
        return [
            {
                id: '1',
                type: 'quote',
                description: 'Nueva cotización creada (#245)',
                timestamp: new Date()
            },
            {
                id: '2',
                type: 'client',
                description: 'Cliente "Constructora Andina" actualizado',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
                id: '3',
                type: 'payment',
                description: 'Pago recibido de Inmobiliaria Pacifico',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
            },
            {
                id: '4',
                type: 'task',
                description: 'Tarea "Actualizar inventario" completada',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        ];
    } catch (e) {
        console.error("Error getting recent activity: ", e);
        throw e;
    }
}

// Crear cotización rápida
export async function createQuickQuote(userId, companyId, quoteData) {
    try {
        // En una implementación real, esto guardaría en Firestore
        console.log("Creating quick quote:", quoteData);
        
        // Simular retraso de red
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { id: 'new-quote-id', ...quoteData };
    } catch (e) {
        console.error("Error creating quick quote: ", e);
        throw e;
    }
}

// Crear tarea
export async function createTask(taskData) {
    try {
        // En una implementación real, esto guardaría en Firestore
        console.log("Creating task:", taskData);
        
        // Simular retraso de red
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return { id: 'new-task-id', ...taskData };
    } catch (e) {
        console.error("Error creating task: ", e);
        throw e;
    }
}

// ... (código anterior)

// Obtener todas las empresas
export async function getAllCompanies() {
    try {
        const querySnapshot = await getDocs(collection(db, "companies"));
        const companies = [];
        
        querySnapshot.forEach((doc) => {
            companies.push({ id: doc.id, ...doc.data() });
        });
        
        return companies;
    } catch (e) {
        console.error("Error getting companies: ", e);
        throw e;
    }
}

// Obtener todos los usuarios
export async function getAllUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = [];
        
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        return users;
    } catch (e) {
        console.error("Error getting users: ", e);
        throw e;
    }
}

// Obtener métricas del sistema
export async function getSystemMetrics() {
    try {
        // En una implementación real, esto calcularía métricas de Firestore
        return {
            userActivity: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                values: [120, 190, 210, 180, 250, 200, 170]
            },
            plansDistribution: {
                labels: ['Gratuito', 'Básico', 'Profesional', 'Empresarial'],
                values: [45, 25, 20, 10]
            },
            dailyRegistrations: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                values: [15, 22, 18, 25]
            }
        };
    } catch (e) {
        console.error("Error getting system metrics: ", e);
        throw e;
    }
}

// Obtener actividad del sistema
export async function getSystemActivity() {
    try {
        // En una implementación real, esto vendría de Firestore
        return [
            {
                id: '1',
                type: 'user',
                description: 'Nuevo usuario registrado: Juan Pérez',
                timestamp: new Date()
            },
            {
                id: '2',
                type: 'company',
                description: 'Nueva empresa creada: Constructora Andina S.A.',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
                id: '3',
                type: 'system',
                description: 'Respaldo del sistema completado',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
            }
        ];
    } catch (e) {
        console.error("Error getting system activity: ", e);
        throw e;
    }
}

// Crear empresa
export async function createCompany(companyData) {
    try {
        const docRef = await addDoc(collection(db, "companies"), {
            ...companyData,
            createdAt: new Date(),
            userCount: 0
        });
        
        console.log("Company created with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding company: ", e);
        throw e;
    }
}

// Actualizar empresa
export async function updateCompany(companyId, companyData) {
    try {
        const docRef = doc(db, "companies", companyId);
        await updateDoc(docRef, companyData);
        
        console.log("Company updated: ", companyId);
    } catch (e) {
        console.error("Error updating company: ", e);
        throw e;
    }
}

// Actualizar usuario
export async function updateUser(userId, userData) {
    try {
        const docRef = doc(db, "users", userId);
        await updateDoc(docRef, userData);
        
        console.log("User updated: ", userId);
    } catch (e) {
        console.error("Error updating user: ", e);
        throw e;
    }
}

// Desactivar empresa
export async function disableCompany(companyId) {
    try {
        const docRef = doc(db, "companies", companyId);
        await updateDoc(docRef, { status: "inactive" });
        
        console.log("Company disabled: ", companyId);
    } catch (e) {
        console.error("Error disabling company: ", e);
        throw e;
    }
}

// Activar empresa
export async function enableCompany(companyId) {
    try {
        const docRef = doc(db, "companies", companyId);
        await updateDoc(docRef, { status: "active" });
        
        console.log("Company enabled: ", companyId);
    } catch (e) {
        console.error("Error enabling company: ", e);
        throw e;
    }
}

// Obtener el rol del usuario y redirigir
export async function redirectUserBasedOnRole(userId) {
    try {
        const role = await getUserRole(userId);
        
        if (role === 'superadmin') {
            window.location.href = '/modules/superadmin/index.html';
        } else {
            window.location.href = '/modules/dashboard/index.html';
        }
    } catch (error) {
        console.error('Error al redirigir usuario:', error);
        // Mostrar mensaje de error
        const authMessage = document.getElementById('authMessage');
        if (authMessage) {
            authMessage.textContent = 'Error al cargar tu perfil. Inténtalo de nuevo.';
            authMessage.classList.remove('hidden', 'success', 'error');
            authMessage.classList.add('error');
        }
        
        // Forzar redirección al dashboard después de 3 segundos si hay error
        setTimeout(() => {
            window.location.href = '/modules/dashboard/index.html';
        }, 3000);
    }
}
