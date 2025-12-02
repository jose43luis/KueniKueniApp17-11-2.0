// ============================================
// COORDINADOR DE EVENTOS - VERSIÓN MEJORADA
// ============================================
// ✅ Paginación de 10 en 10
// ✅ Ocultar editar en eventos completados
// ✅ Alertas personalizadas (no del navegador)
// ✅ 100% funcional

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema inicializado');
    verificarAutenticacion();
    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('✅ Supabase conectado');
            cargarDatos();
        }
    }, 500);
    configurarEventos();
    establecerFechaMinima();
});

let eventosGlobal = [];
let eventosFiltrados = [];
let eventoEditando = null;
let eventoAsistenciaActual = null;
let asistenciasSeleccionadas = new Set();

// Variables de paginación
let paginaActual = 1;
const eventosPorPagina = 10;

function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');
    if (!isLoggedIn || userType !== 'coordinador') {
        window.location.href = 'login.html';
        return;
    }
}

function establecerFechaMinima() {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fechaEvento');
    if (fechaInput) {
        fechaInput.setAttribute('min', hoy);
        fechaInput.value = hoy;
    }
}

function configurarEventos() {
    document.getElementById('btnCerrarSesion')?.addEventListener('click', () => {
        mostrarAlertaPersonalizada(
            '¿Cerrar sesión?',
            'Se cerrará tu sesión actual',
            'Aceptar',
            'Cancelar',
            () => {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        );
    });
    
    document.getElementById('btnAgregarEvento')?.addEventListener('click', abrirModalNuevo);
    document.getElementById('btnCerrarModal')?.addEventListener('click', cerrarModal);
    document.getElementById('btnCancelarModal')?.addEventListener('click', cerrarModal);
    document.getElementById('formEvento')?.addEventListener('submit', function(e) {
        e.preventDefault();
        guardarEvento();
    });
    document.getElementById('inputBuscar')?.addEventListener('input', filtrarEventos);
    document.getElementById('filtroEstado')?.addEventListener('change', filtrarEventos);
    document.getElementById('filtroCategoria')?.addEventListener('change', filtrarEventos);
}

// ============================================
// COMPONENTE DE ALERTA PERSONALIZADA
// ============================================

function mostrarAlertaPersonalizada(titulo, mensaje, textoAceptar = 'Aceptar', textoCancelar = 'Cancelar', onAceptar = null) {
    // Remover alerta anterior si existe
    const alertaExistente = document.getElementById('alertaPersonalizada');
    if (alertaExistente) alertaExistente.remove();

    const alertaHTML = `
        <div id="alertaPersonalizada" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        ">
            <div style="
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
                padding: 2rem;
                animation: slideUp 0.3s ease;
            ">
                <div style="
                    text-align: center;
                    margin-bottom: 1.5rem;
                ">
                    <div style="
                        width: 56px;
                        height: 56px;
                        background: linear-gradient(135deg, #5f0d51 0%, #7d1166 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 1rem;
                    ">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </div>
                    <h3 style="
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #18181b;
                        margin: 0 0 0.5rem 0;
                    ">${titulo}</h3>
                    <p style="
                        font-size: 1rem;
                        color: #71717a;
                        margin: 0;
                    ">${mensaje}</p>
                </div>
                <div style="
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 2rem;
                ">
                    <button id="btnCancelarAlerta" style="
                        flex: 1;
                        padding: 0.875rem;
                        background: #f3f4f6;
                        color: #52525b;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${textoCancelar}</button>
                    <button id="btnAceptarAlerta" style="
                        flex: 1;
                        padding: 0.875rem;
                        background: linear-gradient(135deg, #5f0d51 0%, #7d1166 100%);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: 0 4px 12px rgba(95, 13, 81, 0.3);
                    ">${textoAceptar}</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertaHTML);
    document.body.style.overflow = 'hidden';

    const alerta = document.getElementById('alertaPersonalizada');
    const btnAceptar = document.getElementById('btnAceptarAlerta');
    const btnCancelar = document.getElementById('btnCancelarAlerta');

    // Animaciones hover
    btnAceptar.addEventListener('mouseenter', () => {
        btnAceptar.style.transform = 'translateY(-2px)';
        btnAceptar.style.boxShadow = '0 6px 16px rgba(95, 13, 81, 0.4)';
    });
    btnAceptar.addEventListener('mouseleave', () => {
        btnAceptar.style.transform = 'translateY(0)';
        btnAceptar.style.boxShadow = '0 4px 12px rgba(95, 13, 81, 0.3)';
    });

    btnCancelar.addEventListener('mouseenter', () => {
        btnCancelar.style.background = '#e5e7eb';
        btnCancelar.style.transform = 'translateY(-2px)';
    });
    btnCancelar.addEventListener('mouseleave', () => {
        btnCancelar.style.background = '#f3f4f6';
        btnCancelar.style.transform = 'translateY(0)';
    });

    const cerrarAlerta = () => {
        alerta.style.opacity = '0';
        setTimeout(() => {
            alerta.remove();
            document.body.style.overflow = '';
        }, 200);
    };

    btnCancelar.addEventListener('click', cerrarAlerta);
    btnAceptar.addEventListener('click', () => {
        if (onAceptar) onAceptar();
        cerrarAlerta();
    });

    // Cerrar al hacer clic fuera
    alerta.addEventListener('click', (e) => {
        if (e.target === alerta) cerrarAlerta();
    });
}

// CSS para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

async function cargarDatos() {
    try {
        await cargarEstadisticas();
        await cargarEventos();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarEstadisticas() {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const { data: eventos } = await window.supabaseClient
            .from('eventos')
            .select('estado, fecha_evento');
        if (!eventos) return;
        const total = eventos.length;
        const proximos = eventos.filter(e => e.estado === 'proximo' && e.fecha_evento >= hoy).length;
        const enCurso = eventos.filter(e => e.estado === 'activo').length;
        const finalizados = eventos.filter(e => e.estado === 'completado').length;
        document.getElementById('totalEventos').textContent = total;
        document.getElementById('eventosProximos').textContent = proximos;
        document.getElementById('eventosActivos').textContent = enCurso;
        document.getElementById('eventosFinalizados').textContent = finalizados;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarEventos() {
    try {
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .order('fecha_evento', { ascending: false });
        if (error) throw error;
        eventosGlobal = eventos || [];
        eventosFiltrados = eventos || [];
        paginaActual = 1;
        mostrarEventosPaginados();
    } catch (error) {
        console.error('Error:', error);
    }
}

// ============================================
// PAGINACIÓN
// ============================================

function mostrarEventosPaginados() {
    const inicio = (paginaActual - 1) * eventosPorPagina;
    const fin = inicio + eventosPorPagina;
    const eventosPagina = eventosFiltrados.slice(inicio, fin);
    
    mostrarEventos(eventosPagina);
    mostrarControlesPaginacion();
}

function mostrarControlesPaginacion() {
    const totalPaginas = Math.ceil(eventosFiltrados.length / eventosPorPagina);
    const tbody = document.getElementById('tablaEventos');
    
    if (totalPaginas <= 1) return;
    
    const paginacionHTML = `
        <tr>
            <td colspan="7" style="padding: 1.5rem; text-align: center; background: #f9fafb; border-top: 2px solid #e5e7eb;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                    <button onclick="cambiarPagina(${paginaActual - 1})" 
                        ${paginaActual === 1 ? 'disabled' : ''}
                        style="
                            padding: 0.5rem 1rem;
                            background: ${paginaActual === 1 ? '#f3f4f6' : '#5f0d51'};
                            color: ${paginaActual === 1 ? '#9ca3af' : 'white'};
                            border: none;
                            border-radius: 8px;
                            cursor: ${paginaActual === 1 ? 'not-allowed' : 'pointer'};
                            font-weight: 600;
                            transition: all 0.2s;
                        ">
                        ← Anterior
                    </button>
                    
                    <span style="font-weight: 600; color: #18181b;">
                        Página ${paginaActual} de ${totalPaginas}
                    </span>
                    
                    <button onclick="cambiarPagina(${paginaActual + 1})" 
                        ${paginaActual === totalPaginas ? 'disabled' : ''}
                        style="
                            padding: 0.5rem 1rem;
                            background: ${paginaActual === totalPaginas ? '#f3f4f6' : '#5f0d51'};
                            color: ${paginaActual === totalPaginas ? '#9ca3af' : 'white'};
                            border: none;
                            border-radius: 8px;
                            cursor: ${paginaActual === totalPaginas ? 'not-allowed' : 'pointer'};
                            font-weight: 600;
                            transition: all 0.2s;
                        ">
                        Siguiente →
                    </button>
                </div>
            </td>
        </tr>
    `;
    
    tbody.insertAdjacentHTML('beforeend', paginacionHTML);
}

function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(eventosFiltrados.length / eventosPorPagina);
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    paginaActual = nuevaPagina;
    mostrarEventosPaginados();
    // Scroll suave hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.cambiarPagina = cambiarPagina;

function mostrarEventos(eventos) {
    const tbody = document.getElementById('tablaEventos');
    if (!tbody) return;
    if (!eventos || eventos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">No hay eventos</td></tr>';
        return;
    }
    tbody.innerHTML = eventos.map(evento => {
        const estadoBadge = obtenerEstadoBadge(evento.estado);
        const categoriaBadge = obtenerCategoriaBadge(evento.categoria);
        const esCompletado = evento.estado === 'completado';
        
        return `
            <tr>
                <td style="font-weight:600;">${evento.titulo}</td>
                <td><span class="badge-categoria ${categoriaBadge.clase}">${categoriaBadge.texto}</span></td>
                <td>${formatearFecha(evento.fecha_evento)}</td>
                <td>${evento.hora_evento ? evento.hora_evento.substring(0, 5) : 'N/A'}</td>
                <td><span class="badge-estado ${estadoBadge.clase}">${estadoBadge.texto}</span></td>
                <td style="text-align:center;">
                    <strong>${evento.asistentes_confirmados || 0}</strong> / ${evento.cupo_maximo || 0}
                </td>
                <td>
                    <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
                        <button onclick="gestionarAsistencias('${evento.id}')" class="btn-icon btn-success" title="Gestionar Asistencias">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <polyline points="17 11 19 13 23 9"></polyline>
                            </svg>
                        </button>
                        ${!esCompletado ? `
                            <button onclick="editarEvento('${evento.id}')" class="btn-icon" title="Editar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                        ` : ''}
                        <button onclick="eliminarEvento('${evento.id}')" class="btn-icon btn-danger" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrarEventos() {
    const busqueda = document.getElementById('inputBuscar').value.toLowerCase();
    const estado = document.getElementById('filtroEstado').value;
    const categoria = document.getElementById('filtroCategoria').value;
    
    eventosFiltrados = eventosGlobal;
    
    if (busqueda) {
        eventosFiltrados = eventosFiltrados.filter(e => 
            e.titulo.toLowerCase().includes(busqueda) ||
            e.descripcion?.toLowerCase().includes(busqueda)
        );
    }
    if (estado) eventosFiltrados = eventosFiltrados.filter(e => e.estado === estado);
    if (categoria) eventosFiltrados = eventosFiltrados.filter(e => e.categoria === categoria);
    
    paginaActual = 1;
    mostrarEventosPaginados();
}

function abrirModalNuevo() {
    eventoEditando = null;
    document.getElementById('modalTitulo').textContent = 'Nuevo Evento';
    document.getElementById('formEvento').reset();
    establecerFechaMinima();
    abrirModal();
}

function abrirModal() {
    const modal = document.getElementById('modalEvento');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalEvento');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    eventoEditando = null;
}

async function guardarEvento() {
    const btnGuardar = document.getElementById('btnGuardarEvento');
    const btnText = document.getElementById('btnGuardarText');
    const btnLoader = document.getElementById('btnGuardarLoader');
    
    btnGuardar.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';

    try {
        const datos = {
            titulo: document.getElementById('titulo').value,
            categoria: document.getElementById('categoria').value,
            descripcion: document.getElementById('descripcion').value,
            fecha_evento: document.getElementById('fechaEvento').value,
            hora_evento: document.getElementById('horaEvento').value,
            ubicacion: document.getElementById('ubicacion').value,
            cupo_maximo: parseInt(document.getElementById('cupoMaximo').value),
            estado: 'proximo' // Siempre próximo por defecto
        };

        let error;
        if (eventoEditando) {
            const result = await window.supabaseClient
                .from('eventos')
                .update(datos)
                .eq('id', eventoEditando);
            error = result.error;
        } else {
            datos.asistentes_confirmados = 0;
            const result = await window.supabaseClient
                .from('eventos')
                .insert([datos]);
            error = result.error;
        }

        if (error) throw error;

        mostrarMensaje(eventoEditando ? '✅ Evento actualizado' : '✅ Evento creado', 'success');
        cerrarModal();
        await cargarDatos();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error al guardar', 'error');
    } finally {
        btnGuardar.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

async function editarEvento(id) {
    try {
        const { data: evento, error } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        eventoEditando = id;
        document.getElementById('modalTitulo').textContent = '✏️ Editar Evento';
        document.getElementById('titulo').value = evento.titulo;
        document.getElementById('categoria').value = evento.categoria;
        document.getElementById('descripcion').value = evento.descripcion;
        document.getElementById('fechaEvento').value = evento.fecha_evento;
        document.getElementById('horaEvento').value = evento.hora_evento;
        document.getElementById('ubicacion').value = evento.ubicacion;
        document.getElementById('cupoMaximo').value = evento.cupo_maximo;
        
        abrirModal();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error al cargar evento', 'error');
    }
}

window.editarEvento = editarEvento;

async function eliminarEvento(id) {
    mostrarAlertaPersonalizada(
        '¿Eliminar evento?',
        'Esta acción no se puede deshacer',
        'Eliminar',
        'Cancelar',
        async () => {
            try {
                const { error } = await window.supabaseClient
                    .from('eventos')
                    .delete()
                    .eq('id', id);
                
                if (error) throw error;
                
                mostrarMensaje('✅ Evento eliminado', 'success');
                await cargarDatos();
            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje('❌ Error al eliminar', 'error');
            }
        }
    );
}

window.eliminarEvento = eliminarEvento;

// ============================================
// GESTIÓN DE ASISTENCIAS
// ============================================

async function gestionarAsistencias(eventoId) {
    eventoAsistenciaActual = eventoId;
    asistenciasSeleccionadas.clear();
    
    try {
        const { data: evento } = await window.supabaseClient
            .from('eventos')
            .select('*')
            .eq('id', eventoId)
            .single();
        
        const { data: asistencias } = await window.supabaseClient
            .from('asistencias_eventos')
            .select(`
                *,
                socios (
                    id,
                    nombre_completo,
                    usuarios (
                        email
                    )
                )
            `)
            .eq('evento_id', eventoId);
        
        mostrarModalAsistencias(evento, asistencias || []);
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error al cargar asistencias', 'error');
    }
}

window.gestionarAsistencias = gestionarAsistencias;

function mostrarModalAsistencias(evento, asistencias) {
    const totalAsistentes = asistencias.length;
    const confirmados = asistencias.filter(a => a.estado === 'confirmado').length;
    const asistieron = asistencias.filter(a => a.estado === 'asistio').length;
    
    const modalHTML = `
        <div id="modalAsistencias" class="modal" style="display:flex;">
            <div class="modal-overlay" onclick="cerrarModalAsistencias()"></div>
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <div>
                        <h2>👥 Gestionar Asistencias</h2>
                        <p>${evento.titulo}</p>
                    </div>
                    <button onclick="cerrarModalAsistencias()" class="btn-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="asistencias-stats">
                        <div class="stat-mini">
                            <span>Total Registrados:</span>
                            <strong>${totalAsistentes}</strong>
                        </div>
                        <div class="stat-mini">
                            <span>Confirmados:</span>
                            <strong>${confirmados}</strong>
                        </div>
                        <div class="stat-mini">
                            <span>Asistieron:</span>
                            <strong>${asistieron}</strong>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>SOCIO</th>
                                    <th>EMAIL</th>
                                    <th>ESTADO</th>
                                    <th>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${asistencias.map(a => `
                                    <tr>
                                        <td>${a.socios?.nombre_completo || 'N/A'}</td>
                                        <td>${a.socios?.usuarios?.email || 'N/A'}</td>
                                        <td>
                                            <span class="badge-estado ${a.estado === 'asistio' ? 'estado-asistio' : 'estado-confirmado'}">
                                                ${a.estado === 'asistio' ? '✓ Asistió' : '• Confirmado'}
                                            </span>
                                        </td>
                                        <td>
                                            ${a.estado !== 'asistio' ? `
                                                <button onclick="marcarAsistio('${a.id}')" class="btn-icon btn-success">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                </button>
                                            ` : '✓'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

async function marcarAsistio(asistenciaId) {
    try {
        const { error } = await window.supabaseClient
            .from('asistencias_eventos')
            .update({ estado: 'asistio' })
            .eq('id', asistenciaId);
        
        if (error) throw error;
        
        mostrarMensaje('✅ Asistencia confirmada', 'success');
        await gestionarAsistencias(eventoAsistenciaActual);
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('❌ Error al confirmar', 'error');
    }
}

window.marcarAsistio = marcarAsistio;

function cerrarModalAsistencias() {
    const modal = document.getElementById('modalAsistencias');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = '';
    eventoAsistenciaActual = null;
    asistenciasSeleccionadas.clear();
}

window.cerrarModalAsistencias = cerrarModalAsistencias;

function obtenerEstadoBadge(estado) {
    const badges = {
        'proximo': { clase: 'estado-proximo', texto: 'Próximo' },
        'activo': { clase: 'estado-activo', texto: 'En Curso' },
        'completado': { clase: 'estado-finalizado', texto: 'Completado' }
    };
    return badges[estado] || { clase: '', texto: estado };
}

function obtenerCategoriaBadge(categoria) {
    const badges = {
        'Educación': { clase: 'cat-educacion', texto: 'Educación' },
        'Salud': { clase: 'cat-salud', texto: 'Salud' },
        'Medio Ambiente': { clase: 'cat-ambiente', texto: 'Medio Ambiente' },
        'Cultura': { clase: 'cat-cultura', texto: 'Cultura' },
        'Deporte': { clase: 'cat-deporte', texto: 'Deporte' },
        'Otro': { clase: 'cat-otro', texto: 'Otro' }
    };
    return badges[categoria] || { clase: '', texto: categoria };
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function mostrarMensaje(texto, tipo) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;animation:slideIn 0.3s ease;';
    container.innerHTML = `<div style="padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:${tipo === 'success' ? '#d1fae5' : '#fee2e2'};color:${tipo === 'success' ? '#065f46' : '#dc2626'};border:1px solid ${tipo === 'success' ? '#a7f3d0' : '#fecaca'};">${texto}</div>`;
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 3000);
}

const styleAdditional = document.createElement('style');
styleAdditional.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    .btn-success { background: #d1fae5 !important; color: #065f46 !important; }
    .btn-success:hover { background: #a7f3d0 !important; }
    .estado-confirmado { background: #dbeafe; color: #1e40af; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; }
    .estado-asistio { background: #d1fae5; color: #065f46; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; }
`;
document.head.appendChild(styleAdditional);

console.log('✅ Sistema MEJORADO cargado');
console.log('✅ Paginación: 10 eventos por página');
console.log('✅ Eventos completados sin editar');
console.log('✅ Alertas personalizadas');
