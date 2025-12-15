// ============================================
// ADMIN ESTADÍSTICAS - KUENI KUENI
// Sistema completo de análisis y reportes
// ============================================
console.log('Sistema de estadísticas iniciando...');

let donacionesGlobal = [];
let sociosGlobal = [];
let eventosGlobal = [];
let añoSeleccionado = new Date().getFullYear();
let chartDonaciones = null;

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
            const tabName = this.dataset.tab;
            console.log(`Tab seleccionado: ${tabName}`);
            cambiarTab(tabName);
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
        inicializarGrafica();

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
        console.log(`${donacionesGlobal.length} donaciones cargadas`);

    } catch (error) {
        console.error('Error cargando donaciones:', error);
        donacionesGlobal = [];
    }
}

async function cargarSocios() {
    try {
        console.log('=== CARGANDO SOCIOS ===');
        
        const { data: usuarios, error } = await window.supabaseClient
            .from('usuarios')
            .select('*')
            .eq('tipo_usuario', 'socio');

        if (error) throw error;

        sociosGlobal = usuarios || [];
        console.log(`Total de socios cargados: ${sociosGlobal.length}`);
        
        console.log('Muestra de socios:', sociosGlobal.slice(0, 5).map(s => ({
            id: s.id,
            nombre: s.nombre,
            fecha_registro: s.fecha_registro,
            tipo_usuario: s.tipo_usuario
        })));
        
        const sociosPorAño = {};
        sociosGlobal.forEach(socio => {
            if (socio.fecha_registro) {
                const año = new Date(socio.fecha_registro).getFullYear();
                sociosPorAño[año] = (sociosPorAño[año] || 0) + 1;
            }
        });
        console.log('Socios por año:', sociosPorAño);

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

function calcularEstadisticas() {
    const donacionesAño = donacionesGlobal.filter(d => {
        const fecha = new Date(d.fecha_donacion);
        return fecha.getFullYear() === añoSeleccionado;
    });

    const donacionesCompletadas = donacionesAño.filter(d => d.estado_pago === 'completado');

    const totalRecaudado = donacionesCompletadas.reduce((sum, d) =>
        sum + parseFloat(d.monto || 0), 0
    );

    const promedioRecaudado = donacionesCompletadas.length > 0
        ? totalRecaudado / donacionesCompletadas.length
        : 0;

    const donacionesAñoAnterior = donacionesGlobal.filter(d => {
        const fecha = new Date(d.fecha_donacion);
        return fecha.getFullYear() === (añoSeleccionado - 1);
    });

    const totalAñoAnterior = donacionesAñoAnterior
        .filter(d => d.estado_pago === 'completado')
        .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);

    const crecimientoIngresos = totalAñoAnterior > 0
        ? ((totalRecaudado - totalAñoAnterior) / totalAñoAnterior) * 100
        : 0;

    document.getElementById('totalRecaudado').textContent =
        '$' + Math.round(totalRecaudado).toLocaleString('es-MX');
    actualizarCambio('cambioIngresos', crecimientoIngresos);

    document.getElementById('donacionPromedio').textContent =
        '$' + Math.round(promedioRecaudado).toLocaleString('es-MX');

    const promedioAnterior = donacionesAñoAnterior.filter(d => d.estado_pago === 'completado').length > 0
        ? donacionesAñoAnterior.filter(d => d.estado_pago === 'completado')
            .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0) /
        donacionesAñoAnterior.filter(d => d.estado_pago === 'completado').length
        : 0;

    const cambioPromedio = promedioAnterior > 0
        ? ((promedioRecaudado - promedioAnterior) / promedioAnterior) * 100
        : 0;

    actualizarCambio('cambioPromedio', cambioPromedio);

    const sociosActivos = sociosGlobal;
    document.getElementById('totalSocios').textContent = sociosActivos.length;

    const sociosAñoAnteriorActivos = sociosGlobal.filter(s => {
        if (!s.fecha_registro) return false;
        try {
            const fecha = new Date(s.fecha_registro);
            return fecha.getFullYear() < añoSeleccionado;
        } catch (error) {
            return false;
        }
    });

    const crecimientoSocios = sociosAñoAnteriorActivos.length > 0
        ? ((sociosActivos.length - sociosAñoAnteriorActivos.length) / sociosAñoAnteriorActivos.length) * 100
        : (sociosActivos.length > 0 ? 100 : 0);

    actualizarCambio('cambioSocios', crecimientoSocios);

    const eventosAño = eventosGlobal.filter(e => {
        const fecha = new Date(e.fecha_evento);
        return fecha.getFullYear() === añoSeleccionado;
    });

    const eventosCompletados = eventosAño.filter(e => e.estado === 'completado');
    document.getElementById('totalEventos').textContent = eventosCompletados.length;

    const eventosProximos = eventosGlobal.filter(e => {
        const fechaEvento = new Date(e.fecha_evento);
        return fechaEvento > new Date() && e.estado === 'proximo';
    });

    document.querySelector('.est-desc').textContent = `${eventosProximos.length} próximos`;

    const tasa = donacionesAño.length > 0
        ? (donacionesCompletadas.length / donacionesAño.length) * 100
        : 0;

    const maxDonacion = donacionesCompletadas.length > 0
        ? Math.max(...donacionesCompletadas.map(d => parseFloat(d.monto)))
        : 0;

    document.querySelectorAll('.analysis-grid .analysis-item')[0]
        .querySelector('h4').textContent = '$' + Math.round(totalRecaudado).toLocaleString('es-MX');
    document.querySelectorAll('.analysis-grid .analysis-item')[0]
        .querySelector('.analysis-right span').textContent = donacionesCompletadas.length;

    document.querySelectorAll('.analysis-grid .analysis-item')[1]
        .querySelector('h4').textContent = '$' + Math.round(promedioRecaudado).toLocaleString('es-MX');
    document.querySelectorAll('.analysis-grid .analysis-item')[1]
        .querySelector('.analysis-right span').textContent = '$' + Math.round(maxDonacion).toLocaleString('es-MX');

    document.querySelectorAll('.analysis-grid .analysis-item')[2]
        .querySelector('h4').textContent = tasa.toFixed(1) + '%';
    document.querySelectorAll('.analysis-grid .analysis-item')[2]
        .querySelector('.analysis-right span').textContent = '+' + crecimientoIngresos.toFixed(1) + '%';

    console.log('Estadísticas calculadas');
}

function inicializarGrafica() {
    const ctx = document.getElementById('donacionesChart');
    if (!ctx) return;

    const datos = obtenerDatosMensuales();

    if (chartDonaciones) {
        chartDonaciones.data.datasets[0].data = datos;
        chartDonaciones.update();
        console.log('Gráfica actualizada');
        return;
    }

    const config = {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Monto',
                data: datos,
                borderColor: '#6366f1',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#18181b',
                    padding: 12,
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#e4e4e7',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return '$' + Math.round(context.parsed.y).toLocaleString('es-MX') + ' MXN';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + (value / 1000).toFixed(0) + 'k';
                        },
                        color: '#71717a',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: '#f4f4f5',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#71717a',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    };

    chartDonaciones = new Chart(ctx, config);
    console.log('Gráfica inicializada');
}

function obtenerDatosMensuales() {
    const meses = Array(12).fill(0);

    const donacionesAño = donacionesGlobal.filter(d => {
        const fecha = new Date(d.fecha_donacion);
        return fecha.getFullYear() === añoSeleccionado && d.estado_pago === 'completado';
    });

    donacionesAño.forEach(donacion => {
        const fecha = new Date(donacion.fecha_donacion);
        const mes = fecha.getMonth();
        meses[mes] += parseFloat(donacion.monto || 0);
    });

    return meses;
}

function obtenerSociosMensuales() {
    const meses = Array(12).fill(0);

    console.log(`Procesando socios para el año ${añoSeleccionado}...`);
    
    sociosGlobal.forEach(socio => {
        if (!socio.fecha_registro) {
            console.warn('Socio sin fecha_registro:', socio.id);
            return;
        }
        
        try {
            const fecha = new Date(socio.fecha_registro);
            const año = fecha.getFullYear();
            const mes = fecha.getMonth();
            
            if (año === añoSeleccionado) {
                meses[mes]++;
                console.log(`Socio ${socio.id} registrado en ${año}-${mes + 1}`);
            }
        } catch (error) {
            console.warn('Fecha inválida para socio:', socio.id, socio.fecha_registro);
        }
    });

    console.log(`Socios por mes en ${añoSeleccionado}:`, meses);
    console.log(`Total de socios en ${añoSeleccionado}: ${meses.reduce((a, b) => a + b, 0)}`);
    
    return meses;
}

function cambiarTab(tab) {
    console.log(`Cambiando a tab: ${tab}`);

    const chartCard = document.querySelector('.chart-card');
    const analysisCard = document.querySelector('.analysis-card');

    if (!chartCard || !analysisCard) return;

    switch (tab) {
        case 'donaciones':
            chartCard.querySelector('h3').textContent = 'Donaciones Mensuales';
            chartCard.querySelector('.chart-subtitle').textContent = 'Evolución de ingresos por donaciones (MXN)';
            analysisCard.querySelector('h3').textContent = 'Análisis de Donaciones';
            analysisCard.querySelector('.analysis-subtitle').textContent = 'Estadísticas detalladas del periodo';

            if (chartDonaciones) {
                const datos = obtenerDatosMensuales();
                chartDonaciones.data.datasets[0].data = datos;
                chartDonaciones.data.datasets[0].borderColor = '#6366f1';
                chartDonaciones.data.datasets[0].pointBackgroundColor = '#6366f1';
                
                chartDonaciones.options.scales.y.ticks.callback = function(value) {
                    return '$' + (value / 1000).toFixed(0) + 'k';
                };
                
                chartDonaciones.options.plugins.tooltip.callbacks.label = function(context) {
                    return '$' + Math.round(context.parsed.y).toLocaleString('es-MX') + ' MXN';
                };
                
                chartDonaciones.update('none');
            }
            break;

        case 'socios':
            chartCard.querySelector('h3').textContent = 'Nuevos Socios por Mes';
            chartCard.querySelector('.chart-subtitle').textContent = 'Número de socios que se registraron cada mes';
            analysisCard.querySelector('h3').textContent = 'Análisis de Socios';
            analysisCard.querySelector('.analysis-subtitle').textContent = 'Estadísticas de participación';

            if (chartDonaciones) {
                const datos = obtenerSociosMensuales();
                chartDonaciones.data.datasets[0].data = datos;
                chartDonaciones.data.datasets[0].borderColor = '#15803d';
                chartDonaciones.data.datasets[0].pointBackgroundColor = '#15803d';
                
                chartDonaciones.options.scales.y.ticks.callback = function(value) {
                    return Math.round(value).toString();
                };
                
                chartDonaciones.options.plugins.tooltip.callbacks.label = function(context) {
                    const cantidad = Math.round(context.parsed.y);
                    return cantidad + ' ' + (cantidad === 1 ? 'socio nuevo' : 'socios nuevos');
                };
                
                chartDonaciones.update('none');
                console.log('Gráfica de socios actualizada con datos:', datos);
            }
            break;

        case 'eventos':
            chartCard.querySelector('h3').textContent = 'Eventos por Mes';
            chartCard.querySelector('.chart-subtitle').textContent = 'Número de eventos realizados mensualmente';
            analysisCard.querySelector('h3').textContent = 'Análisis de Eventos';
            analysisCard.querySelector('.analysis-subtitle').textContent = 'Estadísticas de asistencia y ocupación';

            if (chartDonaciones) {
                const datos = obtenerEventosMensuales();
                chartDonaciones.data.datasets[0].data = datos;
                chartDonaciones.data.datasets[0].borderColor = '#1e40af';
                chartDonaciones.data.datasets[0].pointBackgroundColor = '#1e40af';
                
                chartDonaciones.options.scales.y.ticks.callback = function(value) {
                    return Math.round(value).toString();
                };
                
                chartDonaciones.options.plugins.tooltip.callbacks.label = function(context) {
                    const cantidad = Math.round(context.parsed.y);
                    return cantidad + ' ' + (cantidad === 1 ? 'evento' : 'eventos');
                };
                
                chartDonaciones.update('none');
            }
            break;
    }
}

function obtenerEventosMensuales() {
    const meses = Array(12).fill(0);

    const eventosAño = eventosGlobal.filter(e => {
        const fecha = new Date(e.fecha_evento);
        return fecha.getFullYear() === añoSeleccionado && e.estado === 'completado';
    });

    eventosAño.forEach(evento => {
        const fecha = new Date(evento.fecha_evento);
        const mes = fecha.getMonth();
        meses[mes]++;
    });

    return meses;
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

function mostrarLoader(mostrar) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = mostrar ? 'flex' : 'none';
    }
}

function mostrarNotificacion(mensaje, tipo) {
    const notif = document.createElement('div');
    notif.textContent = mensaje;

    const colores = {
        success: { bg: '#d1fae5', text: '#065f46' },
        info: { bg: '#dbeafe', text: '#1e40af' },
        error: { bg: '#fee2e2', text: '#dc2626' }
    };

    const color = colores[tipo] || colores.info;

    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${color.bg};
        color: ${color.text};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
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
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('Sistema de estadísticas cargado');
