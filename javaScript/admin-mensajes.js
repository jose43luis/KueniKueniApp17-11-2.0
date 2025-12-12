// admin-mensajes.js
console.log('Sistema de mensajes iniciando...');

// Variables globales
let sociosData = [];
let selectedSocio = null;

// Plantillas de mensajes
const PLANTILLAS = {
    bienvenida: {
        asunto: '¡Bienvenido a la familia Kueni Kueni! 🎉',
        contenido: `Estimado/a {nombre},

¡Es un honor darte la bienvenida a la familia Kueni Kueni - Paso a paso! 

Gracias por unirte a nuestra comunidad y ser parte de este hermoso proyecto que busca hacer la diferencia en nuestra sociedad. Tu apoyo es fundamental para poder seguir adelante con nuestra misión.

Como socio, ahora formas parte de una red de personas comprometidas con el bienestar de nuestra comunidad. Juntos podemos lograr grandes cosas.

Te invitamos a estar pendiente de nuestras actividades y eventos. ¡Tu participación es muy importante para nosotros!

Con cariño,
El equipo de Kueni Kueni`
    },
    agradecimiento: {
        asunto: 'Gracias por formar parte de Kueni Kueni ❤️',
        contenido: `Querido/a {nombre},

Queremos tomarnos un momento para agradecerte de corazón por ser parte de nuestra familia Kueni Kueni.

Tu apoyo y compromiso con nuestra causa nos impulsa a seguir trabajando día a día para hacer la diferencia en nuestra comunidad. Cada gesto cuenta, y tu participación es invaluable.

Gracias por creer en nosotros y en nuestra misión. Juntos estamos construyendo un mejor futuro, paso a paso.

Con profundo agradecimiento,
El equipo de Kueni Kueni`
    },
    recordatorio: {
        asunto: 'Recordatorio importante - Kueni Kueni 📌',
        contenido: `Hola {nombre},

Esperamos que te encuentres muy bien. Te escribimos para recordarte sobre [DESCRIBE EL EVENTO O ACTIVIDAD].

Detalles importantes:
• Fecha: [FECHA]
• Hora: [HORA]
• Lugar: [LUGAR]

Tu presencia es muy importante para nosotros. Si tienes alguna pregunta, no dudes en contactarnos.

¡Te esperamos!

El equipo de Kueni Kueni`
    },
    felicitacion: {
        asunto: '¡Felicidades! 🎊',
        contenido: `Querido/a {nombre},

¡Queremos enviarte nuestras más sinceras felicitaciones! 

[ESCRIBE AQUÍ EL MOTIVO DE LA FELICITACIÓN]

Estamos muy orgullosos de tenerte en nuestra familia Kueni Kueni. Tu dedicación y compromiso son una inspiración para todos nosotros.

¡Que sigan los éxitos!

Con cariño,
El equipo de Kueni Kueni`
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, iniciando sistema de mensajes...');
    await verificarAutenticacion();
    
    // Esperar a que supabaseClient esté disponible
    setTimeout(async () => {
        if (window.supabaseClient) {
            console.log('Supabase client disponible, cargando socios...');
            await cargarSocios();
        } else {
            console.error('⚠️ Supabase client no disponible');
            mostrarNotificacion('Error: No se pudo conectar con la base de datos', 'error');
        }
    }, 500);
    
    inicializarEventListeners();
    renderizarHistorial();
});

// Verificar autenticación
async function verificarAutenticacion() {
    console.log('Verificando autenticación...');
    
    // Verificar sesión básica
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    const userName = sessionStorage.getItem('userName');

    if (!isLoggedIn || userType !== 'admin') {
        console.log('Usuario no autenticado o no es admin');
        window.location.href = 'login.html';
        return;
    }

    // Actualizar nombre de usuario
    if (userName) {
        document.getElementById('userName').textContent = userName;
    }

    console.log('Usuario autenticado como admin:', userName);
}

// Cargar lista de socios
async function cargarSocios() {
    try {
        console.log('🔍 Iniciando carga de socios desde Supabase...');
        console.log('🔍 Cliente Supabase disponible:', !!window.supabaseClient);
        
        if (!window.supabaseClient) {
            throw new Error('Cliente de Supabase no disponible. Verifica que supabase-config.js esté cargado correctamente.');
        }

        console.log('📡 Consultando tabla usuarios...');
        
        // Primero intentamos obtener TODOS los usuarios para diagnóstico
        const { data: todosUsuarios, error: errorTodos } = await window.supabaseClient
            .from('usuarios')
            .select('id, nombre_completo, email, tipo_usuario, estado');
        
        console.log('📊 Total de usuarios en la base de datos:', todosUsuarios?.length || 0);
        console.log('📊 Usuarios completos:', todosUsuarios);

        // Ahora filtramos solo los socios activos
        const { data, error } = await window.supabaseClient
            .from('usuarios')
            .select('id, nombre_completo, email, tipo_usuario, estado')
            .eq('tipo_usuario', 'socio')
            .eq('estado', 'activo')
            .order('nombre_completo');

        if (error) {
            console.error('❌ Error de Supabase:', error);
            console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log('✅ Socios activos recibidos:', data);
        console.log('✅ Cantidad de socios activos:', data?.length || 0);

        if (!data || data.length === 0) {
            console.warn('⚠️ No se encontraron socios activos en la base de datos');
            
            // Mostrar mensaje más informativo
            if (todosUsuarios && todosUsuarios.length > 0) {
                const sociosTotales = todosUsuarios.filter(u => u.tipo_usuario === 'socio');
                const sociosInactivos = sociosTotales.filter(u => u.estado !== 'activo');
                
                console.log(`ℹ️ Total de usuarios registrados: ${todosUsuarios.length}`);
                console.log(`ℹ️ Total de socios (cualquier estado): ${sociosTotales.length}`);
                console.log(`ℹ️ Socios inactivos: ${sociosInactivos.length}`);
                
                mostrarNotificacion(
                    `No hay socios activos. Hay ${sociosTotales.length} socio(s) registrado(s) pero ninguno está activo.`,
                    'error'
                );
            } else {
                mostrarNotificacion('No hay usuarios registrados en el sistema', 'error');
            }
            
            sociosData = [];
        } else {
            sociosData = data;
            console.log(`✅ ${sociosData.length} socios cargados correctamente`);
            mostrarNotificacion(`${sociosData.length} socio(s) cargado(s) correctamente`, 'success');
        }

        renderizarSelectSocios();
    } catch (error) {
        console.error('❌ Error al cargar socios:', error);
        console.error('❌ Stack trace:', error.stack);
        mostrarNotificacion('Error al cargar la lista de socios: ' + error.message, 'error');
        sociosData = [];
        renderizarSelectSocios();
    }
}

// Renderizar select de socios
function renderizarSelectSocios() {
    const select = document.getElementById('selectDestinatario');
    
    if (!select) {
        console.error('Select de destinatario no encontrado');
        return;
    }

    select.innerHTML = '<option value="">Selecciona un socio...</option>';

    if (sociosData.length === 0) {
        select.innerHTML += '<option value="" disabled>No hay socios disponibles</option>';
        console.log('No hay socios para mostrar');
        return;
    }

    sociosData.forEach(socio => {
        const option = document.createElement('option');
        option.value = socio.id;
        option.textContent = socio.nombre_completo;
        option.dataset.email = socio.email;
        option.dataset.nombre = socio.nombre_completo;
        select.appendChild(option);
    });

    console.log(`✅ Select renderizado con ${sociosData.length} socios`);
}

// Inicializar event listeners
function inicializarEventListeners() {
    // Selección de socio
    const selectDestinatario = document.getElementById('selectDestinatario');
    if (selectDestinatario) {
        selectDestinatario.addEventListener('change', handleSocioSeleccionado);
    }

    // Plantillas
    document.querySelectorAll('.btn-plantilla').forEach(btn => {
        btn.addEventListener('click', () => cargarPlantilla(btn.dataset.plantilla));
    });

    // Contador de caracteres
    const contenidoMensaje = document.getElementById('contenidoMensaje');
    if (contenidoMensaje) {
        contenidoMensaje.addEventListener('input', actualizarContador);
        contenidoMensaje.addEventListener('input', actualizarVistaPrevia);
    }

    // Vista previa en tiempo real
    const asuntoMensaje = document.getElementById('asuntoMensaje');
    if (asuntoMensaje) {
        asuntoMensaje.addEventListener('input', actualizarVistaPrevia);
    }

    // Formulario
    const formEnviarMensaje = document.getElementById('formEnviarMensaje');
    if (formEnviarMensaje) {
        formEnviarMensaje.addEventListener('submit', handleSubmit);
    }

    // Botón limpiar
    const btnLimpiar = document.getElementById('btnLimpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormulario);
    }

    // Modal
    const btnCerrarModal = document.getElementById('btnCerrarModal');
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', cerrarModal);
    }

    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarModal);
    }

    const btnConfirmarEnvio = document.getElementById('btnConfirmarEnvio');
    if (btnConfirmarEnvio) {
        btnConfirmarEnvio.addEventListener('click', confirmarEnvio);
    }

    // Cerrar sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', cerrarSesion);
    }

    console.log('Event listeners inicializados');
}

// Manejar selección de socio
function handleSocioSeleccionado(e) {
    const select = e.target;
    const selectedOption = select.options[select.selectedIndex];
    
    console.log('Socio seleccionado:', select.value);
    
    if (select.value) {
        selectedSocio = {
            id: select.value,
            nombre: selectedOption.dataset.nombre,
            email: selectedOption.dataset.email
        };

        console.log('Datos del socio:', selectedSocio);

        // Mostrar información del destinatario
        document.getElementById('destinatarioEmail').textContent = selectedSocio.email;
        document.getElementById('destinatarioInfo').style.display = 'flex';
        
        actualizarVistaPrevia();
    } else {
        selectedSocio = null;
        document.getElementById('destinatarioInfo').style.display = 'none';
    }
}

// Cargar plantilla
function cargarPlantilla(tipo) {
    const plantilla = PLANTILLAS[tipo];
    if (plantilla) {
        document.getElementById('asuntoMensaje').value = plantilla.asunto;
        document.getElementById('contenidoMensaje').value = plantilla.contenido;
        actualizarContador();
        actualizarVistaPrevia();
        
        // Highlight del botón seleccionado
        document.querySelectorAll('.btn-plantilla').forEach(btn => {
            btn.style.borderColor = '#E5E7EB';
            btn.style.background = 'white';
        });
        event.currentTarget.style.borderColor = '#FF6B6B';
        event.currentTarget.style.background = '#FFF5F5';
        
        mostrarNotificacion('Plantilla cargada correctamente', 'success');
    }
}

// Actualizar contador de caracteres
function actualizarContador() {
    const contenido = document.getElementById('contenidoMensaje').value;
    document.getElementById('charCount').textContent = contenido.length;
}

// Actualizar vista previa
function actualizarVistaPrevia() {
    const contenido = document.getElementById('contenidoMensaje').value;
    const previewContent = document.getElementById('previewContent');
    
    if (contenido.trim()) {
        let contenidoPreview = contenido;
        
        // Reemplazar {nombre} con el nombre del socio seleccionado o un placeholder
        const nombreMostrar = selectedSocio ? selectedSocio.nombre : '[Nombre del socio]';
        contenidoPreview = contenidoPreview.replace(/{nombre}/gi, nombreMostrar);
        
        // Convertir saltos de línea a párrafos
        const parrafos = contenidoPreview.split('\n').filter(p => p.trim());
        previewContent.innerHTML = parrafos.map(p => `<p>${p}</p>`).join('');
    } else {
        previewContent.innerHTML = '<p class="preview-placeholder">La vista previa aparecerá aquí...</p>';
    }
}

// Manejar envío del formulario
function handleSubmit(e) {
    e.preventDefault();
    
    console.log('Intentando enviar mensaje...');
    console.log('Socio seleccionado:', selectedSocio);
    
    if (!selectedSocio) {
        mostrarNotificacion('Por favor selecciona un destinatario', 'error');
        return;
    }

    const asunto = document.getElementById('asuntoMensaje').value.trim();
    const contenido = document.getElementById('contenidoMensaje').value.trim();

    if (!asunto || !contenido) {
        mostrarNotificacion('Por favor completa el asunto y el mensaje', 'error');
        return;
    }

    // Mostrar modal de confirmación
    document.getElementById('confirmNombre').textContent = selectedSocio.nombre;
    document.getElementById('confirmEmail').textContent = selectedSocio.email;
    document.getElementById('modalConfirmacion').classList.add('show');
}

// Confirmar y enviar mensaje
async function confirmarEnvio() {
    cerrarModal();
    mostrarLoading(true);

    // Guardar datos del socio ANTES de cualquier cosa
    const socioGuardado = {
        id: selectedSocio.id,
        nombre: selectedSocio.nombre,
        email: selectedSocio.email
    };

    try {
        const asunto = document.getElementById('asuntoMensaje').value;
        const contenido = document.getElementById('contenidoMensaje').value;

        // Reemplazar {nombre} con el nombre real
        const contenidoFinal = contenido.replace(/{nombre}/gi, socioGuardado.nombre);

        console.log('Enviando mensaje a servidor...');

        // Enviar correo
        const response = await fetch('https://kuenikueniapp17-11-2-0.onrender.com/send-custom-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: socioGuardado.email,
                nombre: socioGuardado.nombre,
                asunto: asunto,
                mensaje: contenidoFinal
            })
        });

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            throw new Error(`Error del servidor (${response.status}): ${response.statusText}`);
        }

        // Intentar parsear JSON
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('Error al parsear JSON:', jsonError);
            throw new Error('El servidor no devolvió una respuesta válida');
        }

        console.log('Respuesta del servidor:', data);

        if (data.success) {
            // Guardar en historial ANTES de limpiar
            guardarEnHistorial(socioGuardado, asunto, contenidoFinal);
            
            // Limpiar formulario
            limpiarFormulario();
            
            // Mostrar notificación de éxito estilo SweetAlert
            mostrarNotificacionExito(socioGuardado.email);
        } else {
            throw new Error(data.error || 'Error al enviar el mensaje');
        }
    } catch (error) {
        console.error('❌ Error al enviar:', error);
        mostrarNotificacionError(error.message);
    } finally {
        mostrarLoading(false);
    }
}

// Guardar en historial (localStorage)
function guardarEnHistorial(socio, asunto, contenido) {
    const historial = JSON.parse(localStorage.getItem('mensajesEnviados') || '[]');
    
    historial.unshift({
        id: Date.now(),
        destinatario: socio.nombre,
        email: socio.email,
        asunto: asunto,
        contenido: contenido.substring(0, 100) + '...',
        fecha: new Date().toISOString()
    });

    // Mantener solo los últimos 20 mensajes
    if (historial.length > 20) {
        historial.pop();
    }

    localStorage.setItem('mensajesEnviados', JSON.stringify(historial));
    renderizarHistorial();
}

// Renderizar historial
function renderizarHistorial() {
    const historial = JSON.parse(localStorage.getItem('mensajesEnviados') || '[]');
    const container = document.getElementById('historialMensajes');

    if (!container) return;

    if (historial.length === 0) {
        container.innerHTML = `
            <div class="historial-vacio">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <p>Aún no has enviado mensajes</p>
            </div>
        `;
        return;
    }

    container.innerHTML = historial.map(msg => {
        const fecha = new Date(msg.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="historial-item">
                <div class="historial-item-header">
                    <span class="historial-destinatario">${msg.destinatario}</span>
                    <span class="historial-fecha">${fechaFormateada}</span>
                </div>
                <div class="historial-asunto">${msg.asunto}</div>
                <div class="historial-preview">${msg.contenido}</div>
            </div>
        `;
    }).join('');
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('formEnviarMensaje').reset();
    document.getElementById('destinatarioInfo').style.display = 'none';
    document.getElementById('previewContent').innerHTML = '<p class="preview-placeholder">La vista previa aparecerá aquí...</p>';
    document.getElementById('charCount').textContent = '0';
    selectedSocio = null;
    
    // Resetear colores de plantillas
    document.querySelectorAll('.btn-plantilla').forEach(btn => {
        btn.style.borderColor = '#E5E7EB';
        btn.style.background = 'white';
    });
}

// Modal functions
function cerrarModal() {
    document.getElementById('modalConfirmacion').classList.remove('show');
}

// Loading overlay
function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (mostrar) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }
}

// Notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notif = document.createElement('div');
    notif.className = `notificacion notificacion-${tipo}`;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${tipo === 'success' ? '#10B981' : tipo === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    notif.textContent = mensaje;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Cerrar sesión
async function cerrarSesion() {
    try {
        sessionStorage.clear();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);

// Notificación de éxito estilo SweetAlert
function mostrarNotificacionExito(email) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 40px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #5f0d51 0%, #8b1a7a 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px auto;
        ">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>
        <h2 style="
            font-size: 28px;
            font-weight: 700;
            color: #1F2937;
            margin: 0 0 12px 0;
        ">¡Mensaje Enviado!</h2>
        <p style="
            font-size: 16px;
            color: #6B7280;
            margin: 0 0 8px 0;
            line-height: 1.6;
        ">El correo ha sido enviado exitosamente a:</p>
        <p style="
            font-size: 16px;
            font-weight: 600;
            color: #5f0d51;
            margin: 0 0 32px 0;
        ">${email}</p>
        <button onclick="this.parentElement.parentElement.remove()" style="
            background: linear-gradient(135deg, #5f0d51 0%, #8b1a7a 100%);
            color: white;
            border: none;
            padding: 14px 40px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(95, 13, 81, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">Aceptar</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Cerrar al hacer click fuera del modal
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// Notificación de error estilo SweetAlert
function mostrarNotificacionError(mensajeError) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 40px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px auto;
        ">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </div>
        <h2 style="
            font-size: 28px;
            font-weight: 700;
            color: #1F2937;
            margin: 0 0 12px 0;
        ">Error al Enviar</h2>
        <p style="
            font-size: 16px;
            color: #6B7280;
            margin: 0 0 32px 0;
            line-height: 1.6;
        ">${mensajeError}</p>
        <button onclick="this.parentElement.parentElement.remove()" style="
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            color: white;
            border: none;
            padding: 14px 40px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(239, 68, 68, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">Aceptar</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Cerrar al hacer click fuera del modal
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

console.log('✅ Sistema de mensajes cargado');
