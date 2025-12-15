// ============================================
// ADMIN ESTADÍSTICAS - KUENI KUENI  
// Sistema completo de análisis y reportes
// ============================================
console.log('Sistema de estadísticas iniciando...');

let donacionesGlobal = [];
let sociosGlobal = [];
let eventosGlobal = [];
let añoSeleccionado = new Date().getFullYear();
let tabActual = 'donaciones';

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM cargado');
    verificarAutenticacion();
    configurarEventos();

    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('Supabase conectado');
            cargarDatos();
        } else {
            console.error('Supabase no disponible');
            setTimeout(() => cargarDatos(), 1000);
        }
    }, 500);
});

function verificarAutenticacion() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');

    if (!isLoggedIn || userType !== 'admin') {
        window.location.href = 'login.html';
    }
}

function configurarEventos() {
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        yearSelect.addEventListener('change', function () {
            añoSeleccionado = parseInt(this.value);
            console.log(`Año seleccionado: ${añoSeleccionado}`);
            cargarDatos();
        });
    }

    const tabs = document.querySelectorAll('.tab-est');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            tabActual = this.dataset.tab;
            console.log(`Tab seleccionado: ${tabActual}`);
            cambiarTab(tabActual);
        });
    });

    document.querySelector('.btn-exportar')?.addEventListener('click', exportarReporte);
    document.querySelector('#btnExportarReporte')?.addEventListener('click', exportarReporte);
}

async function cargarDatos() {
    if (!window.supabaseClient) {
        console.error('Supabase no inicializado');
        return;
    }

    try {
        console.log('Cargando datos...');
        mostrarLoader(true);

        await Promise.all([
            cargarDonaciones(),
            cargarSocios(),
            cargarEventos()
        ]);

        calcularEstadisticas();
        cambiarTab(tabActual);

        mostrarLoader(false);
        console.log('Datos cargados correctamente');

    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarLoader(false);
    }
}

async function cargarDonaciones() {
    try {
        const { data: donaciones, error } = await window.supabaseClient
            .from('donaciones')
            .select('*')
            .order('fecha_donacion', { ascending: false });

        if (error) throw error;

        donacionesGlobal = donaciones || [];
        console.log('=== DONACIONES CARGADAS ===');
        console.log(`Total de donaciones: ${donacionesGlobal.length}`);
        
        if (donacionesGlobal.length > 0) {
            console.log('Primera donación:', donacionesGlobal[0]);
            console.log('Tipo de fecha_donacion:', typeof donacionesGlobal[0].fecha_donacion);
        }

    } catch (error) {
        console.error('Error cargando donaciones:', error);
        donacionesGlobal = [];
    }
}

async function cargarSocios() {
    try {
        const { data: usuarios, error } = await window.supabaseClient
            .from('usuarios')
            .select('*')
            .eq('tipo_usuario', 'socio');

        if (error) throw error;

        sociosGlobal = usuarios || [];
        console.log(`Total de socios cargados: ${sociosGlobal.length}`);

    } catch (error) {
        console.error('Error cargando socios:', error);
        sociosGlobal = [];
    }
}

async function cargarEventos() {
    try {
        const { data: eventos, error } = await window.supabaseClient
            .from('eventos')
            .select('*');

        if (error) throw error;

        eventosGlobal = eventos || [];
        console.log(`${eventosGlobal.length} eventos cargados`);

    } catch (error) {
        console.error('Error cargando eventos:', error);
        eventosGlobal = [];
    }
}

function obtenerAño(fechaString) {
    if (!fechaString) return null;
    
    try {
        // Crear objeto Date y obtener año directamente
        const fecha = new Date(fechaString);
        if (!isNaN(fecha.getTime())) {
            return fecha.getFullYear();
        }
    } catch (error) {
        console.error('Error parseando fecha:', fechaString);
    }
    
    return null;
}

function obtenerAñoYMes(fechaString) {
    if (!fechaString) return null;
    
    try {
        const fecha = new Date(fechaString);
        if (!isNaN(fecha.getTime())) {
            return {
                año: fecha.getFullYear(),
                mes: fecha.getMonth()
            };
        }
    } catch (error) {
        console.error('Error parseando fecha:', fechaString);
    }
    
    return null;
}

function calcularEstadisticas() {
    // Filtrar donaciones del año seleccionado
    const donacionesAño = donacionesGlobal.filter(d => {
        const año = obtenerAño(d.fecha_donacion);
        return año === añoSeleccionado;
    });

    console.log(`=== AÑO ${añoSeleccionado} ===`);
    console.log(`Donaciones del año: ${donacionesAño.length}`);

    // Filtrar completadas
    const donacionesCompletadas = donacionesAño.filter(d => {
        const estado = (d.estado_pago || '').toLowerCase().trim();
        return estado === 'completado' || estado === 'completada' || estado === 'pagado' || estado === 'pagada' || estado === 'aprobado' || estado === 'aprobada';
    });
    
    console.log(`Donaciones completadas: ${donacionesCompletadas.length}`);

    const totalRecaudado = donacionesCompletadas.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);
    const promedioRecaudado = donacionesCompletadas.length > 0 ? totalRecaudado / donacionesCompletadas.length : 0;

    const donacionesAñoAnterior = donacionesGlobal.filter(d => {
        const año = obtenerAño(d.fecha_donacion);
        return año === (añoSeleccionado - 1);
    });

    const totalAñoAnterior = donacionesAñoAnterior
        .filter(d => {
            const estado = (d.estado_pago || '').toLowerCase().trim();
            return estado === 'completado' || estado === 'completada' || estado === 'pagado' || estado === 'pagada';
        })
        .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);

    const crecimientoIngresos = totalAñoAnterior > 0
        ? ((totalRecaudado - totalAñoAnterior) / totalAñoAnterior) * 100
        : 0;

    document.getElementById('totalRecaudado').textContent = '$' + Math.round(totalRecaudado).toLocaleString('es-MX');
    actualizarCambio('cambioIngresos', crecimientoIngresos);

    document.getElementById('donacionPromedio').textContent = '$' + Math.round(promedioRecaudado).toLocaleString('es-MX');

    const promedioAnterior = donacionesAñoAnterior.filter(d => {
        const estado = (d.estado_pago || '').toLowerCase().trim();
        return estado === 'completado' || estado === 'completada' || estado === 'pagado' || estado === 'pagada';
    }).length > 0
        ? donacionesAñoAnterior.filter(d => {
            const estado = (d.estado_pago || '').toLowerCase().trim();
            return estado === 'completado' || estado === 'completada' || estado === 'pagado' || estado === 'pagada';
        })
            .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0) /
        donacionesAñoAnterior.filter(d => {
            const estado = (d.estado_pago || '').toLowerCase().trim();
            return estado === 'completado' || estado === 'completada' || estado === 'pagado' || estado === 'pagada';
        }).length
        : 0;

    const cambioPromedio = promedioAnterior > 0
        ? ((promedioRecaudado - promedioAnterior) / promedioAnterior) * 100
        : 0;

    actualizarCambio('cambioPromedio', cambioPromedio);

    const sociosDelAñoSeleccionado = sociosGlobal.filter(s => {
        if (!s.fecha_registro) return false;
        const año = obtenerAño(s.fecha_registro);
        return año === añoSeleccionado;
    });

    document.getElementById('totalSocios').textContent = sociosDelAñoSeleccionado.length;

    const sociosAñoAnterior = sociosGlobal.filter(s => {
        if (!s.fecha_registro) return false;
        const año = obtenerAño(s.fecha_registro);
        return año === (añoSeleccionado - 1);
    });

    const crecimientoSocios = sociosAñoAnterior.length > 0
        ? ((sociosDelAñoSeleccionado.length - sociosAñoAnterior.length) / sociosAñoAnterior.length) * 100
        : (sociosDelAñoSeleccionado.length > 0 ? 100 : 0);

    actualizarCambio('cambioSocios', crecimientoSocios);

    const eventosAño = eventosGlobal.filter(e => {
        const año = obtenerAño(e.fecha_evento);
        return año === añoSeleccionado;
    });

    const eventosCompletados = eventosAño.filter(e => e.estado === 'completado');
    document.getElementById('totalEventos').textContent = eventosCompletados.length;

    const eventosProximos = eventosGlobal.filter(e => {
        const fechaEvento = new Date(e.fecha_evento);
        return fechaEvento > new Date() && e.estado === 'proximo';
    });

    document.querySelector('.est-desc').textContent = `${eventosProximos.length} próximos`;

    console.log('Estadísticas calculadas');
}

function cambiarTab(tab) {
    console.log(`Cambiando a tab: ${tab}`);
    
    const container = document.querySelector('.estadisticas-content');
    if (!container) return;

    if (tab === 'socios') {
        mostrarTablaSocios();
    } else if (tab === 'donaciones') {
        mostrarTablaDonaciones();
    } else if (tab === 'eventos') {
        mostrarTablaEventos();
    }
}

function mostrarTablaDonaciones() {
    const container = document.querySelector('.estadisticas-content');
    if (!container) return;

    // Filtrar donaciones del año seleccionado
    const donacionesDelAño = donacionesGlobal.filter(d => {
        if (!d.fecha_donacion) return false;
        const año = obtenerAño(d.fecha_donacion);
        if (año !== añoSeleccionado) return false;
        
        const estado = (d.estado_pago || '').toLowerCase().trim();
        return estado === 'completado' || estado === 'completada' || estado === 'pagado' || estado === 'pagada' || estado === 'aprobado' || estado === 'aprobada';
    });

    console.log(`Tabla: Mostrando ${donacionesDelAño.length} donaciones`);

    // Contar por mes
    const meses = Array(12).fill(0);
    const montosPorMes = Array(12).fill(0);
    
    donacionesDelAño.forEach(donacion => {
        const fechaInfo = obtenerAñoYMes(donacion.fecha_donacion);
        if (fechaInfo) {
            meses[fechaInfo.mes]++;
            montosPorMes[fechaInfo.mes] += parseFloat(donacion.monto || 0);
        }
    });

    const totalDonaciones = donacionesDelAño.length;
    const totalMonto = montosPorMes.reduce((a, b) => a + b, 0);
    const promedio = totalDonaciones > 0 ? totalMonto / totalDonaciones : 0;

    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const maxMonto = Math.max(...montosPorMes, 1);

    container.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
            <div style="margin-bottom: 2.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                        </svg>
                    </div>
                    <div>
                        <h2 style="color: #18181b; font-size: 1.75rem; font-weight: 700; margin: 0;">
                            Análisis de Donaciones ${añoSeleccionado}
                        </h2>
                        <p style="color: #71717a; font-size: 1rem; margin: 0.25rem 0 0 0;">
                            Desglose mensual de ingresos por donaciones
                        </p>
                    </div>
                </div>
            </div>

            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #5f0d51 0%, #7c1a6d 100%);">
                            <th style="padding: 1.25rem 1.5rem; text-align: left; color: white; font-weight: 600; font-size: 1rem; border-top-left-radius: 12px; width: 25%;">
                                Mes
                            </th>
                            <th style="padding: 1.25rem 1.5rem; text-align: center; color: white; font-weight: 600; font-size: 1rem;">
                                Donaciones
                            </th>
                            <th style="padding: 1.25rem 1.5rem; text-align: center; color: white; font-weight: 600; font-size: 1rem;">
                                Monto Total
                            </th>
                            <th style="padding: 1.25rem 1.5rem; text-align: left; color: white; font-weight: 600; font-size: 1rem; border-top-right-radius: 12px;">
                                Progreso
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mesesNombres.map((mes, index) => {
                            const cantidad = meses[index];
                            const monto = montosPorMes[index];
                            const porcentaje = maxMonto > 0 ? (monto / maxMonto) * 100 : 0;
                            const esParImpar = index % 2 === 0;
                            
                            return `
                                <tr style="background: ${esParImpar ? '#f9fafb' : 'white'}; transition: all 0.2s; cursor: pointer;" 
                                    onmouseover="this.style.background='#f0f9ff'; this.style.transform='scale(1.01)'"
                                    onmouseout="this.style.background='${esParImpar ? '#f9fafb' : 'white'}'; this.style.transform='scale(1)'">
                                    <td style="padding: 1.25rem 1.5rem; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; font-size: 1rem;">
                                        ${mes}
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; text-align: center; border-bottom: 1px solid #e5e7eb;">
                                        <span style="display: inline-block; min-width: 45px; padding: 0.5rem 1rem; background: ${cantidad > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f3f4f6'}; color: ${cantidad > 0 ? 'white' : '#9ca3af'}; font-weight: 700; font-size: 1.1rem; border-radius: 8px;">
                                            ${cantidad}
                                        </span>
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; text-align: center; border-bottom: 1px solid #e5e7eb;">
                                        <span style="display: inline-block; min-width: 80px; padding: 0.5rem 1rem; background: ${monto > 0 ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#f3f4f6'}; color: ${monto > 0 ? 'white' : '#9ca3af'}; font-weight: 700; font-size: 1.1rem; border-radius: 8px;">
                                            $${Math.round(monto).toLocaleString('es-MX')}
                                        </span>
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb;">
                                        <div style="background: #e5e7eb; height: 12px; border-radius: 999px; overflow: hidden; position: relative;">
                                            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${porcentaje}%; background: linear-gradient(90deg, #6366f1 0%, #4f46e5 100%); border-radius: 999px; transition: width 0.5s ease;"></div>
                                        </div>
                                        <span style="font-size: 0.75rem; color: #71717a; margin-top: 0.25rem; display: block;">
                                            ${porcentaje.toFixed(0)}% del mes mayor
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        <tr style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); font-weight: 700; border-top: 3px solid #6366f1;">
                            <td style="padding: 1.5rem; color: #18181b; font-size: 1.15rem; border-bottom-left-radius: 12px;">
                                TOTAL ${añoSeleccionado}
                            </td>
                            <td style="padding: 1.5rem; text-align: center;">
                                <span style="display: inline-block; padding: 0.5rem 1.25rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 1.3rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                    ${totalDonaciones}
                                </span>
                            </td>
                            <td style="padding: 1.5rem; text-align: center;">
                                <span style="display: inline-block; padding: 0.5rem 1.25rem; background: linear-gradient(135deg, #5f0d51 0%, #7c1a6d 100%); color: white; font-size: 1.3rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(95, 13, 81, 0.3);">
                                    $${Math.round(totalMonto).toLocaleString('es-MX')}
                                </span>
                            </td>
                            <td style="padding: 1.5rem; border-bottom-right-radius: 12px;">
                                <span style="color: #6366f1; font-size: 1rem; font-weight: 600;">
                                    ✓ Año completo
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function mostrarTablaSocios() {
    const container = document.querySelector('.estadisticas-content');
    if (!container) return;

    const sociosDelAño = sociosGlobal.filter(s => {
        if (!s.fecha_registro) return false;
        const año = obtenerAño(s.fecha_registro);
        return año === añoSeleccionado;
    });

    const meses = Array(12).fill(0);
    sociosDelAño.forEach(socio => {
        const fechaInfo = obtenerAñoYMes(socio.fecha_registro);
        if (fechaInfo) {
            meses[fechaInfo.mes]++;
        }
    });

    const total = sociosDelAño.length;
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const maxCantidad = Math.max(...meses, 1);

    container.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
            <div style="margin-bottom: 2.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div>
                        <h2 style="color: #18181b; font-size: 1.75rem; font-weight: 700; margin: 0;">
                            Nuevos Socios ${añoSeleccionado}
                        </h2>
                        <p style="color: #71717a; font-size: 1rem; margin: 0.25rem 0 0 0;">
                            Registro mensual de socios en la plataforma
                        </p>
                    </div>
                </div>
            </div>

            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #5f0d51 0%, #7c1a6d 100%);">
                            <th style="padding: 1.25rem 1.5rem; text-align: left; color: white; font-weight: 600; font-size: 1rem; border-top-left-radius: 12px; width: 30%;">
                                Mes
                            </th>
                            <th style="padding: 1.25rem 1.5rem; text-align: center; color: white; font-weight: 600; font-size: 1rem;">
                                Socios Registrados
                            </th>
                            <th style="padding: 1.25rem 1.5rem; text-align: left; color: white; font-weight: 600; font-size: 1rem; border-top-right-radius: 12px;">
                                Progreso
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mesesNombres.map((mes, index) => {
                            const cantidad = meses[index];
                            const porcentaje = maxCantidad > 0 ? (cantidad / maxCantidad) * 100 : 0;
                            const esParImpar = index % 2 === 0;
                            
                            return `
                                <tr style="background: ${esParImpar ? '#f9fafb' : 'white'}; transition: all 0.2s; cursor: pointer;" 
                                    onmouseover="this.style.background='#f0f9ff'; this.style.transform='scale(1.01)'"
                                    onmouseout="this.style.background='${esParImpar ? '#f9fafb' : 'white'}'; this.style.transform='scale(1)'">
                                    <td style="padding: 1.25rem 1.5rem; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; font-size: 1rem;">
                                        ${mes}
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; text-align: center; border-bottom: 1px solid #e5e7eb;">
                                        <span style="display: inline-block; min-width: 45px; padding: 0.5rem 1rem; background: ${cantidad > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f3f4f6'}; color: ${cantidad > 0 ? 'white' : '#9ca3af'}; font-weight: 700; font-size: 1.25rem; border-radius: 8px;">
                                            ${cantidad}
                                        </span>
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb;">
                                        <div style="background: #e5e7eb; height: 12px; border-radius: 999px; overflow: hidden; position: relative;">
                                            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${porcentaje}%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); border-radius: 999px; transition: width 0.5s ease;"></div>
                                        </div>
                                        <span style="font-size: 0.75rem; color: #71717a; margin-top: 0.25rem; display: block;">
                                            ${porcentaje.toFixed(0)}% del máximo
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        <tr style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); font-weight: 700; border-top: 3px solid #10b981;">
                            <td style="padding: 1.5rem; color: #18181b; font-size: 1.15rem; border-bottom-left-radius: 12px;">
                                TOTAL ${añoSeleccionado}
                            </td>
                            <td style="padding: 1.5rem; text-align: center;">
                                <span style="display: inline-block; padding: 0.5rem 1.25rem; background: linear-gradient(135deg, #5f0d51 0%, #7c1a6d 100%); color: white; font-size: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(95, 13, 81, 0.3);">
                                    ${total}
                                </span>
                            </td>
                            <td style="padding: 1.5rem; border-bottom-right-radius: 12px;">
                                <span style="color: #10b981; font-size: 1rem; font-weight: 600;">
                                    ✓ Año completo
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function mostrarTablaEventos() {
    const container = document.querySelector('.estadisticas-content');
    if (!container) return;

    // Filtrar eventos del año seleccionado
    const eventosDelAño = eventosGlobal.filter(e => {
        if (!e.fecha_evento) return false;
        const año = obtenerAño(e.fecha_evento);
        return año === añoSeleccionado;
    });

    console.log(`Tabla: Mostrando ${eventosDelAño.length} eventos`);

    // Contar por mes
    const meses = Array(12).fill(0);
    
    eventosDelAño.forEach(evento => {
        const fechaInfo = obtenerAñoYMes(evento.fecha_evento);
        if (fechaInfo) {
            meses[fechaInfo.mes]++;
        }
    });

    const totalEventos = eventosDelAño.length;
    const eventosCompletados = eventosDelAño.filter(e => e.estado === 'completado').length;
    const eventosProximos = eventosDelAño.filter(e => {
        const fechaEvento = new Date(e.fecha_evento);
        return fechaEvento > new Date();
    }).length;

    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const maxCantidad = Math.max(...meses, 1);

    container.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
            <div style="margin-bottom: 2.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                        </svg>
                    </div>
                    <div>
                        <h2 style="color: #18181b; font-size: 1.75rem; font-weight: 700; margin: 0;">
                            Análisis de Eventos ${añoSeleccionado}
                        </h2>
                        <p style="color: #71717a; font-size: 1rem; margin: 0.25rem 0 0 0;">
                            Calendario mensual de eventos realizados
                        </p>
                    </div>
                </div>
            </div>

            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #5f0d51 0%, #7c1a6d 100%);">
                            <th style="padding: 1.25rem 1.5rem; text-align: left; color: white; font-weight: 600; font-size: 1rem; border-top-left-radius: 12px; width: 30%;">
                                Mes
                            </th>
                            <th style="padding: 1.25rem 1.5rem; text-align: center; color: white; font-weight: 600; font-size: 1rem;">
                                Eventos Realizados
                            </th>
                            <th style="padding: 1.25rem 1.5rem; text-align: left; color: white; font-weight: 600; font-size: 1rem; border-top-right-radius: 12px;">
                                Progreso
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mesesNombres.map((mes, index) => {
                            const cantidad = meses[index];
                            const porcentaje = maxCantidad > 0 ? (cantidad / maxCantidad) * 100 : 0;
                            const esParImpar = index % 2 === 0;
                            
                            return `
                                <tr style="background: ${esParImpar ? '#f9fafb' : 'white'}; transition: all 0.2s; cursor: pointer;" 
                                    onmouseover="this.style.background='#f0f9ff'; this.style.transform='scale(1.01)'"
                                    onmouseout="this.style.background='${esParImpar ? '#f9fafb' : 'white'}'; this.style.transform='scale(1)'">
                                    <td style="padding: 1.25rem 1.5rem; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; font-size: 1rem;">
                                        ${mes}
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; text-align: center; border-bottom: 1px solid #e5e7eb;">
                                        <span style="display: inline-block; min-width: 45px; padding: 0.5rem 1rem; background: ${cantidad > 0 ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' : '#f3f4f6'}; color: ${cantidad > 0 ? 'white' : '#9ca3af'}; font-weight: 700; font-size: 1.25rem; border-radius: 8px;">
                                            ${cantidad}
                                        </span>
                                    </td>
                                    <td style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb;">
                                        <div style="background: #e5e7eb; height: 12px; border-radius: 999px; overflow: hidden; position: relative;">
                                            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${porcentaje}%; background: linear-gradient(90deg, #1e40af 0%, #1e3a8a 100%); border-radius: 999px; transition: width 0.5s ease;"></div>
                                        </div>
                                        <span style="font-size: 0.75rem; color: #71717a; margin-top: 0.25rem; display: block;">
                                            ${porcentaje.toFixed(0)}% del máximo
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        <tr style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); font-weight: 700; border-top: 3px solid #1e40af;">
                            <td style="padding: 1.5rem; color: #18181b; font-size: 1.15rem; border-bottom-left-radius: 12px;">
                                TOTAL ${añoSeleccionado}
                            </td>
                            <td style="padding: 1.5rem; text-align: center;">
                                <span style="display: inline-block; padding: 0.5rem 1.25rem; background: linear-gradient(135deg, #5f0d51 0%, #7c1a6d 100%); color: white; font-size: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(95, 13, 81, 0.3);">
                                    ${totalEventos}
                                </span>
                            </td>
                            <td style="padding: 1.5rem; border-bottom-right-radius: 12px;">
                                <span style="color: #1e40af; font-size: 1rem; font-weight: 600;">
                                    ✓ Año completo
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function actualizarCambio(elementoId, porcentaje) {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;

    const esPositivo = porcentaje >= 0;
    const icono = esPositivo ? '↑' : '↓';
    const clase = esPositivo ? 'positive' : 'negative';

    elemento.className = `est-change ${clase}`;
    elemento.textContent = `${icono} ${Math.abs(porcentaje).toFixed(1)}% vs año anterior`;
}

function exportarReporte() {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert('Error: jsPDF no está cargado');
            return;
        }
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        
        // === PORTADA OPTIMIZADA ===
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Franja morada superior
        doc.setFillColor(95, 13, 81);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        // Logo K y nombre EN LA MISMA LÍNEA
        doc.setFontSize(28);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('K', 15, 23);
        
        doc.setFontSize(16);
        doc.text('Kueni Kueni', 28, 23);
        
        // Título "Estadísticas y Reportes 2025" EN LA MISMA LÍNEA (derecha)
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Estadisticas y Reportes ' + añoSeleccionado, pageWidth - margin, 23, { align: 'right' });
        
        // Fecha generación (en la franja morada, debajo del título)
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(255, 255, 255);
        const ahora = new Date();
        const fechaGen = 'Generado el ' + ahora.toLocaleDateString('es-MX') + ', ' + ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
        doc.text(fechaGen, pageWidth - margin, 30, { align: 'right' });
        
        // PREPARAR DATOS
        const meses12 = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const donacionesAño = donacionesGlobal.filter(d => {
            if (!d.fecha_donacion) return false;
            const fecha = new Date(d.fecha_donacion);
            if (fecha.getFullYear() !== añoSeleccionado) return false;
            const estado = (d.estado_pago || '').toLowerCase().trim();
            return estado === 'completado' || estado === 'completada' || estado === 'pagado' || estado === 'pagada';
        });
        
        const mesesD = Array(12).fill(0);
        const montosM = Array(12).fill(0);
        donacionesAño.forEach(d => {
            const m = new Date(d.fecha_donacion).getMonth();
            mesesD[m]++;
            montosM[m] += parseFloat(d.monto || 0);
        });
        
        const totalRecaudado = montosM.reduce((a, b) => a + b, 0);
        const tablaD = meses12.map((m, i) => [m, mesesD[i].toString(), '$' + Math.round(montosM[i]).toLocaleString('es-MX')]);
        tablaD.push(['TOTAL', donacionesAño.length.toString(), '$' + Math.round(totalRecaudado).toLocaleString('es-MX')]);
        
        const sociosAño = sociosGlobal.filter(s => {
            if (!s.fecha_registro) return false;
            return new Date(s.fecha_registro).getFullYear() === añoSeleccionado;
        });
        
        const mesesS = Array(12).fill(0);
        sociosAño.forEach(s => mesesS[new Date(s.fecha_registro).getMonth()]++);
        const tablaS = meses12.map((m, i) => [m, mesesS[i].toString()]);
        tablaS.push(['TOTAL', sociosAño.length.toString()]);
        
        const eventosAño = eventosGlobal.filter(e => {
            if (!e.fecha_evento) return false;
            return new Date(e.fecha_evento).getFullYear() === añoSeleccionado;
        });
        
        const mesesE = Array(12).fill(0);
        eventosAño.forEach(e => mesesE[new Date(e.fecha_evento).getMonth()]++);
        const tablaE = meses12.map((m, i) => [m, mesesE[i].toString()]);
        tablaE.push(['TOTAL', eventosAño.length.toString()]);
        
        // === PRIMERA TABLA EN LA PORTADA ===
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(95, 13, 81);
        doc.text('Analisis de Donaciones', margin, 55);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Desglose mensual de ingresos por donaciones', margin, 62);
        
        doc.autoTable({
            startY: 68,
            head: [['Mes', 'Donaciones', 'Monto Total']],
            body: tablaD,
            theme: 'grid',
            headStyles: { 
                fillColor: [95, 13, 81], 
                textColor: 255, 
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: { fontSize: 9 },
            footStyles: { 
                fillColor: [240, 240, 240], 
                textColor: 0, 
                fontStyle: 'bold',
                fontSize: 9
            },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { left: margin, right: margin }
        });
        
        // Pie de página
        const finalY = doc.lastAutoTable.finalY || 270;
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('© ' + new Date().getFullYear() + ' Kueni Kueni. Todos los derechos reservados.', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // PAGINA 2: SOCIOS
        doc.addPage();
        agregarEncabezado(doc, 'Nuevos Socios', pageWidth, margin, añoSeleccionado);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Registro mensual de socios en la plataforma', margin, 55);
        
        doc.autoTable({
            startY: 62,
            head: [['Mes', 'Socios Registrados']],
            body: tablaS,
            theme: 'grid',
            headStyles: { 
                fillColor: [95, 13, 81], 
                textColor: 255, 
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: { fontSize: 9 },
            footStyles: { 
                fillColor: [240, 240, 240], 
                textColor: 0, 
                fontStyle: 'bold',
                fontSize: 9
            },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { left: margin, right: margin }
        });
        
        // Pie de página
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('© ' + new Date().getFullYear() + ' Kueni Kueni. Todos los derechos reservados.', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // PAGINA 3: EVENTOS
        doc.addPage();
        agregarEncabezado(doc, 'Analisis de Eventos', pageWidth, margin, añoSeleccionado);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Calendario mensual de eventos realizados', margin, 55);
        
        doc.autoTable({
            startY: 62,
            head: [['Mes', 'Eventos Realizados']],
            body: tablaE,
            theme: 'grid',
            headStyles: { 
                fillColor: [95, 13, 81], 
                textColor: 255, 
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: { fontSize: 9 },
            footStyles: { 
                fillColor: [240, 240, 240], 
                textColor: 0, 
                fontStyle: 'bold',
                fontSize: 9
            },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { left: margin, right: margin }
        });
        
        // Pie de página
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('© ' + new Date().getFullYear() + ' Kueni Kueni. Todos los derechos reservados.', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        doc.save('Estadisticas_KueniKueni_' + añoSeleccionado + '.pdf');
        
    } catch (error) {
        console.error('Error al exportar PDF:', error);
        alert('Error al generar el PDF');
    }
}

function agregarEncabezado(doc, titulo, pageWidth, margin, año) {
    // Franja morada
    doc.setFillColor(95, 13, 81);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo K y nombre
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('K', 15, 23);
    
    doc.setFontSize(16);
    doc.text('Kueni Kueni', 28, 23);
    
    // Título en la misma línea (derecha)
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Estadisticas y Reportes ' + año, pageWidth - margin, 23, { align: 'right' });
    
    // Fecha generación (en blanco, en la franja)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(255, 255, 255);
    const ahora = new Date();
    const fechaGen = 'Generado el ' + ahora.toLocaleDateString('es-MX') + ', ' + ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    doc.text(fechaGen, pageWidth - margin, 30, { align: 'right' });
    
    // Título de sección
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(95, 13, 81);
    doc.text(titulo, margin, 48);
}

function mostrarLoader(mostrar) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = mostrar ? 'flex' : 'none';
    }
}

console.log('Sistema de estadísticas cargado');
