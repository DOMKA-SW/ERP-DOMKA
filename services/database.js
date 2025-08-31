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
            return null;
        }
    } catch (e) {
        console.error("Error getting document: ", e);
        throw e;
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

// ... (código anterior)

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
