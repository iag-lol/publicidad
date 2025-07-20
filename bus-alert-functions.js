// ===== FUNCIONES GLOBALES PARA ALERTA DE BUS YA INSPECCIONADO =====
// Estas funciones DEBEN estar en el scope global más alto para que los botones onclick funcionen

function hideBusInspectionAlert() {
    const alertElement = document.getElementById('bus-inspection-alert');
    if (alertElement) {
        alertElement.style.opacity = '0';
        
        // Animación responsive para ocultar
        if (window.innerWidth <= 768) {
            alertElement.style.transform = 'translateY(-20px)';
        } else {
            alertElement.style.transform = 'translate(-50%, -20px)';
        }
        
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 300);
    }
}

function overwriteInspection(ppu) {
    // Verificar que allInspections esté disponible
    if (typeof allInspections === 'undefined') {
        console.warn('allInspections no está disponible aún');
        hideBusInspectionAlert();
        return;
    }
    
    // Buscar la inspección existente
    const existingInspection = allInspections.find(insp => 
        insp.ppu.toLowerCase() === ppu.toLowerCase()
    );
    
    if (existingInspection) {
        // Mostrar confirmación
        if (confirm(`¿Estás seguro de que quieres sobrescribir la inspección del bus ${ppu}?\n\nEsta acción eliminará el registro anterior y creará uno nuevo.`)) {
            // Eliminar la inspección anterior
            deleteInspection(existingInspection.id);
        }
    }
    
    hideBusInspectionAlert();
}

async function deleteInspection(inspectionId) {
    try {
        if (typeof showLoader === 'function') {
            showLoader('Eliminando inspección anterior...');
        }
        
        if (!dbClient) throw new Error("Cliente de Supabase no inicializado.");
        
        const { error } = await dbClient
            .from('levantamiento_de_publicidad')
            .delete()
            .eq('id', inspectionId);
        
        if (error) throw error;
        
        // Actualizar datos locales
        allInspections = allInspections.filter(insp => insp.id !== inspectionId);
        
        // Actualizar estadísticas si las funciones están disponibles
        if (typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }
        if (typeof updateFleetCounters === 'function') {
            updateFleetCounters();
        }
        
        if (currentView === 'analytics' && typeof renderTerminalsComparison === 'function') {
            renderTerminalsComparison();
        }
        if (typeof updateKPIs === 'function') {
            updateKPIs();
        }
        
        if (typeof updateNotificationsPanel === 'function') {
            updateNotificationsPanel();
        }
        
        if (typeof showToast === 'function') {
            showToast('Inspección anterior eliminada. Puedes proceder con el nuevo registro.', 'success');
        }
        
    } catch (error) {
        console.error('Error deleting inspection:', error);
        if (typeof showToast === 'function') {
            showToast(`Error al eliminar inspección: ${error.message}`, 'error');
        }
    } finally {
        if (typeof hideLoader === 'function') {
            hideLoader();
        }
    }
}

function showBusInspectionAlert(inspection) {
    // Crear o actualizar la alerta
    let alertElement = document.getElementById('bus-inspection-alert');
    
    if (!alertElement) {
        alertElement = document.createElement('div');
        alertElement.id = 'bus-inspection-alert';
        alertElement.className = 'fixed top-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg shadow-lg p-4 max-w-md z-[9999] mx-auto';
        document.body.appendChild(alertElement);
    }
    
    const terminal = inspection.terminal || 'Terminal desconocido';
    const inspector = inspection.inspector_name || 'Inspector';
    const date = inspection.created_at ? new Date(inspection.created_at).toLocaleDateString('es-ES') : 'Fecha desconocida';
    const hasIssues = inspection.dano_pintura || inspection.residuos_pegamento;
    
    alertElement.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <div class="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-white">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                </div>
            </div>
            <div class="ml-3 flex-1 min-w-0">
                <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ¡Bus ya inspeccionado!
                </h3>
                <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <p class="truncate"><strong>PPU:</strong> ${inspection.ppu}</p>
                    <p class="truncate"><strong>Terminal:</strong> ${terminal}</p>
                    <p class="truncate"><strong>Inspector:</strong> ${inspector}</p>
                    <p class="truncate"><strong>Fecha:</strong> ${date}</p>
                    ${hasIssues ? '<p class="mt-1 text-red-600 dark:text-red-400"><strong>⚠️ Tiene problemas registrados</strong></p>' : ''}
                </div>
                <div class="mt-3 flex flex-col sm:flex-row gap-2">
                    <button onclick="overwriteInspection('${inspection.ppu}')" class="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium px-3 py-2 rounded-md transition-colors flex-1 sm:flex-none">
                        Sobrescribir
                    </button>
                    <button onclick="hideBusInspectionAlert()" class="bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium px-3 py-2 rounded-md transition-colors flex-1 sm:flex-none">
                        Cancelar
                    </button>
                </div>
            </div>
            <button onclick="hideBusInspectionAlert()" class="ml-2 text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 flex-shrink-0">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;
    
    // Mostrar la alerta con animación
    alertElement.style.display = 'block';
    alertElement.style.opacity = '0';
    
    // Animación responsive
    if (window.innerWidth <= 768) {
        // Móvil: animación vertical simple
        alertElement.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            alertElement.style.opacity = '1';
            alertElement.style.transform = 'translateY(0)';
        }, 10);
    } else {
        // Desktop: animación centrada
        alertElement.style.transform = 'translate(-50%, -20px)';
        setTimeout(() => {
            alertElement.style.opacity = '1';
            alertElement.style.transform = 'translate(-50%, 0)';
        }, 10);
    }
}

// Función mejorada para verificar estado de inspección - se ejecuta inmediatamente
function checkBusInspectionStatus(ppu) {
    if (!ppu) {
        hideBusInspectionAlert();
        hideBusStatusIndicator();
        return;
    }
    
    // Verificar que allInspections esté disponible
    if (typeof allInspections === 'undefined') {
        console.warn('allInspections no está disponible aún, verificando en 500ms...');
        // Reintentar después de un breve delay
        setTimeout(() => checkBusInspectionStatus(ppu), 500);
        return;
    }
    
    const existingInspection = allInspections.find(insp => 
        insp.ppu.toLowerCase() === ppu.toLowerCase()
    );
    
    if (existingInspection) {
        showBusInspectionAlert(existingInspection);
        showBusStatusIndicator();
    } else {
        hideBusInspectionAlert();
        hideBusStatusIndicator();
    }
}

// Función para verificar inmediatamente cuando se selecciona un bus
function onBusSelected(ppu) {
    if (!ppu) return;
    
    // Verificar inmediatamente
    checkBusInspectionStatus(ppu);
    
    // También verificar después de un breve delay por si los datos se cargan después
    setTimeout(() => {
        checkBusInspectionStatus(ppu);
    }, 100);
    
    // Verificar una vez más después de 1 segundo para asegurar
    setTimeout(() => {
        checkBusInspectionStatus(ppu);
    }, 1000);
}

function showBusStatusIndicator() {
    const indicator = document.getElementById('bus-status-indicator');
    if (indicator) {
        indicator.classList.remove('hidden');
    }
}

function hideBusStatusIndicator() {
    const indicator = document.getElementById('bus-status-indicator');
    if (indicator) {
        indicator.classList.add('hidden');
    }
}

// Función para verificar que el formulario esté listo antes de registrar
function ensureFormReady() {
    // Verificar que todos los elementos necesarios estén disponibles
    const requiredElements = [
        'inspection-form',
        'ppu',
        'numero_interno',
        'marca_chasis'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Elementos faltantes del formulario:', missingElements);
        if (typeof showToast === 'function') {
            showToast('Error: Formulario no está completamente cargado. Por favor, recarga la página.', 'error');
        }
        return false;
    }
    
    // Verificar que el cliente de Supabase esté disponible
    if (typeof dbClient === 'undefined' || !dbClient) {
        console.error('Cliente de Supabase no inicializado');
        if (typeof showToast === 'function') {
            showToast('Error: Conexión a la base de datos no disponible. Por favor, recarga la página.', 'error');
        }
        return false;
    }
    
    return true;
}

// Función para registrar inspección con verificaciones mejoradas
async function registerInspection(formData) {
    try {
        // Verificar que el formulario esté listo
        if (!ensureFormReady()) {
            return false;
        }
        
        // Verificar que se haya seleccionado un bus
        const ppu = document.getElementById('ppu').value;
        const numeroInterno = document.getElementById('numero_interno').value;
        
        if (!ppu || !numeroInterno) {
            if (typeof showToast === 'function') {
                showToast('Debe seleccionar un bus de la lista antes de registrar.', 'warning');
            }
            return false;
        }
        
        // Verificar si el bus ya fue inspeccionado
        if (typeof allInspections !== 'undefined' && allInspections) {
            const existingInspection = allInspections.find(insp => 
                insp.ppu.toLowerCase() === ppu.toLowerCase()
            );
            
            if (existingInspection) {
                if (typeof showToast === 'function') {
                    showToast('Este bus ya fue inspeccionado. Verifica la alerta arriba.', 'warning');
                }
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error en registerInspection:', error);
        if (typeof showToast === 'function') {
            showToast('Error al verificar el formulario. Por favor, recarga la página.', 'error');
        }
        return false;
    }
} 